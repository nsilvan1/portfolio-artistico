#!/usr/bin/env bash
# Regera os PDFs do portfólio a partir do site (os dados vêm de classico.html).
# Uso: com o site rodando localmente (npx serve -l 5173 .), execute: bash gerar-pdfs.sh
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
BASE="${BASE:-http://localhost:5173}"
PERFIL="$(mktemp -d)"   # perfil isolado: evita cache e não mexe no Chrome do dia a dia
trap 'rm -rf "$PERFIL"' EXIT
v=$(date +%s)

gerar() {
  "$CHROME" --headless --disable-gpu --user-data-dir="$PERFIL" --no-first-run --no-pdf-header-footer \
    --virtual-time-budget=20000 --run-all-compositor-stages-before-draw \
    --print-to-pdf="$(pwd -W 2>/dev/null || pwd)/$2" "$BASE/$1?v=$v" 2>&1 | grep -i "written" || true
}

gerar portfolio-pdf.html       Nathan-Silva-Portfolio-2026.pdf
gerar portfolio-pdf-fotos.html Nathan-Silva-Portfolio-2026-Fotos.pdf
