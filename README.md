# دليل — Dalil Business Directory

A full-stack business directory platform (in Arabic). Visitors can browse and search businesses, shop owners and an administrator can manage content. Built with **Node.js + Express + MongoDB** (backend) and **React + Vite** (frontend).

## Features

**Visitor side** (`http://localhost:5173`)
- Home page with hero search, featured shops, latest shops, and a category grid.
- Live search (`/search`), category browsing, and shop details pages with gallery, open/closed status, working hours, phone, and WhatsApp contact.
- "Open now" and top-viewed filters.

**Manager side** (`/manager`)
- Login, update profile, change password, manage shop info (description, phone, images), working hours, and weekly stats.
- Uploaded images use Cloudinary when `CLOUDINARY_URL` is configured; otherwise uploads are gracefully disabled with a clear message.

**Admin panel** (`/admin`)
- Dashboard with stats and top shops.
- Full CRUD for categories, shops, and managers. Managers are soft-deleted (disabled) rather than removed.
- Analytics overview (views today/week/month, trend, top shops).

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS      |
| Backend  | Node.js, Express, Mongoose, JWT (httpOnly cookie) |
| Database | MongoDB (local `mongodb://localhost:27017/dalil`) |
| Assets   | Cloudinary (optional)                             |

## Project Structure

```
dalil/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── contexts/       # AuthContext (admin/manager)
│   │   ├── hooks/          # usePageMeta, useRoleGuard, useVisitor
│   │   ├── pages/          # visitor/, admin/, manager/ pages
│   │   ├── services/       # API clients + auth helpers
│   │   └── main.jsx        # App entry, routes
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB, CORS, Cloudinary, passport
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose models
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Slugify, seeding helpers
│   ├── tests/              # Mocha + supertest API tests (node:assert)
│   └── src/scripts/        # Seed scripts (admin, categories, shops)
└── README.md
```

## Getting Started

Prerequisites: Node.js 18+, MongoDB running locally.

### 1. Backend

```bash
cd server
npm install
copy .env.example .env     # fill in values (see .env.example)
npm run seed               # seeds admin, manager, categories, shops
npm run dev                # starts on http://localhost:5000
```

`server/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/dalil
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_URL=http://localhost:5173
# Seed admin account (npm run seed:admin fails without ADMIN_PASSWORD)
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
# Optional — image uploads:
# CLOUDINARY_URL=cloudinary://...
```

### 2. Frontend

```bash
cd client
npm install
copy .env.example .env     # optional: set VITE_BASE_API if API is elsewhere
npm run dev                # starts on http://localhost:5173
```

### 3. Log in

| Role | Email               | Password    |
|------|---------------------|-------------|
| Admin | admin@example.com  | Admin@12345 |
| Manager | manager@tayeb.com | Manager@123 |

## Tests

The backend ships an automated API integration suite (`server/tests/api.test.js`). It runs
against a throwaway MongoDB database (`dalil_test`) and requires MongoDB running locally:

```bash
cd server
npm test            # all tests; override DB with TEST_MONGO_URI if needed
```

The suite covers: public catalog (categories, shops, open-now filter, inactive-shop 404s),
auth (role-scoped login, httpOnly cookies, `/me`), the admin panel (CRUD, slug dedup,
one-active-manager-per-shop, category-delete protection), the manager dashboard
(scoped updates that can never rename/restatus a shop, working-hours validation, image
management, analytics), password change, and analytics event recording.

Manual smoke checks below (with MongoDB running and both servers started):

```bash
# Public API + security checks
curl http://localhost:5000/api/categories
curl "http://localhost:5000/api/shops?openNow=true"
curl http://localhost:5000/api/shops/al-tayeb-restaurant
# Inactive shops must 404 publicly
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/shops/<inactive-slug>   # 404
# CORS must reject foreign origins (expected: "Not allowed by CORS")
curl -s -X OPTIONS http://localhost:5000/api/shops -H "Origin: http://evil.example.com" -H "Access-Control-Request-Method: GET"
# Manager must NOT be able to rename/restatus their shop
curl -s -c /tmp/c.txt -X POST http://localhost:5000/api/auth/manager/login -H "Content-Type: application/json" -d '{"email":"manager@tayeb.com","password":"Manager@123"}'
curl -s -b /tmp/c.txt -X PATCH http://localhost:5000/api/manager/shop -H "Content-Type: application/json" -d '{"name":"HACKED","status":"inactive","phone":"+20 555 000 1111"}'
# name/status unchanged, phone updated
```

Frontend: `cd client && npm run build` must succeed, then open
`http://localhost:5173` and walk the visitor → manager → admin flows.

## Production Build

```bash
cd client && npm run build    # outputs to client/dist
cd server && npm start        # serve API (set NODE_ENV=production and serve client/dist via server if desired)
```

## API Overview

Public routes: `GET /api/shops`, `GET /api/shops/:slug`, `GET /api/categories`, `POST /api/analytics/view`, `POST /api/analytics/click`, search and open-now filters.
Auth routes: `POST /api/auth/{admin|manager}/login`, `POST /api/auth/logout`, `PATCH /api/auth/change-password`, `GET /api/auth/me`.
Admin routes (`/api/admin/*`): categories, shops, managers, reviews, visitors, dashboard — all require the admin cookie.
Manager routes (`/api/manager/*`): shop info, working hours, stats, image upload — require the manager cookie. Managers can never change the shop's name, category, or status.

## Security Notes

- JWT is stored in an **httpOnly, SameSite=Lax cookie**, never in localStorage/JS.
- CORS is locked to `CLIENT_URL` and denies other origins.
- Passwords are bcrypt-hashed; authentication sessions are role-scoped (admin vs manager).
- Only the admin can create/edit categories and managers; only the admin can change shop status/name/category.
