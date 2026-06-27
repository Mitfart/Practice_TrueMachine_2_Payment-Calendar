# Practice TrueMachine 2: Payment Calendar

Laravel 12 + React 19 base setup for the payment-calendar technical specification.

- Backend: `backend/`
- Frontend: `frontend/`
- Spec: `docs/technical-specification.md`
- Agent/DOX contract: `AGENTS.md`

## Run

```bash
cd frontend
npm run dev
```

Backend needs local PHP + Composer:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
```
