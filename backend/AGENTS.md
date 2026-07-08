# Backend - AGENTS.md

## Purpose

Laravel 12 backend for payment-calendar API, persistence, auth, approval flow, registries, reports, and liquidity calculations.

## Local Context

- Read `backend/CONTEXT.md` before backend edits; it tracks current spec compliance and known gaps.
- Source of truth remains `../Техническое_Задание.docx` / `../docs/technical-specification.md`.

## Local Contracts

- Follow Laravel defaults: controllers, requests, models, migrations, policies, tests.
- Store money safely: integer minor units or decimal strings, never PHP floats for balances.
- Put shared balance/calendar recalculation in one service/action, not scattered controllers.
- API must follow `../docs/technical-specification.md` terminology.
- Code enum names may use ASCII snake_case, but document mapping to Russian/spec terms in `backend/CONTEXT.md`.
- Validate request values against DB enums; do not accept free-form status/priority.
- Registry selection must eventually respect priority and available balance; do not deepen current all-approved shortcut without noting it.

## Verification

- `composer install`
- `php artisan test`
