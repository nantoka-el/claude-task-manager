#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_DIR = './docs/logs/tasks';
const INDEX_FILE = './docs/logs/INDEX.md';

// 設定ファイルから動的にステータスを読み込む
function loadConfig() {
  const configPath = path.join(process.cwd(), '.taskconfig.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.statuses || [
        { key: 'backlog', label: 'BACKLOG' },
        { key: 'todo', label: 'TODO' },
        { key: 'review', label: 'REVIEW' },
        { key: 'done', label: 'DONE' }
      ];
    }
  } catch (e) {
    console.warn('設定ファイルの読み込みに失敗:', e.message);
  }
  return [
    { key: 'backlog', label: 'BACKLOG' },
    { key: 'todo', label: 'TODO' },
    { key: 'review', label: 'REVIEW' },
    { key: 'done', label: 'DONE' }
  ];
}

// タスクディレクトリが存在しない場合は作成
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

const files = fs.existsSync(TASKS_DIR) 
  ? fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'))
  : [];

// 設定からステータスを取得
const statuses = loadConfig();

// ステータス別にグループ化（動的）
const byStatus = {};
statuses.forEach(status => {
  byStatus[status.key] = files.filter(f => f.endsWith(`_${status.key}.md`));
});

// INDEX.md生成
let content = `# タスク一覧
*自動生成: ${new Date().toLocaleString('ja-JP')}*

## 📊 サマリー
`;

// サマリーを動的に生成
statuses.forEach(status => {
  const count = byStatus[status.key] ? byStatus[status.key].length : 0;
  content += `- ${status.label}: ${count}件\n`;
});

content += '\n';

// 各ステータスのセクション
statuses.forEach(status => {
  const files = byStatus[status.key] || [];
  if (files.length > 0) {
    content += `\n## ${status.label}\n`;
    files.sort().forEach(file => {
      content += `- [${file}](./tasks/${file})\n`;
    });
  }
});

fs.writeFileSync(INDEX_FILE, content);
console.log('✅ INDEX.md を生成しました');