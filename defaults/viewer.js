/**
 * Task Viewer JavaScript
 * タスクビューアーのメインスクリプト
 * 検索、表示、モーダル管理機能
 */

(function() {
    'use strict';
    
    // グローバル変数
    let tasksData = {};
    let allTaskCards = [];
    let searchHistory = JSON.parse(localStorage.getItem('taskSearchHistory') || '[]');
    let autoUpdateTimer = null;
    let fullTextSearchEnabled = false;
    let searchDebounceTimer = null;
    let searchIndexCache = null;  // 検索インデックスのキャッシュ
    
    // 検索機能
    function initSearch() {
            const searchBox = document.getElementById('search-box');
            const searchResults = document.getElementById('search-results');
            const searchModeToggle = document.getElementById('search-mode-toggle');
            
            // 検索履歴ドロップダウンを作成
            const historyDropdown = document.createElement('div');
            historyDropdown.className = 'search-history-dropdown';
            historyDropdown.style.display = 'none';
            searchBox.parentElement.appendChild(historyDropdown);
            
            // 検索履歴を表示
            function showSearchHistory() {
                if (searchHistory.length === 0) {
                    historyDropdown.style.display = 'none';
                    return;
                }
                
                historyDropdown.innerHTML = searchHistory.map(query => 
                    `<div class="search-history-item" data-query="${escapeHtml(query)}">
                        <span class="history-icon">🕐</span>
                        <span class="history-text">${escapeHtml(query)}</span>
                    </div>`
                ).join('');
                
                historyDropdown.style.display = 'block';
                
                // 履歴アイテムのクリックイベント
                historyDropdown.querySelectorAll('.search-history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const query = item.getAttribute('data-query');
                        searchBox.value = query;
                        performSearch(query);
                        historyDropdown.style.display = 'none';
                    });
                });
            }
            
            // 検索ボックスのフォーカスイベント
            searchBox.addEventListener('focus', () => {
                if (searchBox.value === '') {
                    showSearchHistory();
                }
            });
            
            // 検索ボックスの外側クリックで履歴を隠す
            document.addEventListener('click', (e) => {
                if (!searchBox.parentElement.contains(e.target)) {
                    historyDropdown.style.display = 'none';
                }
            });
            
            // 検索モード切り替え
            searchModeToggle.addEventListener('click', async () => {
                fullTextSearchEnabled = !fullTextSearchEnabled;
                searchModeToggle.classList.toggle('active', fullTextSearchEnabled);
                searchModeToggle.textContent = fullTextSearchEnabled ? '📄 全文検索 ON' : '📄 全文検索 OFF';
                
                // 全文検索を有効にした場合、必要に応じて全文データを読み込む
                if (fullTextSearchEnabled) {
                    await loadFullTextContent();
                }
                
                // 現在の検索クエリで再検索
                const query = searchBox.value.toLowerCase().trim();
                if (query) {
                    performSearch(query);
                }
            });
            
            // 検索ボックスの入力イベント（デバウンス付き）
            searchBox.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                
                // 履歴ドロップダウンを隠す
                if (query !== '') {
                    historyDropdown.style.display = 'none';
                }
                
                // デバウンス処理
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    performSearch(query);
                }, 300); // 300ms遅延
            });
            
            // 検索履歴の管理
            searchBox.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    saveSearchHistory(e.target.value.trim());
                    historyDropdown.style.display = 'none';
                }
                if (e.key === 'Escape') {
                    e.target.value = '';
                    performSearch('');
                    e.target.blur();
                    historyDropdown.style.display = 'none';
                }
            });
            
            // キーボードショートカット (Cmd+K / Ctrl+K)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    searchBox.focus();
                    searchBox.select();
                }
            });
        }
        
        // 全文検索用のコンテンツ読み込み
        async function loadFullTextContent() {
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay.classList.add('active');
            
            try {
                // 検索インデックスが既に読み込まれている場合はスキップ
                if (searchIndexCache) {
                    loadingOverlay.classList.remove('active');
                    return;
                }
                
                // tasks_search.jsonから一括読み込み（高速）
                try {
                    const response = await fetch('tasks_search.json');
                    if (response.ok) {
                        searchIndexCache = await response.json();
                        
                        // allTaskCardsにコンテンツを設定
                        searchIndexCache.tasks.forEach(task => {
                            const card = allTaskCards.find(c => c.filename === task.filename);
                            if (card) {
                                card.content = task.content;
                            }
                        });
                        
                        console.log(`検索インデックスから${searchIndexCache.tasks.length}件を読み込みました`);
                        loadingOverlay.classList.remove('active');
                        return;
                    }
                } catch (err) {
                    console.warn('Search index not found, falling back to individual files');
                }
                
                // フォールバック: 各タスクのmdファイルを読み込む
                const needsLoading = allTaskCards.some(card => !card.content);
                if (!needsLoading) {
                    loadingOverlay.classList.remove('active');
                    return;
                }
                
                for (const card of allTaskCards) {
                    if (!card.content && card.path) {
                        try {
                            const response = await fetch(card.path);
                            if (response.ok) {
                                card.content = await response.text();
                            }
                        } catch (err) {
                            console.warn(`Failed to load content for ${card.path}:`, err);
                            card.content = '';
                        }
                    }
                }
            } finally {
                loadingOverlay.classList.remove('active');
            }
        }
        
        function performSearch(query) {
            const searchResults = document.getElementById('search-results');
            let matchCount = 0;
            
            if (!query) {
                // 検索クリア時は全タスク表示
                allTaskCards.forEach(card => {
                    card.element.classList.remove('search-hidden');
                    // ハイライト削除
                    const title = card.element.querySelector('.task-title');
                    const id = card.element.querySelector('.task-id');
                    const preview = card.element.querySelector('.content-preview');
                    if (title) title.textContent = card.originalTitle;
                    if (id) id.textContent = card.originalId;
                    if (preview) preview.remove();
                });
                searchResults.classList.remove('active');
                startAutoUpdate(); // 自動更新再開
                return;
            }
            
            stopAutoUpdate(); // 検索中は自動更新停止
            
            // 検索実行
            allTaskCards.forEach(card => {
                const idMatch = card.id.toLowerCase().includes(query);
                const titleMatch = card.title.toLowerCase().includes(query);
                const statusMatch = card.status.toLowerCase().includes(query);
                let contentMatch = false;
                let contentPreview = '';
                
                // 全文検索が有効な場合
                if (fullTextSearchEnabled && card.content) {
                    const contentLower = card.content.toLowerCase();
                    const matchIndex = contentLower.indexOf(query);
                    if (matchIndex !== -1) {
                        contentMatch = true;
                        // マッチ箇所の前後を抽出
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(card.content.length, matchIndex + query.length + 50);
                        contentPreview = '...' + card.content.substring(start, end) + '...';
                        // 安全なハイライト処理
                        const escapedPreview = escapeHtml(contentPreview);
                        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                        contentPreview = escapedPreview.replace(regex, '<mark>$1</mark>');
                    }
                }
                
                if (idMatch || titleMatch || statusMatch || contentMatch) {
                    card.element.classList.remove('search-hidden');
                    matchCount++;
                    
                    // ハイライト処理
                    highlightMatch(card, query);
                    
                    // 全文検索のプレビュー表示
                    if (contentMatch && contentPreview) {
                        let preview = card.element.querySelector('.content-preview');
                        if (!preview) {
                            preview = document.createElement('div');
                            preview.className = 'content-preview';
                            card.element.appendChild(preview);
                        }
                        preview.innerHTML = contentPreview;
                    } else {
                        const preview = card.element.querySelector('.content-preview');
                        if (preview) preview.remove();
                    }
                } else {
                    card.element.classList.add('search-hidden');
                    const preview = card.element.querySelector('.content-preview');
                    if (preview) preview.remove();
                }
            });
            
            // 検索結果表示
            if (matchCount > 0) {
                const modeText = fullTextSearchEnabled ? '（全文検索）' : '';
                searchResults.textContent = `${matchCount}件見つかりました ${modeText}`;
                searchResults.classList.add('active');
            } else {
                searchResults.textContent = '該当するタスクがありません';
                searchResults.classList.add('active');
            }
        }
        
        function highlightMatch(card, query) {
            const titleEl = card.element.querySelector('.task-title');
            const idEl = card.element.querySelector('.task-id');
            
            if (titleEl && card.title.toLowerCase().includes(query)) {
                titleEl.innerHTML = safeHighlight(card.originalTitle, query);
            } else if (titleEl) {
                titleEl.textContent = card.originalTitle;
            }
            
            if (idEl && card.id.toLowerCase().includes(query)) {
                idEl.innerHTML = safeHighlight(card.originalId, query);
            } else if (idEl) {
                idEl.textContent = card.originalId;
            }
        }
        
        // 旧highlightText関数は削除（safeHighlightで置き換え済み）
        
        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        // XSS対策用のHTMLエスケープ関数
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        // 安全なHTMLハイライト関数
        function safeHighlight(text, query) {
            const escapedText = escapeHtml(text);
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            return escapedText.replace(regex, '<mark>$1</mark>');
        }
        
        function saveSearchHistory(query) {
            searchHistory = searchHistory.filter(q => q !== query);
            searchHistory.unshift(query);
            searchHistory = searchHistory.slice(0, 5); // 最新5件のみ保存
            localStorage.setItem('taskSearchHistory', JSON.stringify(searchHistory));
        }
        
        function stopAutoUpdate() {
            if (autoUpdateTimer) {
                clearInterval(autoUpdateTimer);
                autoUpdateTimer = null;
            }
        }
        
        function startAutoUpdate() {
            stopAutoUpdate();
            autoUpdateTimer = setInterval(loadTasks, 30000);
        }
        
        // 設定ファイルを読み込む
        async function loadConfig() {
            try {
                const response = await fetch('../.taskconfig.json');
                if (response.ok) {
                    const config = await response.json();
                    return config.statuses;
                }
            } catch (e) {
                // 設定ファイルがない場合はデフォルト値を使用
            }
            return [
                { key: 'backlog', label: 'BACKLOG', color: '#6b7280' },
                { key: 'todo', label: 'TODO', color: '#3b82f6' },
                { key: 'review', label: 'REVIEW', color: '#eab308' },
                { key: 'done', label: 'DONE', color: '#22c55e' }
            ];
        }
        
        async function loadTasks() {
            try {
                // 検索用配列をクリア
                allTaskCards = [];
                
                // 設定ファイルからステータスを取得
                const statusConfig = await loadConfig();
                const statuses = statusConfig.map(s => s.key);
                let totalCount = 0;
                
                for (const status of statuses) {
                    const dirPath = `${statuses.indexOf(status)}_${status.toUpperCase()}`;
                    const listEl = document.getElementById(`${status}-list`);
                    const countEl = document.getElementById(`${status}-count`);
                    
                    try {
                        // ディレクトリ内のファイルリストを取得
                        const response = await fetch(dirPath);
                        const text = await response.text();
                        
                        // HTMLから.mdファイルのリンクを抽出
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        const links = Array.from(doc.querySelectorAll('a'))
                            .filter(a => a.href.endsWith('.md') || a.href.endsWith('.md@'))
                            .map(a => {
                                // ファイル名から@を除去（MacOSのシンボリックリンク表示）
                                let filename = a.textContent;
                                if (filename.endsWith('@')) {
                                    filename = filename.slice(0, -1);
                                }
                                return filename;
                            });
                        
                        listEl.innerHTML = '';
                        
                        if (links.length === 0) {
                            listEl.innerHTML = '<div class="empty">タスクなし</div>';
                            countEl.textContent = '0';
                        } else {
                            countEl.textContent = links.length;
                            totalCount += links.length;
                            
                            for (const file of links) {
                                // ファイル名から@を除去（念のため再チェック）
                                const cleanFile = file.endsWith('@') ? file.slice(0, -1) : file;
                                const taskId = cleanFile.match(/^(\d+)_/)?.[1] || '---';
                                const taskName = cleanFile.replace(/^\d+_/, '')
                                    .replace(`_${status}.md`, '')
                                    .replace(/_/g, ' ');
                                
                                const card = document.createElement('div');
                                card.className = `task-card ${status}`;
                                const taskIdText = `#${taskId}`;
                                const taskTitleText = taskName;
                                
                                card.innerHTML = `
                                    <div class="task-id">${escapeHtml(taskIdText)}</div>
                                    <div class="task-title">${escapeHtml(taskTitleText)}</div>
                                    <div class="task-meta">
                                        <span>${escapeHtml(status.toUpperCase())}</span>
                                    </div>
                                `;
                                
                                const taskPath = `${dirPath}/${cleanFile}`;
                                
                                // 検索用データを保存
                                allTaskCards.push({
                                    element: card,
                                    id: taskIdText,
                                    title: taskTitleText,
                                    status: status,
                                    originalId: taskIdText,
                                    originalTitle: taskTitleText,
                                    path: taskPath,
                                    content: null // 全文検索時に遅延読み込み
                                });
                                
                                // タスクデータを保存（シンボリックリンク経由でアクセス）
                                const taskKey = `${status}_${cleanFile}`;
                                tasksData[taskKey] = {
                                    file: cleanFile,
                                    path: taskPath,
                                    status: status,
                                    id: taskId,
                                    name: taskName
                                };
                                
                                card.onclick = () => showTask(taskKey);
                                
                                listEl.appendChild(card);
                            }
                        }
                    } catch (err) {
                        listEl.innerHTML = '<div class="empty">読み込み失敗</div>';
                        countEl.textContent = '0';
                    }
                }
                
                // 統計を更新
                document.getElementById('total-count').textContent = totalCount;
                document.getElementById('last-update').textContent = 
                    new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                
            } catch (err) {
                console.error('Failed to load tasks:', err);
            }
        }
        
        async function showTask(taskKey) {
            const task = tasksData[taskKey];
            if (!task) return;
            
            const modal = document.getElementById('task-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            modalTitle.textContent = `#${task.id} - ${task.name}`;
            modalBody.innerHTML = '<div class="loading">読み込み中...</div>';
            
            modal.classList.add('active');
            
            try {
                // Markdownファイルを読み込む
                console.log('Loading task from:', task.path);
                const response = await fetch(task.path);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const markdown = await response.text();
                
                // XSSを防ぎながらMarkdown→HTML変換
                // まず全体をエスケープしてから、安全なHTMLタグだけを復元
                let html = escapeHtml(markdown);
                
                // 安全なマークダウン変換
                html = html
                    // ヘッダー（エスケープ済みテキストに対して適用）
                    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
                    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                    // リスト
                    .replace(/^- \[x\] (.*?)$/gm, '✅ $1<br>')
                    .replace(/^- \[ \] (.*?)$/gm, '☐ $1<br>')
                    .replace(/^- (.*?)$/gm, '• $1<br>')
                    // コードブロック（エスケープ済みなので安全）
                    .replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>')
                    // インラインコード
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    // 太字
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    // 改行
                    .replace(/\n/g, '<br>');
                
                modalBody.innerHTML = `<pre>${html}</pre>`;
            } catch (err) {
                modalBody.innerHTML = `
                    <div class="empty">
                        タスクの読み込みに失敗しました<br>
                        <small>${err.message}</small>
                    </div>
                `;
            }
        }
        
        function closeModal() {
            const modal = document.getElementById('task-modal');
            modal.classList.remove('active');
        }
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
            // Rキーでリロード
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                loadTasks();
            }
        });
        
        // モーダル外クリックで閉じる
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                closeModal();
            }
        });
        
        // カスタムステータス用のCSSを動的に生成
        function applyDynamicStyles(statusConfig) {
            let styleSheet = document.getElementById('dynamic-styles');
            if (!styleSheet) {
                styleSheet = document.createElement('style');
                styleSheet.id = 'dynamic-styles';
                document.head.appendChild(styleSheet);
            }
            
            // カスタムステータスのボーダーカラーを生成
            let css = '';
            statusConfig.forEach(status => {
                if (status.color) {
                    css += `.task-card.${status.key} { border-left: 3px solid ${status.color}; }\n`;
                    css += `.column-header.${status.key} { border-bottom-color: ${status.color}; }\n`;
                }
            });
            
            styleSheet.textContent = css;
        }
        
        // カラムを動的に生成
        async function initializeColumns() {
            const statusConfig = await loadConfig();
            const container = document.getElementById('kanban-container');
            container.innerHTML = '';
            
            // カスタムスタイルを適用
            applyDynamicStyles(statusConfig);
            
            // アイコンのマッピング
            const icons = {
                'backlog': '📋',
                'todo': '🔵',
                'review': '🔴',
                'done': '✅',
                'idea': '💡',
                'doing': '🔨',
                'testing': '🧪',
                'planning': '🗓️'
            };
            
            statusConfig.forEach(status => {
                const column = document.createElement('div');
                column.className = 'column';
                const icon = icons[status.key.toLowerCase()] || '📋';
                
                column.innerHTML = `
                    <div class="column-header ${status.key}">
                        <div class="column-title">
                            ${icon} ${status.label}
                        </div>
                        <span class="column-count" id="${status.key}-count">0</span>
                    </div>
                    <div class="task-list" id="${status.key}-list">
                        <div class="loading">読み込み中...</div>
                    </div>
                `;
                
                container.appendChild(column);
            });
        }
        
        // 初期化
        async function initialize() {
            await initializeColumns();
            await loadTasks();
            initSearch();
            startAutoUpdate();
        }
        
        // 初回読み込み
        initialize();

    // Public APIをグローバルに公開（必要なら）
    window.TaskViewer = {
        refresh: loadTasks,
        search: performSearch,
        openTask: openTaskModal
    };
    
})(); // IIFE終了
