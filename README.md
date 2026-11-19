# CyberTime — Accounts and Authentication

CyberTime is a working authentication and member management increment for the approved Internet Cafe Account Billing & Self-Service Time Extension project. It implements the SRS account feature (FR-001 through FR-003) and role-restricted cashier operations.

## Included

- Patron, cashier, and admin roles with role-aware dashboards.
- Public patron sign-up with username, optional Student ID, and password; new self-registered accounts start at zero balance.
- Cashier/admin patron registration, optional Student ID, and initial cash deposit, as specified in FR-003.
- Username or Student ID sign-in; duplicate username/Student ID prevention.
- BCrypt password hashing (12 rounds), server-side PostgreSQL sessions, HTTP-only cookies, and logout.
- Server-enforced role checks for account list and manual cash top-up endpoints.
- PostgreSQL-backed users and auditable cash top-up transactions.

Patrons can self-register with no initial credit; cashiers can also create patron accounts and record initial cash deposits as specified in FR-003. Staff credentials must be provisioned by the cafe operator; there is no public staff registration or hard-coded demo account.

## Requirements

Node.js 20+, npm, and PostgreSQL 15+ (local or Supabase). Create a PostgreSQL database called `cybertime`, then run `server/schema.sql` against it. The server also creates its session table on first startup.

```powershell
Copy-Item .env.example .env
# Edit DATABASE_URL and SESSION_SECRET in .env
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` calls to the API at port 8080. For an initial cashier/admin account, generate a bcrypt hash (`node -e "import('bcryptjs').then(async b=>console.log(await b.hash('ReplaceThisPassword!',12)))"`) and insert it directly into the database:

```sql
INSERT INTO users(username,password_hash,role)
VALUES ('cashier', '<paste-bcrypt-hash>', 'CASHIER');
```

Set `role` to `ADMIN` for the owner account. Change the initial password after distributing credentials. Patron accounts should then be created in the staff dashboard.

## Production

Set `NODE_ENV=production`, a strong random `SESSION_SECRET`, `DATABASE_URL`, `PGSSL=true` when your PostgreSQL provider requires TLS, and `CLIENT_ORIGIN` to your deployed origin. Build the frontend and serve the compiled app from the API:

```powershell
npm run build
npm start
```

Use HTTPS in production so secure session cookies are enabled. Do not commit `.env` or production credentials.

## API summary

- `POST /api/auth/login` — username/student ID and password; establishes session.
- `GET /api/auth/me` — current signed-in user.
- `POST /api/auth/logout` — destroys session.
- `POST /api/users` — cashier/admin creates patron with optional initial deposit.
- `GET /api/users` — cashier/admin lists accounts.
- `POST /api/users/:id/topups` — cashier/admin records cash top-up.
- `GET /api/health` — process health.

## Scope note

This increment implements user accounts and role-protected dashboards. Active PC session timers, QR/e-wallet payment webhooks, live station status, and rate configuration are later project features in the SRS and are not represented as completed here.

## Project structure

```text
server/
  config/       Environment configuration
  db/           PostgreSQL pool
  middleware/   Authentication, roles, and async error handling
  routes/       API endpoint to controller mapping
  controllers/  HTTP input/output and status handling
  services/     Shared session and user formatting logic
  app.js        Express middleware and route registration
  index.js      API process entry point
  schema.sql    Database schema and indexes
src/
  api/          HTTP client and auth/member API calls
  components/   Shared UI pieces
  pages/        Sign-in, dashboard, and staff screens
  App.jsx       Session state and page coordination
  main.jsx      Browser entry point
```

When debugging, start at the route, follow it to the controller, and then to the database pool or frontend API service. API errors include server-side log messages while responses avoid exposing database internals.
