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
# Payment Calendar

Start the complete application:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

The database starts empty. Create the first administrator once:

```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Administrator\",\"email\":\"admin@example.com\",\"password\":\"change-me-now\"}"
```

The bootstrap endpoint closes after the first user is created. Managers and
administrators can then add users from the Admin page. Managers cannot grant
manager or administrator roles.
