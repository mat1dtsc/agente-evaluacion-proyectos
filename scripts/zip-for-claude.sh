#!/bin/bash
# Crea un ZIP del código fuente listo para subir a Claude Projects.
# Excluye node_modules, dist, _cache, screenshots — solo el código.
set -e
cd "$(dirname "$0")/.."

OUT="agente-eval-proyectos-source.zip"
rm -f "$OUT"

zip -r "$OUT" \
  src/ \
  public/data/ \
  scripts/etl/*.ts scripts/etl/*.mjs scripts/etl/*.md \
  package.json \
  package-lock.json \
  tsconfig.json \
  vite.config.ts \
  tailwind.config.ts \
  postcss.config.js \
  index.html \
  README.md \
  .gitignore \
  vercel.json \
  -x "node_modules/*" "dist/*" "_cache/*" "screenshots/*" "*.log"

echo "✓ Created $OUT"
du -h "$OUT"
