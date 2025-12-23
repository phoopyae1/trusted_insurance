# Trusted Insurance

Full-stack insurance demo with a Next.js frontend and Express/Prisma backend for handling authentication, products, quotes, policies, and claims.

## Project structure

```
frontend/  # Next.js 14 App Router + MUI UI
backend/   # Express REST API with PostgreSQL + Prisma
```

## Prerequisites
- Node.js 18+
- npm
- Docker (for PostgreSQL)

## Environment variables
Copy the provided examples and update as needed.

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Database via Docker

Run PostgreSQL locally:

```
docker run --name trusted-insurance-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=trusted_insurance -p 5432:5432 -d postgres:16
```

## Backend setup

```
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start
```

APIs will be available at `http://localhost:4000`. Swagger docs live at `/api/docs`.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

The Next.js app runs on `http://localhost:3000` and points to `NEXT_PUBLIC_API_URL` for API calls.

## Default users
- Admin: `admin@insurance.com` / `admin123`
- Staff: `staff@insurance.com` / `staff123`

## Notable features
- JWT authentication with role-based routes (CUSTOMER, STAFF, ADMIN)
- Product CRUD (admin), quote requests, policy issuance, and claim submissions with validation
- MUI UI with theme toggle, stepper-based quote form, DataGrid-driven tables, and responsive layout
