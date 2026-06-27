# Backend - AGENTS.md

## Purpose

Laravel 12 backend for payment-calendar API, persistence, auth, approval flow, registers, and liquidity calculations.

## Local Contracts

- Follow Laravel defaults: controllers, requests, models, migrations, policies, tests.
- Store money safely: integer minor units or decimal strings, never PHP floats for balances.
- Put shared balance/calendar recalculation in one service/action, not scattered controllers.
- API must follow `docs/technical-specification.md` terminology.

## Verification

- `composer install`
- `php artisan test`
