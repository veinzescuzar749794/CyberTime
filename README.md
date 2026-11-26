# CyberTime — Accounts and Authentication

CyberTime is the account and member-management foundation for the approved Internet Cafe Account Billing & Self-Service Time Extension System.

## Features

- Patron, cashier, and admin roles with role-aware dashboards.
- Patron self-registration using username, email, password, and optional Student ID; self-registered balances start at zero.
- Cashier/admin registration of patrons with optional initial cash deposits.
- Username or Student ID login, BCrypt password hashing, PostgreSQL-backed sessions, secure cookies, logout, and backend role checks.
- Profile viewing and editing for the signed-in account only.
- Password changes that require the current password, validate confirmation, hash the new password, and end active sessions.
- Forgot-password email recovery using a random, hashed, single-use token with a 30-minute expiry. Requests are rate-limited to five per 15 minutes.

## Setup

Requirements: Node.js 20+, npm, and PostgreSQL 15+ (local PostgreSQL or Supabase). Copy `.env.example` to `.env`, then set `DATABASE_URL`, a long random `SESSION_SECRET`, and the SMTP settings below. Run `server/schema.sql` in the Supabase SQL Editor or with `psql`; the script adds the Increment 2 columns and reset-token table to an existing Increment 1 database. The server creates the PostgreSQL session table at startup.

```powershell
Copy-Item .env.example .env
# Edit .env with your database, session, and mail settings.
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` requests to the API on port 8080.

### SMTP for password recovery

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, and `APP_ORIGIN` in `.env`. Use an app password or provider-issued SMTP credential. Never commit `.env`. If SMTP is not configured, the app disables recovery and does not reveal reset tokens.

### First staff account

Create the first cashier/admin account directly in PostgreSQL. Generate a BCrypt hash:

```powershell
node -e "import('bcryptjs').then(async b=>console.log(await b.hash('Use-A-Temporary-Password!',12)))"
```

Then insert it (set role to `ADMIN` for the owner):

```sql
INSERT INTO users(username, email, password_hash, role)
VALUES ('cashier', 'cashier@example.com', '<paste-bcrypt-hash>', 'CASHIER');
```

Have staff set an email for existing patron records before those members need email password recovery. Patron accounts can add/update their email under **Profile & Security**.

## API summary

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/password`
- `GET /api/users`, `POST /api/users`, `POST /api/users/:id/topups` (cashier/admin only)

## Project structure

```text
server/config/       Environment and SMTP settings
server/db/           PostgreSQL pool
server/middleware/   Authentication, roles, rate limiting, async errors
server/routes/       API endpoint mappings
server/controllers/  Request validation and application operations
server/services/     Session helpers and email delivery
server/app.js        Express setup and route registration
server/schema.sql    Database schema and Increment 2 migration
src/api/             HTTP client and auth/member/profile calls
src/components/      Shared UI components
src/pages/           Sign-in, dashboard, member, profile, and reset screens
src/App.jsx          Session state and page coordination
```

To trace a bug, follow the API path from `server/routes/` to `server/controllers/`, then to `server/db/` or `server/services/`. For UI issues, follow `src/pages/` to the matching call in `src/api/`.

## Remaining SRS scope

Active PC session timers, QR/e-wallet payment webhooks, live station status, and rate configuration are later project features and are not represented as completed here.
