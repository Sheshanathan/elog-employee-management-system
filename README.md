# eLog Employee Management System

<p align="center">
  <img src="frontend/public/elog-logo.png" alt="eLog logo" width="180" />
</p>

eLog is a full-stack employee management application for a single organization. It gives administrators a central place to manage employees, departments, designations, attendance, leave, and user accounts, while employees receive a focused self-service dashboard.

> The repository contains application code and fictional/demo data only. Environment files and production credentials must never be committed.

## Features

### Administrator

- Dashboard with employee and department summaries
- Create, view, edit, delete, import, and export employee records
- Manage departments and designations
- Create and manage Admin and Employee user accounts
- Link an Employee login account to an employee record
- View, create, update, and delete attendance records
- Review attendance-correction requests
- Review, approve, reject, cancel, and delete leave requests
- View leave summaries, balances, and department statistics
- Receive in-app notifications

### Employee

- Personal dashboard and profile
- Check in and check out
- View personal attendance history
- Submit working-day information and attendance corrections
- Apply for, review, and cancel leave requests
- View leave balances and request status
- Receive in-app notifications
- Reset a forgotten password by email

## Access Model

The application intentionally has no public registration page.

- An Admin creates employee records and login accounts.
- An Employee can access only employee self-service functionality.
- Frontend route guards improve navigation, while backend authentication and role middleware enforce the actual permissions.

A new, empty database requires a controlled one-time process to create the first Admin. Do not add an unrestricted public Admin-registration endpoint.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens and bcrypt password hashing |
| Email | Nodemailer |
| API documentation | Swagger UI in non-production environments |
| Deployment | Vercel frontend and Render backend |

## Project Structure

```text
employee-management-system/
├── backend/
│   ├── config/          # Database, email, and Swagger configuration
│   ├── controllers/     # API business logic
│   ├── middleware/      # Authentication, authorization, and validation
│   ├── models/          # Mongoose models
│   ├── routes/          # Express API routes
│   ├── utils/           # Shared helpers and migrations
│   └── server.js        # Backend entry point
├── frontend/
│   ├── public/          # Public brand assets
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Authentication context
│   │   ├── pages/       # Admin and Employee pages
│   │   ├── styles/      # Application styles
│   │   └── utils/       # Frontend helpers
│   └── vercel.json      # SPA routing configuration
└── README.md
```

## Local Setup

### Prerequisites

- Node.js `22.12.0` or newer in the Node 22 release line
- npm
- A MongoDB database
- An email account or provider for password-reset messages

### 1. Clone the repository

```bash
git clone <repository-url>
cd employee-management-system
```

### 2. Configure and start the backend

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Configure `backend/.env` before starting:

| Variable | Purpose |
| --- | --- |
| `PORT` | Local backend port, normally `3000` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong random JWT signing secret |
| `EMAIL_USER` | Sender address verified in Brevo |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `FRONTEND_URL` | Exact frontend origin, without a trailing slash |

Generate a strong local JWT secret with:

```bash
openssl rand -hex 48
```

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

The frontend environment contains:

```env
VITE_API_URL=http://localhost:3000
```

Vite normally serves the frontend at `http://localhost:5173`.

### 4. Sign in

Use an existing Admin account from the configured database. After signing in, the Admin can create employee records and their associated Employee login accounts.

## Available Commands

### Backend

```bash
npm start     # Start the production server
npm run dev   # Start the local server
```

### Frontend

```bash
npm run dev      # Start Vite development mode
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

## Production Deployment

### Backend on Render

Create a Node Web Service with:

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
```

Configure these environment variables in Render, never in Git:

```text
NODE_ENV=production
NODE_VERSION=22.23.2
MONGODB_URI=<production MongoDB connection>
JWT_SECRET=<strong random secret>
EMAIL_USER=<sender email>
BREVO_API_KEY=<Brevo transactional email API key>
FRONTEND_URL=https://your-frontend-domain.example
```

Render supplies `PORT`, so it does not need to be configured manually.

### Frontend on Vercel

Import the same repository and configure:

```text
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Add the production backend address:

```text
VITE_API_URL=https://your-backend-domain.example
```

Redeploy the frontend after changing `VITE_API_URL`. Ensure the backend `FRONTEND_URL` exactly matches the final Vercel origin.

## Security Notes

- Never commit `.env` files, database URLs, JWT secrets, or email credentials.
- Use fictional data for public demonstrations.
- Keep production databases separate from demo and development databases.
- Use a strong, unique MongoDB password and restrict database network access.
- Use a verified Brevo sender and keep the Brevo API key only in the backend environment.
- Keep the public repository free of uploaded employee documents and personal files.
- API documentation is disabled when `NODE_ENV=production`.

## Current Scope

This application is designed as a single-organization employee management system. It is suitable for a portfolio demonstration or a controlled internal deployment. A public multi-company SaaS version would additionally require organization-level data isolation, company onboarding, invitations, expanded security controls, monitoring, backups, and billing.
