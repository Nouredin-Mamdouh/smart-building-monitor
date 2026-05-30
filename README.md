# Smart Building Monitor

Internal operations dashboard for monitoring rooms, sensors, and alerts in a smart building. The app uses Next.js App Router, PostgreSQL, Prisma, Tailwind CSS, and Auth.js credentials login for seeded internal users.

## Features

- Secure internal login with hashed passwords
- Protected dashboard, rooms, floor plan, sensors, alerts, and user access overview routes
- Role-based action visibility for Admin, Operator, and Viewer users
- PostgreSQL-backed CRUD for rooms, sensors, and alerts
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

Use a long random password for `SEED_ADMIN_PASSWORD`. Passwords are hashed before storage and plaintext passwords are not stored in the database.

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

For deployment, provide `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, and internal user provisioning values through the hosting platform secret manager. Run Prisma migrations against the production database as part of your release process.

## Authentication Model

This is an internal operations dashboard, so public registration is intentionally excluded. Users are provisioned through controlled seed/admin processes. Auth.js handles secure session cookies/JWT sessions, while Prisma stores internal users with bcrypt-hashed passwords.

`src/proxy.ts` is used only for optimistic redirects. Protected API handlers still call `auth()` directly and return `401` when unauthenticated. Mutation endpoints enforce role permissions server-side and return `403` for authenticated users without the required permission.

## Role Access

- Admin: full CRUD for rooms, sensors, and alerts, plus read-only access to `/users-roles`.
- Operator: read access everywhere, plus create/update/resolve alerts.
- Viewer: read-only access to operational pages.

The `/users-roles` page is intentionally informational. It lists real seeded users and the permission matrix, but does not expose fake user-management controls.

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
- `DELETE /api/alerts/:id`

Relational checks are enforced server-side:

- sensors must belong to an existing room
- alerts must belong to an existing room
- alert sensors, when provided, must belong to the selected alert room
- room `svgId` values must be unique

## Useful Scripts

```bash
npm run dev       # start development server
npm run build     # production build
npm start         # start production server
npm run lint      # run ESLint
npm run db:seed   # seed demo building data and internal users
```
