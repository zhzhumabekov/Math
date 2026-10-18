#!/bin/sh
# Сборка для Cloudflare Pages: копируем в dist/ только файлы сайта —
# без CLAUDE.md, tools/ и прочих рабочих файлов. Уроки работают и без сборки, прямо из папки.
# Настройки Cloudflare Pages: Build command — sh build.sh, Build output directory — dist.
set -e
rm -rf dist
mkdir dist
cp index.html style.css script.js 404.html _headers dist/
cp -r assets lessons dist/
echo "dist готова: $(find dist -type f | wc -l) файлов"
