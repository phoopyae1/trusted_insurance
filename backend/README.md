# Trusted Insurance - Backend API

Backend API for the Trusted Insurance application built with Node.js, Express, and Prisma.

## Features

- RESTful API with Express.js
- PostgreSQL database with Prisma ORM
- JWT authentication
- Swagger API documentation
- Audit logging
- Role-based access control

## Prerequisites

- Node.js 18+
- PostgreSQL 16+ (or use Docker)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trusted_insurance
JWT_SECRET=your-secret-key
PORT=4000
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## Running the Application

### Development
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### Production
```bash
npm start
```

## Docker

Run with Docker Compose:
```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- API server on port 4000

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:4000/api/docs`
- Health check: `http://localhost:4000/api/health`

## API Endpoints

- `/api/auth` - Authentication (login, register)
- `/api/users` - User management
- `/api/customers` - Customer profiles
- `/api/products` - Insurance products
- `/api/quotes` - Insurance quotes
- `/api/policies` - Insurance policies
- `/api/claims` - Insurance claims
- `/api/payments` - Payment processing
- `/api/invoices` - Invoice management
- `/api/audit-logs` - Audit log viewing

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 4000)
