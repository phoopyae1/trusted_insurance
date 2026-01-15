# Insurance Management System (IMS) — Full Solution

## Step 0 — Project brief (start here)
### Modules
- **Identity & Access**: authentication, roles/permissions, user management.
- **Customers**: customer profile, KYC, contacts, addresses, dependents.
- **Products & Plans**: product catalog, coverage limits, exclusions, riders.
- **Quotes**: quote drafts, risk factors, premium calculation, approvals.
- **Policies**: policy issuance, lifecycle, renewals, cancellations.
- **Claims**: claim submission, document uploads, adjudication workflow.
- **Billing**: invoices, payments, receipts, reconciliation.
- **Audit & Reporting**: audit log, analytics, exports.
- **Admin Tools**: system settings, staff management.

### User roles
- **Admin**: full access, configuration, audit.
- **Agent**: sales, quotes, customer onboarding.
- **Underwriter**: quote approvals, risk review, pricing overrides.
- **Claims Officer**: claims review, approvals, payouts.
- **Customer**: self-service quotes, policy and claim view.
- **Accountant**: billing, payment reconciliation, reports.

### Key workflows
1. **Quote-to-Policy**: Customer/Agent creates quote → Underwriter approves → Policy issued.
2. **Claims**: Customer submits claim → Claims Officer reviews → Approve/Reject → Payment.
3. **Billing**: Policy generates invoices → Payments recorded → Invoice status updates.

### Frontend page map
- `/` landing
- `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
- `/dashboard` (role-specific overview)
- `/customers` list, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit`
- `/products` list, `/products/new`, `/products/[id]`, `/products/[id]/edit`
- `/quotes` list, `/quotes/new`, `/quotes/[id]`
- `/policies` list, `/policies/[id]`
- `/claims` list, `/claims/new`, `/claims/[id]`
- `/billing/invoices`, `/billing/payments`
- `/admin/audit-logs`

### Backend endpoints (high-level)
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Customers: `/api/customers/*`
- Products: `/api/products/*`
- Quotes: `/api/quotes/*`
- Policies: `/api/policies/*`
- Claims: `/api/claims/*`
- Billing: `/api/invoices/*`, `/api/payments/*`
- Audit: `/api/audit-logs/*`

---

## Step 1 — Roles + permissions (RBAC)
### Permission matrix (module × role)
| Module | Admin | Agent | Underwriter | Claims Officer | Customer | Accountant |
|---|---|---|---|---|---|---|
| Users/Roles | CRUD | R | R | R | - | R |
| Customers | CRUD | CRUD | R | R | R (self) | R |
| Products | CRUD | R | R | R | R | R |
| Quotes | CRUD | CRUD | Approve/Update | R | Create/View (self) | R |
| Policies | CRUD | R | Issue/Update | R | View (self) | R |
| Claims | CRUD | Create/View | R | Approve/Update | Create/View (self) | R |
| Billing | CRUD | R | R | R | View (self) | CRUD |
| Audit Logs | R | - | - | - | - | R |

### RBAC implementation
**Node.js (Express/Nest)**
- Store `roles` and `permissions` in DB and cache in-memory.
- Middleware/guard checks JWT and permission claims, e.g. `requirePermission('quotes:approve')`.
- Centralized policy map for route-level enforcement.

**Next.js**
- `middleware.ts` checks auth session and role claims.
- Route guards via layout wrappers, e.g. `<RequirePermission />`.
- Hide/disable UI actions based on permissions.

---

## Step 2 — Database design (Prisma schema)
```prisma
model User {
  id          Int       @id @default(autoincrement())
  email       String    @unique
  name        String
  password    String
  role        Role      @relation(fields: [roleId], references: [id])
  roleId      Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  quotes      Quote[]
  policies    Policy[]
  claims      Claim[]
}

model Role {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  users       User[]
}

model Customer {
  id          Int       @id @default(autoincrement())
  user        User?     @relation(fields: [userId], references: [id])
  userId      Int?
  firstName   String
  lastName    String
  phone       String?
  address     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  policies    Policy[]
  quotes      Quote[]
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String
  type        String
  basePremium Float
  coverage    Json
  exclusions  Json
  riders      Json
  active      Boolean   @default(true)
  quotes      Quote[]
}

model Quote {
  id          Int       @id @default(autoincrement())
  customer    Customer  @relation(fields: [customerId], references: [id])
  customerId  Int
  product     Product   @relation(fields: [productId], references: [id])
  productId   Int
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
  status      String
  premium     Float
  version     Int       @default(1)
  riskFactors Json
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  policy      Policy?
}

model Policy {
  id          Int       @id @default(autoincrement())
  policyNo    String    @unique
  quote       Quote     @relation(fields: [quoteId], references: [id])
  quoteId     Int
  status      String
  startDate   DateTime
  endDate     DateTime
  customer    Customer  @relation(fields: [customerId], references: [id])
  customerId  Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  claims      Claim[]
  invoices    Invoice[]
}

model Claim {
  id          Int       @id @default(autoincrement())
  policy      Policy    @relation(fields: [policyId], references: [id])
  policyId    Int
  status      String
  amount      Float
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  documents   ClaimDocument[]
}

model ClaimDocument {
  id          Int       @id @default(autoincrement())
  claim       Claim     @relation(fields: [claimId], references: [id])
  claimId     Int
  url         String
  type        String
}

model Invoice {
  id          Int       @id @default(autoincrement())
  policy      Policy    @relation(fields: [policyId], references: [id])
  policyId    Int
  amount      Float
  status      String
  dueDate     DateTime
  payments    Payment[]
}

model Payment {
  id          Int       @id @default(autoincrement())
  invoice     Invoice   @relation(fields: [invoiceId], references: [id])
  invoiceId   Int
  amount      Float
  paidAt      DateTime  @default(now())
}

model AuditLog {
  id          Int       @id @default(autoincrement())
  action      String
  entity      String
  entityId    Int
  userId      Int
  createdAt   DateTime  @default(now())
}
```

**Constraints**
- Unique email on `User`.
- Unique policy number on `Policy`.
- Foreign keys for referential integrity between Customer–Quote–Policy–Claim.
- Indexes on `Quote.status`, `Policy.status`, and `Claim.status` for workflow queries.

---

## Step 3 — API contract (REST + sample JSON)
### Auth
- `POST /api/auth/login`
  - **Request:** `{ "email": "admin@ims.com", "password": "pass" }`
  - **Response:** `{ "token": "jwt", "refreshToken": "rjwt", "user": { "id": 1, "role": "ADMIN" } }`

### Customers
- `GET /api/customers?page=1&pageSize=20&search=john`
  - **Response:** `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 100 } }`

### Quotes
- `POST /api/quotes`
  - **Request:** `{ "customerId": 1, "productId": 2, "riskFactors": { "age": 35 } }`
  - **Response:** `{ "id": 10, "premium": 450, "status": "DRAFT" }`

### Policies
- `POST /api/policies`
  - **Request:** `{ "quoteId": 10 }`
  - **Response:** `{ "policyNo": "POL-0010", "status": "ACTIVE" }`

### Claims
- `POST /api/claims`
  - **Request:** `{ "policyId": 5, "amount": 2000, "description": "Accident" }`
  - **Response:** `{ "id": 7, "status": "SUBMITTED" }`

---

## Step 4 — Backend scaffolding (Node.js)
- **Framework**: NestJS + Prisma.
- **Structure**: `src/modules/*` with `auth`, `users`, `customers`, `products`, `quotes`, `policies`, `claims`, `billing`, `audit`.
- **Auth**: JWT + refresh tokens stored in DB.
- **RBAC**: `@Roles()` decorator and guard.
- **Validation**: class-validator DTOs.
- **Swagger**: auto-gen docs at `/docs`.

---

## Step 5 — Frontend scaffolding (Next.js + MUI)
- App Router with `/app` routes.
- Theme provider with light/dark toggle.
- Layout: responsive sidebar + topbar.
- Auth provider + protected routes.
- Data fetching with TanStack Query.

---

## Step 6 — Customers module (end-to-end)
- Backend CRUD endpoints `/api/customers`.
- Frontend with list, create, edit, detail pages using MUI DataGrid.

---

## Step 7 — Products module
- CRUD with fields: name, type, base premium, coverage limits, exclusions, riders, active.
- Validation: base premium > 0, coverage limits required.

---

## Step 8 — Quotes module
- Risk factors (age, location, history).
- Rule engine: base premium × risk multipliers.
- Quote versioning for modifications.

---

## Step 9 — Policies module
- Issue policy from approved quote.
- Status: active/lapsed/cancelled/renewed.

---

## Step 10 — Claims module
- Workflow: submitted → review → approved/rejected → paid.
- Document upload support.

---

## Step 11 — Payments + invoices
- Invoice generation per policy.
- Payments update invoice status.

---

## Step 12 — Audit log + reporting
- Audit log entries for CRUD events.
- Admin audit log page with filters and CSV export.

---

## Step 13 — Security + production readiness
- OWASP checks: input validation, rate limiting, CSRF, CORS, secure headers.
- Secrets management via vault or environment variables.
- Backups and DB migrations.
- Monitoring via logs + metrics (Prometheus/Grafana).
