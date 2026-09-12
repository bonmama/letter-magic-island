#!/bin/bash
# 強制升級 pnpm 並啟用正確版本
npm install -g pnpm@9.0.0
corepack enable pnpm
corepack prepare pnpm@9.0.0 --activate

# 安裝依賴並建置
pnpm install
pnpm run build
