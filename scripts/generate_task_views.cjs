#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// タスク情報を抽出
function extractTaskInfo(content, filename) {
    const lines = content.split('\n');
    const taskId = filename.match(/^(\d+)_/)?.[1] || '';
    const status = filename.match(/_([^_]+)\.md$/)?.[1] || '';
    const title = lines.find(line => line.startsWith('# '))?.replace(/^# \w+ \d+: /, '') || '';
    const priorityLine = lines.find(line => line.includes('優先度:'));
    const priority = priorityLine?.replace(/.*優先度:\s*/, '').trim() || '';
    const phase = priorityLine?.match(/フェーズ(\d)/)?.[1] || '';
    const background = lines.find((line, i) => 
        lines[i-1]?.includes('背景'))?.trim() || '';
    
    // 実装内容を取得
    const implStart = lines.findIndex(line => line.includes('実装内容'));
    let features = [];
    if (implStart !== -1) {
        for (let i = implStart + 1; i < lines.length && i < implStart + 20; i++) {
            const line = lines[i].trim();
            if (line.match(/^\d+\.|^-/) && line.length > 5) {
                features.push(line.replace(/^\d+\.\s*|^-\s*/, '').replace(/\*\*/g, ''));
            }
            if (features.length >= 3) break;
        }
    }
    
    return {
        id: taskId,
        title,
        status,
        priority,
        phase,
        background,
        features: features.slice(0, 3),
        filename
    };
}

// タスク一覧を生成
function generateTaskSummary() {
    const tasksDir = path.join(__dirname, '../docs/logs/tasks');
    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
    
    const tasks = files.map(file => {
        const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
        return extractTaskInfo(content, file);
    }).sort((a, b) => a.id.localeCompare(b.id));
    
    // サマリーMarkdownを生成
    let summary = `# 📝 タスクサマリー

*生成日時: ${new Date().toLocaleString('ja-JP')}*

## 🎯 クイックリファレンス

`;
    
    // ステータス別にグループ化
    const byStatus = {
        'todo': [],
        'backlog': [],
        'review': [],
        'done': []
    };
    
    tasks.forEach(task => {
        if (byStatus[task.status]) {
            byStatus[task.status].push(task);
        }
    });
    
    // TODOタスク
    if (byStatus.todo.length > 0) {
        summary += '\n### 🟢 TODO\n\n';
        byStatus.todo.forEach(task => {
            summary += `#### ${task.id}: ${task.title}\n`;
            summary += `- **優先度**: ${task.priority}\n`;
            if (task.phase) summary += `- **フェーズ**: ${task.phase}\n`;
            summary += `- **概要**: ${task.background}\n`;
            if (task.features.length > 0) {
                summary += `- **主な機能**:\n`;
                task.features.forEach(f => summary += `  - ${f}\n`);
            }
            summary += `\n`;
        });
    }
    
    // BACKLOGタスク（フェーズ別）
    if (byStatus.backlog.length > 0) {
        summary += '\n### 🟡 BACKLOG\n\n';
        
        // フェーズ別にグループ化
        const byPhase = {};
        byStatus.backlog.forEach(task => {
            const phase = task.phase || 'その他';
            if (!byPhase[phase]) byPhase[phase] = [];
            byPhase[phase].push(task);
        });
        
        // フェーズ順に出力
        ['1', '2', '3', '4', '5', 'その他'].forEach(phase => {
            if (byPhase[phase]) {
                summary += `\n#### フェーズ${phase === 'その他' ? ': その他' : phase}\n\n`;
                byPhase[phase].forEach(task => {
                    const priorityEmoji = task.priority.includes('高') ? '🔴' : 
                                         task.priority.includes('中') ? '🟠' : '🟢';
                    summary += `- **${task.id}: ${task.title}** ${priorityEmoji}\n`;
                    summary += `  - ${task.background}\n`;
                });
            }
        });
    }
    
    // タスク相関図
    summary += `\n## 🔗 タスク相関図\n\n\`\`\`mermaid\ngraph LR\n`;
    
    // 主要な依存関係を定義
    const dependencies = [
        ['001', '003'],
        ['001', '004'],
        ['003', '006'],
        ['003', '007'],
        ['003', '009'],
        ['004', '005'],
        ['004', '017'],
        ['005', '017'],
        ['006', '007'],
        ['007', '010'],
        ['016', '007'],
        ['018', '007']
    ];
    
    dependencies.forEach(([from, to]) => {
        const fromTask = tasks.find(t => t.id === from);
        const toTask = tasks.find(t => t.id === to);
        if (fromTask && toTask) {
            summary += `    ${from}[${fromTask.title}] --> ${to}[${toTask.title}]\n`;
        }
    });
    
    summary += `\`\`\`\n\n`;
    
    // タスク詳細へのリンク
    summary += `## 🔍 タスク詳細\n\n`;
    tasks.forEach(task => {
        summary += `- [${task.id}: ${task.title}](./tasks/${task.filename})\n`;
    });
    
    // ファイルに書き込み
    const outputPath = path.join(__dirname, '../docs/logs/TASK_SUMMARY.md');
    fs.writeFileSync(outputPath, summary);
    console.log('✅ TASK_SUMMARY.md を生成しました');
}

// JSONエクスポート機能
function exportTasksAsJson() {
    const tasksDir = path.join(__dirname, '../docs/logs/tasks');
    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
    
    const tasks = files.map(file => {
        const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
        return extractTaskInfo(content, file);
    }).sort((a, b) => a.id.localeCompare(b.id));
    
    const outputPath = path.join(__dirname, '../docs/logs/tasks.json');
    fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2));
    console.log('✅ tasks.json を生成しました');
}

// 全文検索用インデックスの生成
function generateSearchIndex() {
    const tasksDir = path.join(__dirname, '../docs/logs/tasks');
    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
    
    const searchIndex = {
        updated: Date.now(),
        version: '1.0',
        tasks: files.map(file => {
            const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
            const info = extractTaskInfo(content, file);
            
            // タスクIDと名前を抽出
            const taskId = file.match(/^(\d+)_/)?.[1] || '';
            const taskName = file.replace(/^\d+_/, '').replace(/_[^_]+\.md$/, '').replace(/_/g, ' ');
            
            return {
                id: taskId,
                title: taskName,
                status: info.status,
                filename: file,
                content: content,  // 全文を含める
                size: content.length,
                lastModified: fs.statSync(path.join(tasksDir, file)).mtime.toISOString()
            };
        }).sort((a, b) => a.id.localeCompare(b.id))
    };
    
    // 検索インデックスを保存
    const outputPath = path.join(__dirname, '../docs/logs/tasks_search.json');
    fs.writeFileSync(outputPath, JSON.stringify(searchIndex, null, 2));
    console.log(`✅ tasks_search.json を生成しました (${searchIndex.tasks.length}件のタスク)`);
}

// 実行
generateTaskSummary();
exportTasksAsJson();
generateSearchIndex();