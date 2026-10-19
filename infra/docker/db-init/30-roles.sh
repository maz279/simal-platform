#!/bin/sh
# First start of an empty volume: least-privilege roles (simal_app read/write, simal_build
# read-only on content tables) with the passwords from compose.env. migrate.sql + seed.sql
# ran before this (10-, 20-).
set -eu
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v app_password="$SIMAL_APP_PASSWORD" -v build_password="$SIMAL_BUILD_PASSWORD" \
  -f /sql/prod-db-roles.sql
