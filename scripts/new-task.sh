#!/bin/bash
# Task Manager CLIのラッパー（Windows/Mac/Linux互換性のため）
# このスクリプトは後方互換性のために維持されています
# 実際の処理はtaskmgr CLIが行います

# taskmgrコマンドの存在確認
if ! command -v taskmgr &> /dev/null; then
    echo "❌ taskmgr CLIがインストールされていません"
    echo "📦 インストール方法:"
    echo "   npm install -g claude-task-manager"
    echo ""
    echo "または、npxで直接実行:"
    echo "   npx taskmgr new $@"
    exit 1
fi

# taskmgr CLIに処理を委譲
taskmgr new "$@"