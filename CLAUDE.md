# CLAUDE.md

## Architecture Rules

- Sensitive writes and backend logic go in RPCs/views, not the app.

## Backend Ownership

All Supabase schema and backend logic is owned by a separate Claude session with a live
Supabase connection. That includes: CREATE/ALTER TABLE, RLS policies, RPCs/functions,
triggers, migrations, and seed data. Do not write, apply, or propose SQL for any of these,
even as a suggestion or draft.

If a task appears to need a new RPC, a table change, a new column, or a different RLS
policy: stop and report back what's needed and why, rather than creating it. Read-only
queries against Supabase (SELECT, checking a function signature, confirming a table
shape) are fine for verification, but do not use apply_migration or execute DDL of any
kind.

Treat any RPC contract handed to you (function name, parameters, return shape) as
authoritative and final. If the app's needs don't match the contract, report the mismatch
rather than writing a new function to paper over it.
