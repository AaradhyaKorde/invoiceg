# InvoiceG

This project is now split into:

- `frontend`: Next.js UI app
- `backend`: Express + MongoDB API

## Setup

1. Install root tools:
   - `npm install`
2. Install app dependencies:
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
3. Create env files:
   - Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`
   - Copy `frontend/.env.example` to `frontend/.env.local`

## Run

- Start both apps together:
  - `npm run dev`
- Or run separately:
  - `npm run dev:backend`
  - `npm run dev:frontend`

## URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Backend health: `http://localhost:4000/health`