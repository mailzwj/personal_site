#!/usr/bin/env bash
# Meet AI Home — 一键启动脚本

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🤖  Meet AI Home — 启动中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install backend deps
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd "$BACKEND_DIR" && npm install
fi

# Install frontend deps
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "📦 安装前端依赖..."
  cd "$FRONTEND_DIR" && npm install
fi

# Ensure uploads dir
mkdir -p "$PROJECT_DIR/uploads"

echo ""
echo "🚀 启动后端服务 (端口 3001)..."
cd "$BACKEND_DIR" && node server.js &
BACKEND_PID=$!

echo "⚡ 启动前端服务 (端口 5173)..."
cd "$FRONTEND_DIR" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  启动成功！"
echo ""
echo "  前端:    http://localhost:5173"
echo "  后端API: http://localhost:3001"
echo "  管理后台: http://localhost:5173/admin"
echo ""
echo "  默认账号: meet-ai / admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "按 Ctrl+C 停止服务..."

wait $BACKEND_PID $FRONTEND_PID
