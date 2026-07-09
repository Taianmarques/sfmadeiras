#!/usr/bin/env bash
# Expira lotes de pontos vencidos (12 meses sem uso). Rode isso 1x por dia via
# crontab do sistema:
#
#   crontab -e
#   0 3 * * * /caminho/para/sfmadeiras/deploy/cron-expirar-pontos.sh >> /var/log/sfmadeiras-cron.log 2>&1
#
# Lê CRON_SECRET e APP_URL do .env do projeto (mesmo diretório, um nível acima).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
set -a
source "$DIR/.env"
set +a

APP_URL="${NEXTAUTH_URL:-http://127.0.0.1:3000}"

curl -sf -X POST "$APP_URL/api/cron/expirar-pontos" \
  -H "x-cron-secret: $CRON_SECRET" \
  -w "\nstatus=%{http_code}\n"
