# 📋 AIファーストタスク管理システム

AIとの協働に最適化された、ミニマリストのタスク管理システムです。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎆 デモ

![Task Manager Demo](./demos/demo.gif)

## ✨ 特徴

- **依存なし** - Node.jsだけで動作
- **オフラインファースト** - クラウド不要、アカウント不要
- **Git対応** - プレーンテキストのMarkdown、美しいdiff
- **AI最適化** - AIエージェント用の詳細なテンプレート
- **ビジュアルかんばん** - ブラウザベースのタスクビューアー（検索機能付き）
- **カスタマイズ可能** - ステータスを自由に設定
- **ポータブル** - ワンコマンドでセットアップ
- **Hook機能** - タスク作成・完了を自動検出

## 🚀 クイックスタート

### グローバルインストール

```bash
# ホームディレクトリにセットアップ
mkdir -p ~/.claude/task-manager
cd ~/.claude/task-manager

# セットアップスクリプトをダウンロード（またはこのリポジトリからコピー）
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-task-manager/main/setup.sh -o setup.sh
chmod +x setup.sh
```

### プロジェクトへのセットアップ

```bash
# プロジェクトに移動
cd /path/to/your/project

# セットアップ実行
~/.claude/task-manager/setup.sh

# これで準備完了！
```

### 最初のタスクを作成

```bash
# タスク作成
./scripts/new-task.sh 001 implement_auth

# ブラウザで表示
npm run task-viewer

# カスタムポートで起動
PORT=8080 npm run task-viewer
```

## 📝 基本的な使い方

### タスクのライフサイクル

1. **作成** → `*_todo.md`
2. **作業中** → `*_todo.md`のまま
3. **レビュー待ち** → `*_review.md`に変更
4. **完了** → `*_done.md`に変更

### コマンド

```bash
# タスク作成
./scripts/new-task.sh 001 タスク名

# ステータス変更（ファイル名変更）
mv docs/logs/tasks/001_タスク名_todo.md \
   docs/logs/tasks/001_タスク名_review.md

# タスク表示
npm run task-viewer

# インデックス更新
npm run logs-refresh
```

## ⚙️ 設定

### カスタムステータス

プロジェクトルートに`.taskconfig.json`を作成：

```json
{
  "statuses": [
    { "key": "idea", "label": "アイデア" },
    { "key": "doing", "label": "作業中" },
    { "key": "testing", "label": "テスト中" },
    { "key": "done", "label": "完了" }
  ],
  "port": 5500
}
```

またはセットアップ時にカスタムステータスを指定：

```bash
~/.claude/task-manager/setup.sh --statuses "idea,doing,testing,done"
```

## 🎯 AI協働に最適な理由

### なぜAIに最適なのか

- **締切なし** - AIは自分のペースで作業
- **完全なコンテキスト** - 明確な指示のための詳細なテンプレート
- **状態ベース** - 「いつ」ではなく「何」に焦点
- **Git統合** - すべての変更を追跡
- **Hook機能** - AIの作業を自動検出

### タスクテンプレート

すべてのタスクには以下が含まれます：
- ユーザーの元の要求（原文）
- なぜ必要か（背景）
- 何を実装するか（具体的な要件）
- どうやって実装するか（技術的詳細）
- 実装ログ（リアルタイム更新）
- 完了条件（チェックリスト）

## 🔍 タスクビューアーの機能

- **リアルタイム検索** - `Cmd/Ctrl + K`
- **全文検索** - タスク内容も検索可能
- **自動更新** - 30秒ごとに更新
- **レスポンシブデザイン** - あらゆるデバイスで動作
- **ダークモード** - 目に優しい

## 📊 他ツールとの比較

| 機能 | Claude Task Manager | Trello | Notion | Linear |
|------|---------------------|--------|--------|--------|
| 💵 価格 | **無料** | フリーミアム/$6+ | フリーミアム/$10+ | $8+/ユーザー |
| 🌐 オフライン | **完全対応** | × | × | × |
| 👥 アカウント | **不要** | 必要 | 必要 | 必要 |
| 📝 Markdown | **ネイティブ** | 部分的 | 対応 | 部分的 |
| 🤖 AI最適化 | **専用設計** | × | × | × |
| 📦 Git統合 | **完璧** | × | × | GitHub連携 |
| 🔒 データ所有権 | **ローカル** | クラウド | クラウド | クラウド |
| 🚀 セットアップ | **1分** | 5分+ | 10分+ | 10分+ |
| 🤝 チーム共有 | Git/PR | ボード共有 | ワークスペース | チーム |
| 📊 学習コスト | **極小** | 中 | 高 | 中 |

### なぜClaude Task Managerを選ぶのか？

1. **プライバシー優先**: データは100%ローカルに保存
2. **エンジニアフレンドリー**: Git、PR、diffが自然に活用できる
3. **AIファースト**: Claude CodeやChatGPTとの協働を前提に設計
4. **ポータブル**: USBメモリに入れて持ち運べる
5. **カスタマイズ可能**: ステータス、テンプレート、UIを自由に変更

## 🎣 Hook機能

自動検出される操作：
- タスク作成要求 → 「タスク化」「TODO追加」などのキーワード
- 作業完了 → 「完了」「終わり」などのキーワード
- タスク候補 → 「やりたい」「必要」などのキーワード
- BACKLOG候補 → 「将来的に」「いつか」などのキーワード

## 📂 プロジェクト構造

```
your-project/
├── docs/logs/
│   ├── tasks/          # すべてのタスクファイル
│   ├── .views/         # タスクビューアー
│   ├── STATE_current.md # 現在の状態
│   └── INDEX.md        # 自動生成インデックス
├── scripts/
│   ├── new-task.sh     # タスク作成
│   └── gen_index.js    # インデックス生成
├── .claude/
│   └── task-hooks.json # Hook設定
└── .taskconfig.json    # 設定（オプション）
```

## 🤝 貢献

これはオープンソースプロジェクトです！貢献を歓迎します。

### 貢献のアイデア

- [ ] テーマサポート（ライト/ダーク/カスタム）
- [ ] PDF/CSVエクスポート
- [ ] 統計ダッシュボード
- [ ] 複数プロジェクト対応
- [ ] タグとラベル
- [ ] 時間追跡
- [ ] 統合（GitHub Issues等）

## 📄 ライセンス

MITライセンス - 自由に使ってください！

## ❓ よくある質問（FAQ）

<details>
<summary><strong>Q: 企業のセキュリティポリシーでクラウドツールが禁止されています。使えますか？</strong></summary>

**A: はい、完全にオフラインで動作します。**

- インターネット接続不要
- データはローカルに保存
- アカウント登録不要
- 社内ネットワーク内でのみ共有可能
</details>

<details>
<summary><strong>Q: Windows/Mac/Linuxで動きますか？</strong></summary>

**A: はい、すべてのOSで動作します。**

- Node.js CLIでWindows完全対応
- Mac/LinuxではBashスクリプトも使用可能
- WSL、PowerShell、Bash、Zshすべてサポート
</details>

<details>
<summary><strong>Q: チームでの共有はどうやりますか？</strong></summary>

**A: Gitを使って自然に共有できます。**

```bash
# メンバーはリポジトリをクローン
 git clone https://github.com/team/project
 
# タスクを追加
 ./cli.js new 001 my_task
 
# 変更をコミット&プッシュ
 git add -A && git commit -m "Add task 001" && git push
```
</details>

<details>
<summary><strong>Q: 既存のTrello/Notionから移行できますか？</strong></summary>

**A: エクスポートしたCSV/JSONからインポート可能です。**

コミュニティで移行ツールを開発中です。
</details>

<details>
<summary><strong>Q: タスクが多くなってもパフォーマンスは大丈夫？</strong></summary>

**A: 1000タスクまでテスト済みで、快適に動作します。**

- 検索インデックスJSONで高速化
- ページネーション対応（将来実装）
- アーカイブ機能で古いタスクを退避
</details>

<details>
<summary><strong>Q: スマートフォンで使えますか？</strong></summary>

**A: はい、レスポンシブデザインで対応しています。**

- モバイルファーストUI
- タッチ操作に最適化
- PWA対応（将来実装）
</details>

<details>
<summary><strong>Q: AIエージェントとの連携は？</strong></summary>

**A: Claude Code、ChatGPT、GitHub Copilotと完璧に連携します。**

- Hook機能でタスク作成を自動検出
- MarkdownフォーマットでAIが理解しやすい
- テンプレートで詳細な指示を記載
</details>

## 🙏 謝辞

こんな開発者のために作りました：
- シンプルさを愛する人
- 設定地獄が嫌いな人
- AIアシスタントと働く人
- オフラインファーストツールを重視する人

---

# 📋 AI-First Task Manager (English Version)

A minimalist, Git-friendly task management system designed for AI collaboration.

## ✨ Features

- **Zero Dependencies** - Works with just Node.js
- **Offline First** - No cloud, no account needed
- **Git Native** - Plain markdown files, beautiful diffs
- **AI Optimized** - Detailed templates for AI agents
- **Visual Kanban** - Browser-based task viewer with search
- **Customizable** - Configure your own statuses
- **Portable** - One command setup for any project
- **Hook Support** - Auto-detect task creation and completion

## 🚀 Quick Start

### Installation (Global)

```bash
# Setup in your home directory
mkdir -p ~/.claude/task-manager
cd ~/.claude/task-manager

# Download setup script (or copy from this repo)
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-task-manager/main/setup.sh -o setup.sh
chmod +x setup.sh
```

### Setup in Your Project

```bash
# Navigate to your project
cd /path/to/your/project

# Run setup
~/.claude/task-manager/setup.sh

# That's it! You're ready to go
```

### Create Your First Task

```bash
# Create a task
./scripts/new-task.sh 001 implement_auth

# View in browser
npm run task-viewer

# Or with custom port
PORT=8080 npm run task-viewer
```

## 📝 Basic Usage

### Task Lifecycle

1. **Create** → `*_todo.md`
2. **Start Working** → Keep as `*_todo.md`
3. **Ready for Review** → Rename to `*_review.md`
4. **Complete** → Rename to `*_done.md`

### Commands

```bash
# Create task
./scripts/new-task.sh 001 task_name

# Change status (rename file)
mv docs/logs/tasks/001_task_name_todo.md \
   docs/logs/tasks/001_task_name_review.md

# View tasks
npm run task-viewer

# Refresh index
npm run logs-refresh
```

## ⚙️ Configuration

### Custom Statuses

Create `.taskconfig.json` in your project root:

```json
{
  "statuses": [
    { "key": "idea", "label": "IDEA" },
    { "key": "doing", "label": "DOING" },
    { "key": "testing", "label": "TESTING" },
    { "key": "done", "label": "DONE" }
  ],
  "port": 5500
}
```

Or use the setup command with custom statuses:

```bash
~/.claude/task-manager/setup.sh --statuses "idea,doing,testing,done"
```

## 🎯 Designed for AI Collaboration

### Why It's Perfect for AI

- **No Deadlines** - AI works at its own pace
- **Full Context** - Detailed templates for clear instructions
- **State-Based** - Focus on "what" not "when"
- **Git Integration** - Every change is tracked
- **Hook Support** - Auto-detect AI work

### Task Template

Every task includes:
- Original user request (verbatim)
- Why it's needed (background)
- What to implement (specific requirements)
- How to implement (technical details)
- Implementation log (real-time updates)
- Completion criteria (checklist)

## 🔍 Task Viewer Features

- **Real-time Search** - `Cmd/Ctrl + K`
- **Full-text Search** - Search within task content
- **Auto-refresh** - Updates every 30 seconds
- **Responsive Design** - Works on any device
- **Dark Mode** - Easy on the eyes

## 🎣 Hook Features

Auto-detected operations:
- Task creation request → Keywords like "create task", "add TODO"
- Work completion → Keywords like "done", "finished"
- Task candidates → Keywords like "need", "want", "should"
- BACKLOG candidates → Keywords like "later", "someday"

## 📂 Project Structure

```
your-project/
├── docs/logs/
│   ├── tasks/          # All task files
│   ├── .views/         # Task viewer
│   ├── STATE_current.md # Current state
│   └── INDEX.md        # Auto-generated index
├── scripts/
│   ├── new-task.sh     # Create tasks
│   └── gen_index.js    # Generate index
├── .claude/
│   └── task-hooks.json # Hook configuration
└── .taskconfig.json    # Configuration (optional)
```

## 🤝 Contributing

This is an open-source project! Contributions are welcome.

### Ideas for Contributions

- [ ] Theme support (light/dark/custom)
- [ ] Export to PDF/CSV
- [ ] Statistics dashboard
- [ ] Multiple project support
- [ ] Tags and labels
- [ ] Time tracking
- [ ] Integrations (GitHub Issues, etc.)

## 📄 License

MIT License - Use it however you want!

## 🙏 Acknowledgments

Built for developers who:
- Love simplicity
- Hate configuration hell
- Work with AI assistants
- Value offline-first tools

---

**「最もシンプルで、実際に使えるタスク管理」**
**"The simplest task manager that actually works"**

Made with ❤️ for the AI collaboration era / AI協働時代のために作られました