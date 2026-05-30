# Smart Building Monitor

Internal operations dashboard for monitoring rooms, sensors, alerts, and team access in a smart building. The app uses Next.js App Router, PostgreSQL, Prisma, Tailwind CSS, and Auth.js credentials login for internal users.

## Features

- Secure internal login with hashed passwords
- Protected dashboard, rooms, floor plan, sensors, alerts, and user access overview routes
- Role-based action visibility for Admin, Operator, and Viewer users
- Admin-created internal user accounts with activation, role changes, deletion, and password reset
- Current-user profile and password settings
- PostgreSQL-backed CRUD for rooms, sensors, and alerts
- Persisted alert acknowledgement, resolution, and source tracking
- Validation, loading, empty, error, success, and delete confirmation states
- SVG floor plan tied to real room records
- No public registration and no mock data as the source of truth

## Prerequisites

- Node.js 20+
- PostgreSQL
- npm

## Environment

Copy the example file and fill in real local values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_building_monitor"
AUTH_SECRET="replace-with-output-from-npx-auth-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-long-random-password"
SEED_ADMIN_NAME="Internal Admin"
SEED_OPERATOR_EMAIL="operator@example.com"
SEED_OPERATOR_PASSWORD="replace-with-a-long-random-password"
SEED_OPERATOR_NAME="Internal Operator"
SEED_VIEWER_EMAIL="viewer@example.com"
SEED_VIEWER_PASSWORD="replace-with-a-long-random-password"
SEED_VIEWER_NAME="Internal Viewer"
```

Generate a strong Auth.js secret:

```bash
npx auth secret
```

Use a long random password for `SEED_ADMIN_PASSWORD`. Passwords are hashed before storage and plaintext passwords are not stored in the database. After the first admin signs in, use `/users` to create and manage real internal accounts.

## Local Setup

Install dependencies:

```bash
npm install
```

Create the database in PostgreSQL if it does not already exist:

```sql
CREATE DATABASE smart_building_monitor;
```

Apply migrations and generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

Seed rooms, sensors, alerts, and internal users:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000/dashboard and sign in with one of the seeded internal users from your local `.env`.

## Production Build

```bash
npm run lint
npm run build
npm start
```

For deployment, provide `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `AUTH_TRUST_HOST` through the hosting platform secret manager. `AUTH_URL` should be the public HTTPS origin for the deployed app, such as `https://monitor.example.com`.

Run Prisma migrations against the production database as part of your release process. Seed only the initial admin account for first deployment, then use the admin-only `/users` page to create and manage operator/viewer accounts.

## Authentication Model

This is an internal operations dashboard, so public registration is intentionally excluded. Users are provisioned by seeded/admin-created accounts only. Auth.js handles secure session cookies/JWT sessions, while Prisma stores internal users with bcrypt-hashed passwords.

Inactive users cannot sign in. Protected API handlers load the current user from the database before authorizing sensitive actions, so role and active-state changes take effect server-side.

`src/proxy.ts` is used only for optimistic redirects. Protected API handlers still call `auth()` directly and return `401` when unauthenticated. Mutation endpoints enforce role permissions server-side and return `403` for authenticated users without the required permission.

## Role Access

- Admin: full CRUD for rooms, sensors, alerts, and internal users, plus access to `/access` and `/users`.
- Operator: read access everywhere, plus create/update/resolve alerts.
- Viewer: read-only access to operational pages.

The `/access` page is intentionally informational. Real user management lives in `/users`. `/users-roles` redirects to `/access`.

## API Overview

Authenticated APIs:

- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:id`
- `PUT /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `GET /api/sensors`
- `POST /api/sensors`
- `GET /api/sensors/:id`
- `PUT /api/sensors/:id`
- `DELETE /api/sensors/:id`
- `GET /api/alerts`
- `POST /api/alerts`
- `GET /api/alerts/:id`
- `PUT /api/alerts/:id`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `DELETE /api/alerts/:id`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/password`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/password`

Relational checks are enforced server-side:

- sensors must belong to an existing room
- alerts must belong to an existing room
- alert sensors, when provided, must belong to the selected alert room
- room location codes are generated automatically and must remain unique

## Useful Scripts

```bash
npm run dev       # start development server
npm run build     # production build
npm start         # start production server
npm run lint      # run ESLint
npm run db:seed   # seed demo building data and internal users
```
