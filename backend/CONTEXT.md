# Backend Context

## Source of truth

- Product spec: `../Техническое_Задание.docx` and mirrored text in `../docs/technical-specification.md`.
- Backend stack required by spec: PHP + Laravel, PostgreSQL target, REST API, OpenAPI docs, Docker Compose startup.

## Current implementation map

- Auth: Sanctum token login/register/logout/me.
- Docker startup idempotently creates the single administrator.
- Debug startup also creates one user for each non-admin role.
- After bootstrap, only managers/admins create users; managers cannot grant privileged roles.
- Demo mode uses a real `DEMO` company tenant. Users, dictionaries, movements, and registers carry `company_id`.
- The idempotent debug seed contains 4 users, 3 accounts, 6 counterparties, 7 categories, 7 payments, and 4 incomes for June 2026.
- Roles: `initiator`, `treasurer`, `manager`, `admin` via `CheckRole` middleware.
- Dictionaries: accounts, counterparties, items.
- Money: `amount_kopecks` / `opening_balance_kopecks` integers. Keep it that way; no floats except CSV display formatting.
- Payment statuses in DB/code: `draft`, `on_approval`, `approved`, `in_registry`, `paid`, `rejected`.
- Spec names map to code names: `approval` => `on_approval`, `in-register` => `in_registry`.
- Calendar: `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD[&account_id=]` returns per-account daily income, expense, balance, `is_gap`.
- Approvals: `POST /api/payments/{payment}/submit`, `POST /api/payments/{payment}/decide` create approval journal records.
- Registries: `POST /api/registries` collects approved payments for one account/date; export CSV; mark paid.
- Reports: balances, upcoming gaps, plan/fact, balances CSV export.

## Spec compliance snapshot

Covered enough:

- Core reference data exists: accounts, counterparties, cash-flow items, users/roles.
- Payment and income CRUD exists.
- Payment approval path exists with journal records.
- Calendar computes daily end balances and cash gaps server-side.
- Payment move is covered by updating `payment_date`; balances recalc on next calendar request.
- Registry creation/export/mark-paid exists.
- Basic reports/export exist.

Gaps vs `Техническое_Задание.docx`:

- PostgreSQL/Docker/OpenAPI are required by spec but current repo still uses local Laravel defaults/SQLite-like setup unless configured elsewhere.
- Recurring payments are not implemented.
- File import of planned movements is not implemented.
- Registry selection does not yet account for priority and available balance; it attaches all approved payments for date/account.
- Calendar filters only by account; spec also asks item, counterparty, status.
- Calendar lacks all-accounts summary row.
- Audit/history for payment changes beyond approval journal is missing.
- Plan/fact has no real income fact source; paid payments are used for expense fact only.
- Report exports are partial; only balances and registry CSV exist.
- Admin user management endpoint is not visible.

## Next backend fixes, cheapest first

1. Tighten validation to match DB enums: `priority` is `low|normal|high`, status is fixed enum.
2. Add calendar filters for `item_id`, `counterparty_id`, `status`.
3. Add summary row to calendar response.
4. Make registry selection sort by priority and skip payments that would create negative balance.
5. Add Docker/PostgreSQL/OpenAPI only if delivery requires deployment/demo parity.
