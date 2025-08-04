#!/usr/bin/env node

/**
 * Claude Task Manager CLI
 * Windows/Mac/Linux対応のクロスプラットフォームCLI
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { execSync } from 'child_process';
import { loadProjectConfig, getStatuses, createConfigFromStatuses, saveProjectConfig } from './lib/config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TASK_DIR   = 'docs/logs/tasks';
const program    = new Command();

// ステータスに基づいてデフォルトカラーを取得
const getDefaultColor = (status) => {
    const colorMap = {
        'backlog': '#6b7280',
        'todo': '#3b82f6',
        'review': '#eab308',
        'done': '#22c55e',
        'idea': '#9333ea',
        'planning': '#ec4899',
        'doing': '#06b6d4',
        'testing': '#f97316'
    };
    return colorMap[status] || '#8b949e';
};

// ユーティリティ関数
const ensureTaskDir = () => {
    const taskPath = path.join(process.cwd(), TASK_DIR);
    if (!fs.existsSync(taskPath)) {
        fs.mkdirSync(taskPath, { recursive: true });
    }
    return taskPath;
};

const getTemplatePath = () => {
    // 統一テンプレートパス
    const paths = [
        path.join(process.cwd(), '.claude', 'task-template.md'),
        path.join(process.cwd(), 'templates', 'task-template.md'),
        path.join(__dirname, 'defaults', 'task-template.md')
    ];
    
    for (const templatePath of paths) {
        if (fs.existsSync(templatePath)) {
            return templatePath;
        }
    }
    
    // デフォルトパスを返す
    return path.join(__dirname, 'defaults', 'task-template.md');
};

const formatDate = () => {
    return new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// CLIプログラム設定
program
    .name('taskmgr')
    .description('AI-First Task Manager CLI - クロスプラットフォーム対応')
    .version('1.0.0');

// タスク作成コマンド
program
    .command('new')
    .description('新しいタスクを作成')
    .argument('<id>', 'タスクID（例: 001）')
    .argument('<name>', 'タスク名（snake_case推奨）')
    .option('-s, --status <status>', 'ステータス', 'todo')
    .action((id, name, options) => {
        const taskPath = ensureTaskDir();
        const filename = `${id}_${name}_${options.status}.md`;
        const filepath = path.join(taskPath, filename);
        
        if (fs.existsSync(filepath)) {
            console.error(`❌ ${filename} は既に存在します`);
            process.exit(1);
        }
        
        // テンプレートの読み込み
        const templatePath = getTemplatePath();
        let template;
        
        try {
            template = fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error(`⚠️  テンプレートファイルが見つかりません: ${templatePath}`);
            console.log('デフォルトテンプレートを使用します。');
            // 最小限のフォールバックテンプレート
            template = `# タスク__ID__: __NAME__
作成日時: __DATE__
ステータス: __STATUS__

## 📌 ユーザーの要求（原文）
\`\`\`
ここにユーザーが言った言葉をそのままコピペする
省略は絶対禁止！文脈も含めて全部記録
\`\`\`

## 🎯 なぜ必要か（背景）
### 解決したい問題
- 

### なぜ今やる必要があるか
- 

### 期待される効果・価値
- 

## 📦 何を実装するか（具体的に）
### 追加する機能
- [ ] 
- [ ] 

### 変更する機能
- [ ] 
- [ ] 

### 削除する機能
- [ ] 

### 影響を受けるファイル
- \`src/xxx.ts\` (L10-20): 理由
- \`src/yyy.tsx\` (L30-40): 理由

## 🔧 どうやって実装するか（技術詳細）
### 使用する技術/ライブラリ
- 

### アルゴリズム/ロジック
\`\`\`
詳細な実装方法をここに記述
\`\`\`

### 検討した代替案
- 案1: XXX → 却下理由: 
- 案2: YYY → 却下理由: 

## 📝 実装ログ（随時更新）
### __DATE__
- タスク作成

### 実装開始時に記録
- 何から始めたか
- 最初の課題

### 問題発生時に記録
- エラー内容
- 解決方法

## ✅ 完了条件
- [ ] 機能要件1
- [ ] 機能要件2
- [ ] テスト作成
- [ ] テスト通過
- [ ] ドキュメント更新

## 🔗 関連情報
### 依存するタスク
- 

### 参考資料・URL
- 

### 関連するissue/PR
- 

## 🎓 完了後の振り返り（完了時に記入）
### 実際の結果
- 

### 学んだこと
- 

### 次への改善点
- 

---
⚠️ **このテンプレートのすべての項目を埋めること。「後で書く」は禁止。**
`;
        }
        
        // プレースホルダーの置換
        const content = template
            .replace(/__ID__/g, id)
            .replace(/__NAME__/g, name)
            .replace(/__STATUS__/g, options.status.toUpperCase())
            .replace(/__DATE__/g, formatDate());
        
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ タスクを作成しました: ${filepath}`);
    });

// ステータス変更コマンド
program
    .command('status')
    .description('タスクのステータスを変更')
    .argument('<id>', 'タスクID（例: 001）')
    .argument('<status>', '新しいステータス（todo/review/done等）')
    .action((id, status) => {
        const taskPath = ensureTaskDir();
        const files = fs.readdirSync(taskPath);
        
        // 該当タスクを検索
        const taskFile = files.find(f => f.startsWith(`${id}_`));
        
        if (!taskFile) {
            console.error(`❌ タスク ${id} が見つかりません`);
            process.exit(1);
        }
        
        // 新しいファイル名を作成
        const parts = taskFile.split('_');
        parts[parts.length - 1] = `${status}.md`;
        const newFile = parts.join('_');
        
        const oldPath = path.join(taskPath, taskFile);
        const newPath = path.join(taskPath, newFile);
        
        fs.renameSync(oldPath, newPath);
        console.log(`✅ ステータスを変更しました: ${taskFile} → ${newFile}`);
    });

// タスク一覧表示コマンド
program
    .command('list')
    .description('タスク一覧を表示')
    .option('-s, --status <status>', '特定のステータスのみ表示')
    .action((options) => {
        const taskPath = ensureTaskDir();
        const files = fs.readdirSync(taskPath);
        
        let tasks = files.filter(f => f.endsWith('.md'));
        
        if (options.status) {
            tasks = tasks.filter(f => f.endsWith(`_${options.status}.md`));
        }
        
        if (tasks.length === 0) {
            console.log('📋 タスクがありません');
            return;
        }
        
        // ステータス別にグループ化
        const grouped = {};
        tasks.forEach(task => {
            const match = task.match(/_([^_]+)\.md$/);
            const status = match ? match[1] : 'unknown';
            if (!grouped[status]) grouped[status] = [];
            grouped[status].push(task);
        });
        
        // 表示
        console.log('\n📋 タスク一覧\n');
        Object.entries(grouped).forEach(([status, files]) => {
            console.log(`[${status.toUpperCase()}] (${files.length}件)`);
            files.forEach(file => {
                const id = file.match(/^(\d+)_/)?.[1] || '---';
                const name = file.replace(/^\d+_/, '').replace(/_[^_]+\.md$/, '');
                console.log(`  #${id} ${name}`);
            });
            console.log();
        });
    });

// インデックス更新コマンド
program
    .command('refresh')
    .description('インデックスを更新')
    .action(() => {
        try {
            // gen_index.jsの実行
            const genIndexPath = path.join(process.cwd(), 'scripts', 'gen_index.js');
            if (fs.existsSync(genIndexPath)) {
                execSync(`node ${genIndexPath}`, { stdio: 'inherit' });
                console.log('✅ インデックスを更新しました');
            } else {
                console.log('⚠️  gen_index.js が見つかりません');
            }
            
            // generate_task_views.cjsの実行
            const genViewsPath = path.join(process.cwd(), 'scripts', 'generate_task_views.cjs');
            if (fs.existsSync(genViewsPath)) {
                execSync(`node ${genViewsPath}`, { stdio: 'inherit' });
                console.log('✅ タスクビューを更新しました');
            }
        } catch (error) {
            console.error('❌ 更新中にエラーが発生しました:', error.message);
        }
    });

// Viewerの起動コマンド
program
    .command('viewer')
    .description('タスクビューアーを起動')
    .option('-p, --port <port>', 'ポート番号', '5500')
    .action((options) => {
        const viewerPath = path.join(process.cwd(), 'docs', 'logs', '.views', 'index.html');
        
        if (!fs.existsSync(viewerPath)) {
            console.error('❌ ビューアーが見つかりません。先にセットアップを実行してください。');
            process.exit(1);
        }
        
        console.log(`🌐 タスクビューアーを起動しています...`);
        console.log(`   http://localhost:${options.port}/`);
        
        try {
            // npx http-serverを使用（クロスプラットフォーム対応）
            execSync(`npx http-server docs/logs -p ${options.port} -o .views/index.html --cors`, {
                stdio: 'inherit'
            });
        } catch (error) {
            // プロセス終了時のエラーは無視（Ctrl+Cなど）
            if (error.signal !== 'SIGINT') {
                console.error('❌ サーバー起動エラー:', error.message);
            }
        }
    });

// セットアップコマンド（完全Node.js実装）
program
    .command('setup')
    .description('プロジェクトにタスク管理システムをセットアップ')
    .option('--statuses <statuses>', 'カスタムステータス（カンマ区切り）')
    .option('--force', '既存の設定を上書き')
    .action(async (options) => {
        console.log('🚀 Task Manager Setup');
        console.log('================================\n');
        
        const projectDir = process.cwd();
        const taskManagerHome = path.join(os.homedir(), '.claude', 'task-manager');
        
        // 1. 既存チェック
        const tasksDir = path.join(projectDir, 'docs', 'logs', 'tasks');
        if (fs.existsSync(tasksDir) && !options.force) {
            console.log('⚠️  タスク管理システムは既に初期化されています。');
            console.log('再初期化する場合は --force オプションを使用してください。');
            process.exit(0);
        }
        
        try {
            // 2. ディレクトリ構造作成
            console.log('📁 ディレクトリ構造を作成中...');
            const dirs = [
                path.join(projectDir, 'docs', 'logs', 'tasks'),
                path.join(projectDir, 'docs', 'logs', '.views'),
                path.join(projectDir, 'scripts'),
                path.join(projectDir, '.claude')
            ];
            
            for (const dir of dirs) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 3. 必要なファイルをコピー
            console.log('📋 必要なファイルをコピー中...');
            
            // スクリプトファイル
            const filesToCopy = [
                { src: 'scripts/gen_index.js', dest: 'scripts/gen_index.js' },
                { src: 'scripts/generate_task_views.cjs', dest: 'scripts/generate_task_views.cjs' },
                { src: 'defaults/index-modular.html', dest: 'docs/logs/.views/index.html' },
                { src: 'defaults/styles.css', dest: 'docs/logs/.views/styles.css' },
                { src: 'defaults/viewer.js', dest: 'docs/logs/.views/viewer.js' },
                { src: 'defaults/task-template.md', dest: '.claude/task-template.md' }
            ];
            
            for (const file of filesToCopy) {
                const srcPath = path.join(taskManagerHome, file.src);
                const destPath = path.join(projectDir, file.dest);
                
                if (fs.existsSync(srcPath)) {
                    const content = fs.readFileSync(srcPath, 'utf8');
                    fs.writeFileSync(destPath, content, 'utf8');
                }
            }
            
            // new-task.sh をCLIのラッパーとして作成
            const newTaskWrapper = `#!/bin/bash
# Wrapper for taskmgr CLI (Windows互換性のため)
taskmgr new "$@"
`;
            fs.writeFileSync(path.join(projectDir, 'scripts', 'new-task.sh'), newTaskWrapper, { mode: 0o755 });
            
            // 4. 設定ファイル作成
            console.log('⚙️  設定ファイルを作成中...');
            
            let config;
            if (options.statuses) {
                // カスタムステータスから設定を生成
                const statuses = options.statuses.split(',').map(s => s.trim());
                config = {
                    version: '1.0',
                    statuses: statuses.map(status => ({
                        key: status.toLowerCase(),
                        label: status.toUpperCase(),
                        color: getDefaultColor(status.toLowerCase())
                    })),
                    port: 5500,
                    features: {
                        search: true,
                        fullTextSearch: true,
                        autoRefresh: true,
                        refreshInterval: 30000
                    }
                };
            } else {
                // デフォルト設定を使用
                const defaultConfigPath = path.join(taskManagerHome, 'defaults', '.taskconfig.json');
                if (fs.existsSync(defaultConfigPath)) {
                    config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
                } else {
                    config = loadProjectConfig(taskManagerHome);
                }
            }
            
            fs.writeFileSync(
                path.join(projectDir, '.taskconfig.json'),
                JSON.stringify(config, null, 2)
            );
            
            // 5. package.json更新
            const packageJsonPath = path.join(projectDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                console.log('📦 package.jsonを更新中...');
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                if (!packageJson.scripts) packageJson.scripts = {};
                
                Object.assign(packageJson.scripts, {
                    'task-viewer': 'npx http-server docs/logs -p ${PORT:-5500} -o .views/index.html --cors',
                    'gen-index': 'node scripts/gen_index.js',
                    'task-views': 'node scripts/generate_task_views.cjs',
                    'logs-refresh': 'npm run gen-index && npm run task-views'
                });
                
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            }
            
            // 6. 初期ファイル作成
            console.log('📝 初期ファイルを作成中...');
            
            // STATE_current.md
            const stateContent = `# 現在の作業状態 - ${new Date().toISOString().split('T')[0]}

## 📋 BACKLOG
*優先度低・いつかやる*

## 🔥 TODO
*次にやるタスク*

## 👀 REVIEW
*実装完了・テスト待ち*

## ✅ DONE
*完了したタスク*

---
最終更新: ${new Date().toLocaleString('ja-JP')}
`;
            fs.writeFileSync(path.join(projectDir, 'docs', 'logs', 'STATE_current.md'), stateContent);
            
            // README.md
            const readmeContent = `# Task Management System

AI-First task management for modern development.

## Quick Start

### Create a new task
\`\`\`bash
taskmgr new 001 my_first_task
\`\`\`

### View tasks
\`\`\`bash
npm run task-viewer
\`\`\`

### Update status
\`\`\`bash
taskmgr status 001 review
\`\`\`

### Refresh index
\`\`\`bash
npm run logs-refresh
\`\`\`
`;
            fs.writeFileSync(path.join(projectDir, 'docs', 'logs', 'README.md'), readmeContent);
            
            // 7. Hooks設定（オプション）
            const hooksPath = path.join(taskManagerHome, 'hooks', 'task-hooks.json');
            if (fs.existsSync(hooksPath)) {
                console.log('🎯 Hook設定をインストール中...');
                const hooksContent = fs.readFileSync(hooksPath, 'utf8');
                fs.writeFileSync(path.join(projectDir, '.claude', 'task-hooks.json'), hooksContent);
                console.log('💡 Hook設定がインストールされました。');
                console.log('   .claude/task-hooks.json を settings.json にマージしてください。');
            }
            
            // 8. インデックス生成
            console.log('🔄 インデックスを生成中...');
            try {
                execSync('node scripts/gen_index.js', { cwd: projectDir, stdio: 'ignore' });
            } catch (err) {
                // インデックス生成のエラーは無視（ファイルがまだない場合）
            }
            
            // 完了メッセージ
            console.log('\n✨ タスク管理システムのセットアップ完了！\n');
            console.log('📚 次のステップ:');
            console.log('  1. 最初のタスクを作成:');
            console.log('     taskmgr new 001 my_first_task\n');
            console.log('  2. タスクビューアーを起動:');
            console.log('     npm run task-viewer\n');
            console.log('  3. カスタムポートで起動:');
            console.log('     PORT=8080 npm run task-viewer\n');
            console.log('📖 ドキュメント: docs/logs/README.md');
            console.log('⚙️  設定ファイル: .taskconfig.json\n');
            console.log('タスク管理を楽しんでください！ 🚀');
            
        } catch (error) {
            console.error('\n❌ セットアップ中にエラーが発生しました:', error.message);
            process.exit(1);
        }
    });

// ヘルプの追加
program.addHelpText('after', `

使用例:
  $ taskmgr new 001 implement_auth
  $ taskmgr status 001 review
  $ taskmgr list
  $ taskmgr list --status todo
  $ taskmgr viewer --port 8080
  $ taskmgr refresh

詳細: https://github.com/nantoka-el/claude-task-manager
`);

// コマンド実行
program.parse();