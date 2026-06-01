# Osarthi — EdTech Platform

A full-stack education platform with separate **React (Vite + Tailwind)** frontend and **Node.js (Express + MongoDB)** backend.

## Features

- **Role-based auth**: Student or Teacher onboarding, email/password + Google OAuth ready
- **Security**: bcrypt password hashing, short-lived JWT access tokens, httpOnly refresh cookies, token refresh interceptor
- **Teachers**: Create classes/subjects/topics (with duplicate handling), Medium-style content blocks, text highlighting (bold, colors, background), image/video upload
- **Students**: Read content with preserved highlights, live quiz notifications, timed quizzes (one attempt), detailed results & history by subject
- **Quizzes**: Google Forms-like builder, publish with notifications, expiry & time limits
- **Marketing pages**: Landing, About, Contact with responsive premium UI

## Prerequisites

- Node.js 18+
- MongoDB running locally (or update `MONGODB_URI` in `backend/.env`)

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env   # if .env doesn't exist
npm install
npm run dev
```

API runs at `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` (proxies `/api` and `/uploads` to backend)

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access token secret (32+ chars in production) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLIENT_URL` | Frontend URL for CORS & OAuth redirects |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |

## Project structure

```
osarthi/
├── backend/          # Express API
│   └── src/
│       ├── models/
│       ├── routes/
│       └── middleware/
└── frontend/         # React SPA
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## Typical flow

1. New user → **Get Started** → choose Student or Teacher → register
2. Logged-in user → redirected to `/teacher` or `/student`
3. Teacher selects taxonomy → writes content / builds quiz → publishes
4. Student gets notification → reads content → takes quiz at bottom → sees results

## Media storage (Cloudinary)

By default, if Cloudinary credentials are missing, files save to `backend/uploads/` (local disk).

Add to `backend/.env` (from [Cloudinary Console](https://console.cloudinary.com/)):

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=osarthi
CLOUDINARY_ENABLED=true
```

Uploads return a public `https://res.cloudinary.com/...` URL stored in lesson content.

On startup, the API logs `Media storage: cloudinary` or `local`.

## Production notes

- Change JWT secrets and use HTTPS
- Set `NODE_ENV=production` and `secure: true` on cookies
- Use Cloudinary for production media (see above)
- Configure Google OAuth callback URL for your domain
