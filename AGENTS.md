# Payment Calendar - AGENTS.md

# DOX framework

- DOX is installed here as the repo operating contract.
- Read this file before editing any repo path.
- Keep durable project facts in this file, `CONTEXT.md`, or `docs/`.

## Project Contract

- Default communication: concise/caveman style unless user asks otherwise.
- Product source of truth: [`docs/technical-specification.md`](docs/technical-specification.md).
- Original source file: [`_INFO/ТЗ-03_Платёжный_календарь.docx`](_INFO/ТЗ-03_Платёжный_календарь.docx).
- Stack: Laravel 12 backend in `backend/`, React 19 + TypeScript + Vite frontend in `frontend/`.
- Do not add dependencies until an existing package/native feature is insufficient.

## Work Guidance

- Backend work belongs in `backend/`; follow Laravel conventions before custom structure.
- Frontend work belongs in `frontend/`; keep components small and typed.
- Money logic must avoid floats. Use integer minor units or decimal strings.
- Calendar/liquidity calculations belong server-side first; UI may display and request recalculation.
- Payment statuses from spec: draft, approval, approved, in-register, paid, rejected.

## Verification

- Frontend: `cd frontend && npm run build`.
- Backend: `cd backend && composer install && php artisan test` once PHP/Composer are available.

## Child DOX Index

- `backend/` — Laravel API/application skeleton.
- `frontend/` — React TypeScript client skeleton.
- `docs/` — durable product/domain documentation, including the technical specification.
- `_INFO/` — original source materials; do not edit unless explicitly asked.
