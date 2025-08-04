#!/bin/bash
# Claude Task Manager - グローバルHook有効化スクリプト

echo "🎣 Claude Task Manager - グローバルHook設定"
echo "================================"
echo ""

# グローバル設定ディレクトリの確認
GLOBAL_CLAUDE_DIR="$HOME/.claude"
GLOBAL_SETTINGS="$GLOBAL_CLAUDE_DIR/settings.json"
TASK_MANAGER_HOME="$HOME/.claude/task-manager"

# ディレクトリ作成
mkdir -p "$GLOBAL_CLAUDE_DIR"

# 既存の設定をバックアップ
if [ -f "$GLOBAL_SETTINGS" ]; then
    echo "📦 既存の設定をバックアップ中..."
    cp "$GLOBAL_SETTINGS" "$GLOBAL_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Node.jsでマージ処理
node -e "
const fs = require('fs');
const path = require('path');

// 新しいHook設定を読み込み
const taskHooks = JSON.parse(fs.readFileSync('$TASK_MANAGER_HOME/.claude/settings.json', 'utf8'));

// 既存の設定を読み込み（存在する場合）
let existingSettings = {};
if (fs.existsSync('$GLOBAL_SETTINGS')) {
    existingSettings = JSON.parse(fs.readFileSync('$GLOBAL_SETTINGS', 'utf8'));
}

// Hooksをマージ
if (!existingSettings.hooks) {
    existingSettings.hooks = {};
}

// UserPromptSubmitのマージ
if (!existingSettings.hooks.UserPromptSubmit) {
    existingSettings.hooks.UserPromptSubmit = [];
}
existingSettings.hooks.UserPromptSubmit.push(...taskHooks.hooks.UserPromptSubmit);

// PostToolUseのマージ
if (!existingSettings.hooks.PostToolUse) {
    existingSettings.hooks.PostToolUse = [];
}
existingSettings.hooks.PostToolUse.push(...taskHooks.hooks.PostToolUse);

// 保存
fs.writeFileSync('$GLOBAL_SETTINGS', JSON.stringify(existingSettings, null, 2));
console.log('✅ グローバル設定を更新しました');
"

echo ""
echo "✨ グローバルHook設定が完了しました！"
echo ""
echo "📋 有効になった機能:"
echo "  • タスク作成の自動検出"
echo "  • 作業完了の自動検出"
echo "  • タスク候補の提案"
echo "  • BACKLOG候補の検出"
echo ""
echo "💡 これで全プロジェクトでタスク管理Hookが動作します！"