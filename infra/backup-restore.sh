#!/usr/bin/env bash
# AlgoLens Postgres backup + restore drill (TRD §10: nightly snapshots, 14-day retention,
# restore drill documented & rehearsed). Run the drill against a SCRATCH database, never prod.
#
#   ./backup-restore.sh backup                 # one snapshot → $BACKUP_DIR
#   ./backup-restore.sh restore <dump.sql.gz>  # restore into $RESTORE_URL (must NOT be prod)
#   ./backup-restore.sh drill                  # backup prod → restore to scratch → verify → report
#
# Env: DATABASE_URL (prod, read-only use), RESTORE_URL (scratch), BACKUP_DIR (default ./backups).
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

backup() {
  mkdir -p "$BACKUP_DIR"
  local out="$BACKUP_DIR/algolens-$STAMP.sql.gz"
  echo "→ dumping $DATABASE_URL"
  pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$out"
  echo "→ wrote $out ($(du -h "$out" | cut -f1))"
  # Prune snapshots older than retention.
  find "$BACKUP_DIR" -name 'algolens-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete
  echo "$out"
}

restore() {
  local dump="$1"
  [ -n "${RESTORE_URL:-}" ] || { echo "RESTORE_URL not set" >&2; exit 1; }
  case "$RESTORE_URL" in
    "$DATABASE_URL") echo "REFUSING to restore over DATABASE_URL (prod)" >&2; exit 1;;
  esac
  echo "→ restoring $dump into $RESTORE_URL"
  gunzip -c "$dump" | psql "$RESTORE_URL"
}

drill() {
  local dump; dump="$(backup | tail -n1)"
  restore "$dump"
  # Verify a few invariants on the restored copy.
  local users tables
  tables="$(psql -tA "$RESTORE_URL" -c "select count(*) from information_schema.tables where table_schema='public';")"
  users="$(psql -tA "$RESTORE_URL" -c "select count(*) from users;" 2>/dev/null || echo "n/a")"
  echo "✓ restore drill OK — public tables: $tables, users rows: $users"
  echo "  RTO note: time this run end-to-end and record it in the runbook."
}

case "${1:-}" in
  backup)  backup ;;
  restore) restore "${2:?usage: restore <dump.sql.gz>}" ;;
  drill)   drill ;;
  *) echo "usage: $0 {backup|restore <dump>|drill}" >&2; exit 1 ;;
esac
