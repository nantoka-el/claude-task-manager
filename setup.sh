#!/bin/bash

# ============================================
# Task Manager Setup Script
# AI-First Task Management System
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TASK_MANAGER_HOME="$HOME/.claude/task-manager"
PROJECT_DIR=$(pwd)
CUSTOM_STATUSES=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --statuses) CUSTOM_STATUSES="$2"; shift ;;
        --help) 
            echo "Usage: setup.sh [OPTIONS]"
            echo "Options:"
            echo "  --statuses    Custom status list (comma-separated)"
            echo "                Example: --statuses 'idea,doing,testing,done'"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}🚀 Task Manager Setup${NC}"
echo "================================"

# 1. Check if already initialized
if [ -d "$PROJECT_DIR/docs/logs/tasks" ]; then
    echo -e "${YELLOW}⚠️  Task manager already initialized in this project${NC}"
    read -p "Do you want to reinitialize? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# 2. Create directory structure
echo -e "${GREEN}📁 Creating directory structure...${NC}"
mkdir -p "$PROJECT_DIR/docs/logs/tasks"
mkdir -p "$PROJECT_DIR/docs/logs/.views"
mkdir -p "$PROJECT_DIR/scripts"

# 3. Copy necessary files
echo -e "${GREEN}📋 Copying task management files...${NC}"

# Copy scripts
cp "$TASK_MANAGER_HOME/scripts/new-task.sh" "$PROJECT_DIR/scripts/"
cp "$TASK_MANAGER_HOME/scripts/gen_index.js" "$PROJECT_DIR/scripts/"
cp "$TASK_MANAGER_HOME/scripts/generate_task_views.cjs" "$PROJECT_DIR/scripts/"

# Copy viewer
cp "$TASK_MANAGER_HOME/defaults/index.html" "$PROJECT_DIR/docs/logs/.views/"

# Make scripts executable
chmod +x "$PROJECT_DIR/scripts/new-task.sh"

# 4. Create or update .taskconfig.json
if [ -n "$CUSTOM_STATUSES" ]; then
    echo -e "${GREEN}⚙️  Creating custom configuration...${NC}"
    
    # Parse custom statuses
    IFS=',' read -ra STATUSES <<< "$CUSTOM_STATUSES"
    
    # Generate JSON config
    cat > "$PROJECT_DIR/.taskconfig.json" << EOF
{
  "version": "1.0",
  "statuses": [
EOF
    
    first=true
    for status in "${STATUSES[@]}"; do
        status=$(echo "$status" | xargs) # trim whitespace
        key=$(echo "$status" | tr '[:upper:]' '[:lower:]')
        label=$(echo "$status" | tr '[:lower:]' '[:upper:]')
        
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$PROJECT_DIR/.taskconfig.json"
        fi
        
        echo -n "    { \"key\": \"$key\", \"label\": \"$label\" }" >> "$PROJECT_DIR/.taskconfig.json"
    done
    
    cat >> "$PROJECT_DIR/.taskconfig.json" << EOF

  ],
  "port": 5500,
  "features": {
    "search": true,
    "fullTextSearch": true,
    "autoRefresh": true,
    "refreshInterval": 30000
  }
}
EOF
else
    # Use default configuration
    cp "$TASK_MANAGER_HOME/defaults/.taskconfig.json" "$PROJECT_DIR/"
fi

# 5. Update package.json if it exists
if [ -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${GREEN}📦 Updating package.json...${NC}"
    
    # Check if scripts section exists
    if ! grep -q '"scripts"' "$PROJECT_DIR/package.json"; then
        echo -e "${YELLOW}⚠️  No scripts section found in package.json${NC}"
        echo "Please add the following scripts manually:"
        echo '  "task-viewer": "npx http-server docs/logs -p \${PORT:-5500} -o .views/index.html"'
        echo '  "gen-index": "node scripts/gen_index.js"'
        echo '  "task-views": "node scripts/generate_task_views.cjs"'
        echo '  "logs-refresh": "npm run gen-index && npm run task-views"'
    else
        # Create backup
        cp "$PROJECT_DIR/package.json" "$PROJECT_DIR/package.json.backup"
        
        # Add scripts using Node.js for proper JSON handling
        node -e "
        const fs = require('fs');
        const packageJson = JSON.parse(fs.readFileSync('$PROJECT_DIR/package.json', 'utf8'));
        
        if (!packageJson.scripts) packageJson.scripts = {};
        
        packageJson.scripts['task-viewer'] = 'npx http-server docs/logs -p \${PORT:-5500} -o .views/index.html';
        packageJson.scripts['gen-index'] = 'node scripts/gen_index.js';
        packageJson.scripts['task-views'] = 'node scripts/generate_task_views.cjs';
        packageJson.scripts['logs-refresh'] = 'npm run gen-index && npm run task-views';
        
        fs.writeFileSync('$PROJECT_DIR/package.json', JSON.stringify(packageJson, null, 2));
        "
        
        echo -e "${GREEN}✅ package.json updated successfully${NC}"
    fi
fi

# 6. Create initial files
echo -e "${GREEN}📝 初期ファイルを作成中...${NC}"

# Create STATE_current.md
cat > "$PROJECT_DIR/docs/logs/STATE_current.md" << EOF
# 現在の作業状態 - $(date +%Y-%m-%d)

## 📋 BACKLOG
*優先度低・いつかやる*

## 🔥 TODO
*次にやるタスク*

## 👀 REVIEW
*実装完了・テスト待ち*

## ✅ DONE
*完了したタスク*

---
最終更新: $(date "+%Y-%m-%d %H:%M")
EOF

# Create README
cat > "$PROJECT_DIR/docs/logs/README.md" << EOF
# Task Management System

AI-First task management for modern development.

## Quick Start

### Create a new task
\`\`\`bash
./scripts/new-task.sh 001 my_first_task
\`\`\`

### View tasks
\`\`\`bash
npm run task-viewer
\`\`\`

### Update status
\`\`\`bash
# Move from TODO to REVIEW
mv docs/logs/tasks/001_my_first_task_todo.md \\
   docs/logs/tasks/001_my_first_task_review.md
\`\`\`

### Refresh index
\`\`\`bash
npm run logs-refresh
\`\`\`

## Custom Port
\`\`\`bash
PORT=8080 npm run task-viewer
\`\`\`
EOF

# 7. Hook設定のインストール(オプション)
if [ -f "$TASK_MANAGER_HOME/hooks/task-hooks.json" ]; then
    echo -e "${GREEN}🎯 Hook設定をインストール中...${NC}"
    
    # .claudeディレクトリがなければ作成
    mkdir -p "$PROJECT_DIR/.claude"
    
    # task-hooks.jsonをコピー
    cp "$TASK_MANAGER_HOME/hooks/task-hooks.json" "$PROJECT_DIR/.claude/"
    
    echo -e "${YELLOW}💡 Hook設定がインストールされました${NC}"
    echo "   .claude/task-hooks.json を settings.json にマージしてください"
fi

# 8. インデックス生成
echo -e "${GREEN}🔄 インデックスを生成中...${NC}"
node "$PROJECT_DIR/scripts/gen_index.js"

# 9. 完了メッセージ
echo
echo -e "${GREEN}✨ タスク管理システムのセットアップ完了！${NC}"
echo
echo "📚 次のステップ:"
echo "  1. 最初のタスクを作成:"
echo "     ${BLUE}./scripts/new-task.sh 001 my_first_task${NC}"
echo
echo "  2. タスクビューアーを起動:"
echo "     ${BLUE}npm run task-viewer${NC}"
echo
echo "  3. カスタムポートで起動:"
echo "     ${BLUE}PORT=8080 npm run task-viewer${NC}"
echo
echo "📖 ドキュメント: docs/logs/README.md"
echo "⚙️  設定ファイル: .taskconfig.json"
echo
echo -e "${GREEN}タスク管理を楽しんでください！ 🚀${NC}"