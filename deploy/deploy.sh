#!/usr/bin/env bash
# Roda na VPS pra aplicar uma atualização: puxa o código novo, reinstala
# dependências se preciso, aplica migrations pendentes, builda e reinicia
# o processo no PM2. Uso:
#
#   ./deploy/deploy.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> build"
npm run build

echo "==> pm2 restart"
pm2 restart sfmadeiras --update-env

echo "Deploy concluído."
