#!/bin/bash
# Выкладка сайта на хостинг Рег.ру по FTPS с этого Mac.
#
# Выкладывается то, что закоммичено в git (HEAD), и только файлы, изменившиеся
# с прошлой выкладки (метка — в .deploy-state). Пароль берётся из связки ключей macOS:
#   security add-generic-password -s yaartist-ftp -a u3680971 -w
#
#   ./deploy.sh            — выложить изменения
#   ./deploy.sh --all      — выложить все файлы заново
#   ./deploy.sh --dry-run  — показать, что будет выложено, ничего не отправляя
#   ./deploy.sh --ls [путь]— показать содержимое папки на хостинге

set -euo pipefail
cd "$(dirname "$0")"

FTP_HOST="${FTP_HOST:-sm46.hosting.reg.ru}"
FTP_USER="${FTP_USER:-u3680971}"
FTP_DIR="${FTP_DIR:-www/yaartist.com}"
KEYCHAIN_SERVICE="yaartist-ftp"
STATE_FILE=".deploy-state"

# Что не нужно на хостинге
EXCLUDE_RE='^(\.github/|api/|node_modules/|package(-lock)?\.json$|\.vercelignore$|\.gitignore$|deploy\.sh$|\.deploy-state$)|(^|/)\.DS_Store$'

MODE="changed"; DRY=0; LS_PATH=""
case "${1:-}" in
  --all) MODE="all" ;;
  --dry-run) DRY=1 ;;
  --ls) MODE="ls"; LS_PATH="${2:-}" ;;
  "") ;;
  *) echo "Неизвестный параметр: $1"; exit 2 ;;
esac

PASS="$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$FTP_USER" -w 2>/dev/null || true)"
if [ -z "$PASS" ]; then
  echo "Пароль FTP не найден в связке ключей. Сохраните его командой:"
  echo "  security add-generic-password -s $KEYCHAIN_SERVICE -a $FTP_USER -w"
  exit 1
fi

# Логин и пароль передаём curl через временный конфиг (не в командной строке)
CFG="$(mktemp)"; chmod 600 "$CFG"
trap 'rm -f "$CFG"' EXIT
printf 'user = "%s:%s"\nssl-reqd\nftp-create-dirs\nsilent\nshow-error\nconnect-timeout = 20\nretry = 2\n' \
  "$FTP_USER" "${PASS//\"/\\\"}" > "$CFG"
BASE="ftp://$FTP_HOST/$FTP_DIR"

if [ "$MODE" = "ls" ]; then
  curl -K "$CFG" --list-only "ftp://$FTP_HOST/${LS_PATH%/}/"
  exit 0
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Есть незакоммиченные изменения — сначала закоммитьте их, выкладывается только закоммиченное."
  exit 1
fi

HEAD_SHA="$(git rev-parse HEAD)"
LAST_SHA="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [ "$MODE" = "changed" ] && { [ -z "$LAST_SHA" ] || ! git cat-file -e "$LAST_SHA" 2>/dev/null; }; then
  MODE="all"
fi

UPLOAD=(); DELETE=()
if [ "$MODE" = "all" ]; then
  while IFS= read -r f; do UPLOAD+=("$f"); done < <(git ls-files | grep -Ev "$EXCLUDE_RE" || true)
else
  # Изменённые/новые/переименованные — загрузить; удалённые и старые имена переименованных — удалить
  DIFF="$(git diff --name-status "$LAST_SHA" "$HEAD_SHA")"
  while IFS= read -r f; do [ -n "$f" ] && UPLOAD+=("$f"); done < <(printf '%s\n' "$DIFF" | awk -F'\t' '$1!="D" && NF{print ($1 ~ /^R/ ? $3 : $2)}' | grep -Ev "$EXCLUDE_RE" || true)
  while IFS= read -r f; do [ -n "$f" ] && DELETE+=("$f"); done < <(printf '%s\n' "$DIFF" | awk -F'\t' '$1=="D" || $1 ~ /^R/{print $2}' | grep -Ev "$EXCLUDE_RE" || true)
fi

echo "Хостинг: $FTP_HOST/$FTP_DIR · коммит ${HEAD_SHA:0:7} · режим: $MODE"
echo "Загрузить: ${#UPLOAD[@]} · удалить: ${#DELETE[@]}"
[ "$DRY" = 1 ] && { printf '  + %s\n' "${UPLOAD[@]:+${UPLOAD[@]}}"; printf '  - %s\n' "${DELETE[@]:+${DELETE[@]}}"; exit 0; }

if [ "${#UPLOAD[@]}" -gt 0 ]; then
  # Файлы берём из коммита, а не из рабочей папки — выкладывается ровно HEAD
  TMP="$(mktemp -d)"; trap 'rm -f "$CFG"; rm -rf "$TMP"' EXIT
  LIST="$TMP/.curl-list"; : > "$LIST"
  for f in "${UPLOAD[@]}"; do
    mkdir -p "$TMP/$(dirname "$f")"
    git show "$HEAD_SHA:$f" > "$TMP/$f"
    enc="$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$f")"
    printf 'upload-file = "%s"\nurl = "%s/%s"\n' "$TMP/$f" "$BASE" "$enc" >> "$LIST"
  done
  curl -K "$CFG" -K "$LIST"
  echo "Загружено файлов: ${#UPLOAD[@]}"
fi

for f in "${DELETE[@]:+${DELETE[@]}}"; do
  curl -K "$CFG" -o /dev/null -Q "DELE $FTP_DIR/$f" "ftp://$FTP_HOST/" || echo "Не удалось удалить: $f"
done

echo "$HEAD_SHA" > "$STATE_FILE"
echo "Готово: сайт на хостинге обновлён до ${HEAD_SHA:0:7}"
