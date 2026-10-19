#!/bin/sh
# migrate.sh — applies migrate.sql via psql (no code, just a wrapper)
# Usage: SIMAL_PG_PW=your_password sh scripts/migrate.sh
# Or set PGHOST/PGPORT/PGDATABASE/PGUSER env vars

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PSQL="${PSQL_PATH:-$DIR/../tools/pgsql/bin/psql.exe}"
SQL="$DIR/migrate.sql"

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5433}"
PGDATABASE="${PGDATABASE:-simal}"
PGUSER="${PGUSER:-simal}"

echo "Applying DDL to ${PGDATABASE} on ${PGHOST}:${PGPORT} as ${PGUSER}..."
"${PSQL}" -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$SQL" -v ON_ERROR_STOP=1
echo "Migration complete."
