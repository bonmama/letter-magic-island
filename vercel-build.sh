#!/bin/bash
# 強制啟用 pnpm 9 並執行 build
corepack enable pnpm
corepack prepare pnpm@9.0.0 --activate
pnpm install
pnpm run build
