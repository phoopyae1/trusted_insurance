# Trusted Insurance - Frontend

Frontend application for Trusted Insurance built with Next.js 14, React, and Material-UI.

## Features

- Next.js 14 with App Router
- Material-UI (MUI) components
- TypeScript
- React Query for data fetching
- React Hook Form with Zod validation
- Responsive design

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Running the Application

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## Docker

Run with Docker Compose:
```bash
docker-compose up
```

Make sure to set `NEXT_PUBLIC_API_URL` to your backend API URL (e.g., `http://localhost:4000` or your deployed backend URL).

## Pages

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/products` - Browse insurance products
- `/quotes` - Manage insurance quotes
- `/claims` - Submit and view claims
- `/admin` - Admin panel
- `/staff` - Staff panel

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (required)

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── (auth)/      # Auth routes
│   ├── admin/       # Admin pages
│   ├── claims/      # Claims pages
│   ├── dashboard/   # Dashboard
│   ├── products/    # Products pages
│   └── quotes/      # Quotes pages
├── components/       # React components
├── lib/             # Utilities and theme
└── public/          # Static assets

```
