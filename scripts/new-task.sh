#!/bin/bash
# Task Manager CLIのラッパー（後方互換性のため）
# このスクリプトは後方互換性のために維持されています
# 実際の処理はNode.js CLIが行います

# プロジェクトルートのCLIパスを検索
CLI_PATHS=(
    "$HOME/.claude/task-manager/cli.js"
    "../node_modules/.bin/taskmgr"
    "./node_modules/.bin/taskmgr"
    "$(npm root -g)/claude-task-manager/cli.js"
)

CLI_FOUND=""
for path in "${CLI_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CLI_FOUND="$path"
        break
    fi
done

if [ -z "$CLI_FOUND" ]; then
    echo "❌ Task Manager CLIが見つかりません"
    echo "📦 セットアップを実行してください:"
    echo "   node ~/.claude/task-manager/cli.js setup"
    exit 1
fi

# Node.js CLIに処理を委譲
node "$CLI_FOUND" new "$@"