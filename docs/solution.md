# Insurance Management System MVP

## Repository layout
```
frontend/   # Next.js App Router UI (MUI, React Hook Form, Zod, TanStack Query)
backend/    # Express API + Prisma/PostgreSQL
packages/
  shared/   # Shared enums/types for roles and audit events
```

## Database schema (Prisma)
**Core entities**
- **User**: system users with roles (ADMIN, AGENT, UNDERWRITER, CLAIMS_OFFICER, CUSTOMER).
- **CustomerProfile**: KYC metadata and dependents for customer users.
- **Product**: insurance products with coverage limits, premium rules, exclusions.
- **Quote**: draft/approved quotes with versioning and premium calculation metadata.
- **Policy**: issued policies with lifecycle status.
- **Claim**: claim submissions with workflow status.
- **Invoice**: premium invoices linked to policies.
- **Payment**: premium payments linked to policies.
- **AuditLog**: audit trail for sensitive actions.
- **RefreshToken / PasswordReset**: auth flows for refresh + password reset.

### Migration plan
1. Update `backend/prisma/schema.prisma` with new models/enums.
2. Run `npm run prisma:generate` to update the client.
3. Run `npm run prisma:migrate -- --name init` to create migrations.
4. Run `npm run prisma:seed` to load demo users, policies, claims, payments, and audit logs.

## REST API endpoints (high level)
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

### Users & Roles
- `GET /api/users` (admin list)
- `POST /api/users` (admin creates staff)

### Customers
- `GET /api/customers` (staff list)
- `GET /api/customers/me`
- `PUT /api/customers/me`

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Quotes
- `GET /api/quotes`
- `POST /api/quotes` (draft/submit)
- `PATCH /api/quotes/:id/status`

### Policies
- `GET /api/policies`
- `POST /api/policies` (issue from approved quote)

### Claims
- `GET /api/claims`
- `GET /api/claims/:id`
- `POST /api/claims`
- `PATCH /api/claims/:id/status`

### Payments & Invoices
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/invoices`
- `POST /api/invoices`

### Audit logs
- `GET /api/audit-logs`

## Sample requests/responses
### Login
**Request**
```json
{
  "email": "admin@insurance.com",
  "password": "admin123"
}
```

**Response**
```json
{
  "token": "<jwt>",
  "refreshToken": "<refresh>",
  "user": {
    "id": 1,
    "email": "admin@insurance.com",
    "role": "ADMIN",
    "name": "Admin User"
  }
}
```

### Create quote (draft)
**Request**
```json
{
  "productId": 1,
  "status": "DRAFT",
  "metadata": {
    "age": 32,
    "smoker": false
  }
}
```

**Response**
```json
{
  "id": 11,
  "productId": 1,
  "userId": 5,
  "premium": 360,
  "status": "DRAFT",
  "version": 1,
  "metadata": {
    "age": 32,
    "smoker": false
  }
}
```

### Issue policy from approved quote
**Request**
```json
{
  "quoteId": 11,
  "startDate": "2025-01-01",
  "endDate": "2026-01-01",
  "premiumPaid": true
}
```

**Response**
```json
{
  "id": 3,
  "policyNumber": "POL-1735689600000",
  "status": "ACTIVE",
  "premium": 360,
  "quoteId": 11,
  "productId": 1,
  "userId": 5
}
```

### Submit claim
**Request**
```json
{
  "policyId": 3,
  "claimType": "HEALTH",
  "amount": 1200,
  "incidentDate": "2025-01-15",
  "description": "Emergency visit"
}
```

**Response**
```json
{
  "id": 7,
  "status": "SUBMITTED",
  "amount": 1200,
  "policyId": 3,
  "userId": 5
}
```

## Frontend page map
- `/` landing page
- `/dashboard` overview (quotes, policies, claims)
- `/products` product catalog
- `/quotes` quote builder + history
- `/claims` claims submission + status
- `/admin` admin product management
- `/staff` staff workflows (quote review, claims triage)

## Component structure (UI)
- **Layout**: `components/Layout.tsx` for sidebar + topbar navigation.
- **Feature pages**: app router pages under `frontend/app/*`.
- **Forms**: React Hook Form + Zod schemas for validation.
- **Data**: TanStack Query hooks (to be expanded) for optimistic updates and caching.
