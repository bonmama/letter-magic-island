#!/bin/bash
# 強制使用 Node 24 並升級 pnpm
npm install -g pnpm@9.0.0
corepack enable pnpm
corepack prepare pnpm@9.0.0 --activate
pnpm install
pnpm run build
