# elog Employee Management System

<p align="center">
  <img src="frontend/public/elog-logo.png" alt="elog logo" width="180" />
</p>

elog is a full-stack employee management application for a single organization. It gives administrators a central place to manage employees, departments, designations, attendance, leave, and user accounts, while employees receive a focused self-service dashboard.

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
| Email | Brevo Transactional Email API over HTTPS |
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
- A Brevo account and verified sender for password-reset messages

### 1. Clone the repository

```bash
git clone https://github.com/Sheshanathan/elog-employee-management-system.git
cd elog-employee-management-system
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

The production stack uses MongoDB Atlas, Render, Vercel, and Brevo. Keep all
passwords, database URLs, JWT secrets, and API keys in the hosting providers'
environment settings, never in Git.

### 1. MongoDB Atlas

1. Create an Atlas cluster and restore the `employeeDB` database.
2. Create a dedicated application database user with only the `readWrite` role
   on `employeeDB`. Do not use an Atlas administrator account in the deployed
   application.
3. After creating the Render service, copy every range from
   **Render → Connect → Outbound** into the Atlas IP Access List.
4. Keep the temporary migration user only until the deployed application has
   been verified, then remove it.

### 2. Backend on Render

Create a Node Web Service with:

```text
Branch: main
Root Directory: leave blank
Build Command: npm --prefix backend ci
Start Command: npm --prefix backend start
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

`EMAIL_USER` must exactly match a verified Brevo sender. Use a standard Brevo
API key, not an SMTP key or MCP key. Render supplies `PORT`, so it does not need
to be configured manually.

For the initial backend deployment, `FRONTEND_URL` can temporarily be
`https://example.com`. Replace it with the final Vercel production origin as
soon as the frontend is deployed.

Render Free blocks outbound SMTP ports. This project therefore sends email
through Brevo's HTTPS API instead of Gmail SMTP.

### 3. Brevo transactional email

1. Add and verify the sender address used for `EMAIL_USER`.
2. Open **Settings → SMTP & API → API Keys & MCP** and generate a standard API
   key. Do not enable the MCP-key option.
3. Store the key only as `BREVO_API_KEY` in Render.
4. If Brevo API IP restrictions are enabled, authorize every Render outbound IP
   range.
5. A free-mail sender such as Gmail can be used for a portfolio demo, but a
   custom authenticated domain is recommended for production deliverability.

### 4. Frontend on Vercel

Import the same repository and configure:

```text
Root Directory: frontend
Framework: Vite
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

Add the production backend address:

```text
VITE_API_URL=https://your-backend-domain.example
```

`VITE_API_URL` is intentionally public and should be saved as a Vercel Config
value. It must contain only the public Render URL, without a trailing slash.
Redeploy the frontend after adding or changing it because Vite embeds the value
during the build.

### 5. Connect and verify production

1. Replace Render's temporary `FRONTEND_URL` with the exact Vercel production
   origin, without a trailing slash, and redeploy the backend.
2. Open the Render URL and confirm the API welcome response appears.
3. Open the Vercel application and test Admin and Employee login flows.
4. Request a new password-reset email, open the newest link within 15 minutes,
   set a new password, and sign in with it.
5. Free Render services can sleep when idle, so the first request after a period
   of inactivity may take longer.

### 6. Post-deployment cleanup

- Remove the temporary MongoDB migration user after the application user works.
- Delete superseded Brevo API keys and retain only the active production key.
- Remove the old `EMAIL_PASS` variable from Render; this project no longer uses
  Gmail SMTP.
- Retain the database archive privately as a backup or remove it securely when
  it is no longer required.

## Security Notes

- Never commit `.env` files, database URLs, JWT secrets, or email credentials.
- Use fictional data for public demonstrations.
- Keep production databases separate from demo and development databases.
- Use a strong, unique MongoDB password and restrict database network access.
- Use a verified Brevo sender and keep the Brevo API key only in the backend environment.
- Treat `VITE_API_URL` as public configuration; never put secrets in variables prefixed with `VITE_`.
- Keep the public repository free of uploaded employee documents and personal files.
- API documentation is disabled when `NODE_ENV=production`.

## Current Scope

This application is designed as a single-organization employee management system. It is suitable for a portfolio demonstration or a controlled internal deployment. A public multi-company SaaS version would additionally require organization-level data isolation, company onboarding, invitations, expanded security controls, monitoring, backups, and billing.
