#!/usr/bin/env node

/**
 * Claude Task Manager CLI
 * Windows/Mac/Linux対応のクロスプラットフォームCLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TASK_DIR   = 'docs/logs/tasks';
const program    = new Command();

// ユーティリティ関数
const ensureTaskDir = () => {
    const taskPath = path.join(process.cwd(), TASK_DIR);
    if (!fs.existsSync(taskPath)) {
        fs.mkdirSync(taskPath, { recursive: true });
    }
    return taskPath;
};

const getTemplatePath = () => {
    // ローカルテンプレートを優先、なければデフォルト
    const localTemplate = path.join(process.cwd(), '.claude', 'task-template.md');
    const defaultTemplate = path.join(__dirname, 'defaults', 'task-template.md');
    
    if (fs.existsSync(localTemplate)) {
        return localTemplate;
    }
    return defaultTemplate;
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
        
        // テンプレートの読み込みまたはデフォルト作成
        let template;
        const templatePath = getTemplatePath();
        
        if (fs.existsSync(templatePath)) {
            template = fs.readFileSync(templatePath, 'utf8');
        } else {
            // デフォルトテンプレート
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

// セットアップコマンド
program
    .command('setup')
    .description('プロジェクトにタスク管理システムをセットアップ')
    .option('--statuses <statuses>', 'カスタムステータス（カンマ区切り）')
    .action((options) => {
        const setupPath = path.join(__dirname, 'setup.sh');
        
        if (fs.existsSync(setupPath)) {
            // setup.shがあればそれを実行（後方互換性）
            const args = options.statuses ? `--statuses "${options.statuses}"` : '';
            try {
                execSync(`bash ${setupPath} ${args}`, { stdio: 'inherit' });
            } catch (error) {
                console.error('❌ セットアップ失敗:', error.message);
                console.log('💡 Node.jsベースのセットアップを実行してみてください');
            }
        } else {
            // Node.jsベースのセットアップ（今後実装予定）
            console.log('⚠️  setup.sh が見つかりません');
            console.log('手動でセットアップを行ってください');
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

詳細: https://github.com/YOUR_USERNAME/claude-task-manager
`);

// コマンド実行
program.parse();