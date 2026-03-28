# MindConnect

MindConnect is a full-stack wellness and productivity app with:
- React + Vite frontend
- Express + PostgreSQL backend
- JWT authentication
- Tasks, goals, bookings, notifications, wellness checks, resources, and profile management

## Project structure
- `frontend/` - React SPA (Vite + TypeScript + Tailwind)
- `backend/` - Express API + PostgreSQL integration

## Current status
- Data is persisted in PostgreSQL.
- Tables are auto-created on backend startup.
- Seed users are auto-created if missing:
  - `demo@mindconnect.africa` / `demo1234`
  - `admin@mindconnect.africa` / `admin1234`
- Email verification and password reset are currently feature-flagged off by default.

## Prerequisites
- Node.js 18+
- npm
- PostgreSQL 14+ (local or managed)

## Local development
1. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

2. Update `backend/.env` (important values)
```env
PORT=4000
JWT_SECRET=change-me

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=root
PGDATABASE=mind-connect

BACKEND_PUBLIC_URL=http://localhost:4000
APP_BASE_URL=http://localhost:5173

ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=false

EMAIL_FROM=MindConnect <no-reply@mindconnect.local>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
```

3. Start backend
```bash
npm run dev
```
Backend runs at `http://localhost:4000`.

4. Frontend setup (new terminal)
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` and proxies `/api` to backend in dev.

## Feature flags
Set in `backend/.env`:
- `ENABLE_EMAIL_VERIFICATION=true|false`
- `ENABLE_PASSWORD_RESET=true|false`

When disabled:
- Registration signs user in immediately.
- Verification and reset endpoints return a temporary disabled message.
- Frontend hides resend verification and forgot/reset password UI.

## Email behavior
- SMTP must be configured for real email delivery.
- If SMTP is not configured, backend uses a local JSON transport preview (no real inbox delivery).

## Deployment (recommended)
Use two services:
- Backend on Render/Railway/Fly.io
- Frontend on Vercel/Netlify

### Backend deployment
- Set service root to `backend/`
- Build command: `npm install`
- Start command: `npm start`
- Configure all backend env vars (`JWT_SECRET`, `PG*`, URLs, feature flags, SMTP if needed)

### Frontend deployment
- Set service root to `frontend/`
- Build command: `npm run build`
- Publish directory: `dist`
- Add rewrite so `/api/*` goes to backend:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://YOUR_BACKEND_DOMAIN/api/$1" }
  ]
}
```

## Scripts
### Backend
- `npm run dev` - run backend with nodemon
- `npm start` - run backend in production mode

### Frontend
- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build locally

## Notes
- This repository currently does not include automated tests.
- Keep `JWT_SECRET` and SMTP credentials private in deployment.
- For production, prefer managed PostgreSQL instead of a personal local machine database.
