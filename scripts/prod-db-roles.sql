-- =====================================================================
-- Simal Corporate Platform — Production Database Hardening (DAT-9)
-- Non-Superuser Least-Privilege Role Setup & SCRAM-SHA-256 Configuration
-- Reference: PostgreSQL 16 Security Documentation & OWASP ASVS 5.0.0
--
-- rm(7.1-1) rewrite (roadmap v1.2 corrections):
--   * psql variables do NOT expand inside DO $$…$$ bodies — the old script's
--     CREATE ROLE stored/broke on the literal :'app_password'. Role creation
--     now uses the WHERE NOT EXISTS + \gexec pattern instead.
--   * The old ELSE branch never set a password, so re-running the script left
--     a previously exposed password live. The unconditional ALTER ROLE …
--     PASSWORD below now ROTATES the credential on every run.
--   * ALTER DEFAULT PRIVILEGES now carries FOR ROLE simal — without it the
--     defaults only applied to objects created by whoever happened to run
--     the script, not by the migration superuser.
--   * Grants target current_database() so the same script hardens the main
--     database AND per-run CI databases (simal_ci, simal_gate_*).
--
-- Usage (hex passwords — a literal '#' would break connection URLs):
--   psql -h 127.0.0.1 -p 5433 -U simal -d simal -v ON_ERROR_STOP=1 \
--        -v app_password=<hex> -v build_password=<hex> -f scripts/prod-db-roles.sql
-- =====================================================================

-- 1. Password encryption defaults to SCRAM-SHA-256
SET password_encryption = 'scram-sha-256';

-- 2. Least-privilege application role (create if missing — \gexec, not DO $$:
--    psql vars don't expand inside DO bodies)
SELECT format('CREATE ROLE simal_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 50')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'simal_app') \gexec

-- Unconditional attribute + PASSWORD rotation — every run re-rotates, so a
-- burned credential can never survive a re-run (rm(7.1-1)).
ALTER ROLE simal_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 50
  PASSWORD :'app_password';

-- 3. Database connection privilege (current_database(): works for simal AND CI dbs)
SELECT format('GRANT CONNECT ON DATABASE %I TO simal_app', current_database()) \gexec

-- 4. Schema usage privilege
GRANT USAGE ON SCHEMA public TO simal_app;

-- 5. Table level DML privileges (SELECT, INSERT, UPDATE, DELETE only)
-- Explicitly exclude DDL privileges (DROP, ALTER, TRUNCATE)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO simal_app;

-- 6. Sequence privileges for identity and standalone sequences
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO simal_app;

-- 7. Default privileges for future objects created by the MIGRATION role (simal),
--    not merely by whoever runs this script (rm(7.1-1) fix)
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO simal_app;
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO simal_app;

-- 8. Revoke dangerous public schema creation rights (PostgreSQL 15+ hardening)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- ============================================================
-- simal_build — READ-ONLY role for the SSG site build worker
-- (F-2026-N001 / roadmap Task 1.1-2). The portal's SSG loop strips
-- its privileged DATABASE_URL and injects this role instead via
-- BUILD_DATABASE_URL, so the Astro build can read content but can
-- never write or escalate.
-- ============================================================
\if :{?build_password}
SET password_encryption = 'scram-sha-256';
SELECT format('CREATE ROLE simal_build LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'simal_build') \gexec
ALTER ROLE simal_build WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
  PASSWORD :'build_password';
SELECT format('GRANT CONNECT ON DATABASE %I TO simal_build', current_database()) \gexec
GRANT USAGE ON SCHEMA public TO simal_build;
-- deploy-audit H7: the build role read EVERY table — users (password hashes, TOTP secrets),
-- sessions, one_time_tokens, submissions/documents (KYC PII) — although the site build reads
-- content only. Revoke the old blanket grants (re-runs harden an existing database), then
-- grant SELECT on exactly the tables apps/site queries.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM simal_build;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM simal_build;
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public REVOKE SELECT ON TABLES FROM simal_build;
ALTER DEFAULT PRIVILEGES FOR ROLE simal IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM simal_build;
GRANT SELECT ON products, product_deep, brands, content_blocks, hero_slides, testimonials,
  category_guides, legal_policies, announcements TO simal_build;
\else
\echo 'prod-db-roles.sql: skipping simal_build (no build_password variable supplied)'
\endif
