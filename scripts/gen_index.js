#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_DIR = './docs/logs/tasks';
const INDEX_FILE = './docs/logs/INDEX.md';

// タスクディレクトリが存在しない場合は作成
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

const files = fs.existsSync(TASKS_DIR) 
  ? fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'))
  : [];

// ステータス別にグループ化
const byStatus = {
  backlog: files.filter(f => f.endsWith('_backlog.md')),
  todo: files.filter(f => f.endsWith('_todo.md')),
  review: files.filter(f => f.endsWith('_review.md')),
  done: files.filter(f => f.endsWith('_done.md'))
};

// INDEX.md生成
let content = `# タスク一覧
*自動生成: ${new Date().toLocaleString('ja-JP')}*

## 📊 サマリー
- BACKLOG: ${byStatus.backlog.length}件
- TODO: ${byStatus.todo.length}件
- REVIEW: ${byStatus.review.length}件
- DONE: ${byStatus.done.length}件

`;

// 各ステータスのセクション
Object.entries(byStatus).forEach(([status, files]) => {
  if (files.length > 0) {
    content += `\n## ${status.toUpperCase()}\n`;
    files.sort().forEach(file => {
      content += `- [${file}](./tasks/${file})\n`;
    });
  }
});

fs.writeFileSync(INDEX_FILE, content);
console.log('✅ INDEX.md を生成しました');