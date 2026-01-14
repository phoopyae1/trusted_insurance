# Trusted Insurance

Full-stack insurance demo with a Next.js frontend and Express/Prisma backend for handling authentication, products, quotes, policies, claims, and payments.

## Project structure

```
apps/web   # Next.js 14 App Router + MUI UI
apps/api   # Express REST API with PostgreSQL + Prisma
packages/shared # Shared types/enums
```

See [`docs/solution.md`](docs/solution.md) for the MVP deliverables (schema, endpoints, page map, and sample requests).

## Prerequisites
- Node.js 18+
- npm
- Docker (for PostgreSQL)

## Environment variables
Copy the provided examples and update as needed.

```
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Database via Docker

Run PostgreSQL locally:

```
docker run --name trusted-insurance-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=trusted_insurance -p 5432:5432 -d postgres:16
```

## Backend setup

```
cd apps/api
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start
```

APIs will be available at `http://localhost:4000`. Swagger docs live at `/api/docs`.

## Frontend setup

```
cd apps/web
npm install
npm run dev
```

The Next.js app runs on `http://localhost:3000` and points to `NEXT_PUBLIC_API_URL` for API calls.

## Docker Compose

Run the full stack (Postgres + API + Web):

```
docker compose up --build
```

## Default users
- Admin: `admin@insurance.com` / `admin123`
- Agent: `agent@insurance.com` / `agent123`
- Underwriter: `underwriter@insurance.com` / `underwriter123`
- Claims Officer: `claims@insurance.com` / `claims123`
- Customer: `customer@insurance.com` / `customer123`

## Notable features
- JWT authentication with refresh tokens and role-based access (ADMIN, AGENT, UNDERWRITER, CLAIMS_OFFICER, CUSTOMER)
- Product CRUD, quotes with premium calculation, policy issuance, claim submissions, payments/invoices
- Audit logging for policy issuance, claim workflow updates, and payment recording
- Responsive MUI UI with dashboard pages, DataGrid tables, and form validation
