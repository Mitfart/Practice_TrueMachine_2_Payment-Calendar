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

Docker startup creates the single administrator automatically:

- Email: `admin@payment-calendar.local`
- Password: value of `BOOTSTRAP_USER_PASSWORD`

In debug mode it also creates one initiator, treasurer, and manager for the
debug login menu. The default local password is `Chicken_Road_K10_28`.
Additional users are created from the Admin page. A second administrator
cannot be created through the API.
