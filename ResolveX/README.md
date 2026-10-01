# ResolveX

Report. Track. Resolve. Together.

ResolveX is a complaint management platform with two sides: a member portal for filing
and following an issue, and an admin control centre for routing, resolving and reporting
on the whole desk. This is a full rewrite (v2) built to the dark neon reference design,
with a working light theme behind the toggle.

- **Client** React 18 + Vite, plain CSS design tokens, hand-drawn SVG charts and icons
- **Server** Express + MongoDB (Mongoose), JWT auth, evidence stored in the database

---

## Quick start

```bash
# 1. install
npm install --prefix server
npm install --prefix client

# 2. configure the server
cp server/.env.example server/.env
#    then set MONGO_URI and JWT_SECRET

# 3. seed demo data (optional but recommended)
npm run seed --prefix server

# 4. run both halves in two terminals
npm run dev --prefix server     # http://localhost:5000
npm run dev --prefix client     # http://localhost:5173
```

Vite proxies `/api` to port 5000, so the client needs no env file in development.

### Demo accounts (after seeding)

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| Admin | admin@resolvex.app  | password123 |
| Member| user@resolvex.app   | password123 |

### Server environment

| Key | Required | Notes |
| --- | --- | --- |
| `MONGO_URI` | yes | Local or Atlas connection string |
| `JWT_SECRET` | yes | Any long random string |
| `PORT` | no | Defaults to 5000 |
| `CLIENT_URL` | no | Comma separated origins allowed by CORS |
| `OPENAI_API_KEY` | no | Without it the assistant uses its built-in responder |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |

---

## What each side does

**Member portal**

- Dashboard with live totals, a progress chart, category split and recent activity
- Write a complaint as a four-step flow: details, classification, evidence, review.
  Drafts are kept on the device until submitted.
- My complaints: filter by status, search, open the full history, delete your own
- Profile: details, avatar colour, theme, notification preferences, password
- Customer support: the assistant on one tab, a human support thread on the other

**Admin control centre**

- Command dashboard: stat tiles, 30-day trend, category donut, system status,
  resolution pulse, recent complaints, team presence, activity feed
- Complaints queue with search, status/category/priority filters and pagination.
  Assign up to five people by hand, or auto-assign by expertise and workload.
- AI assistant answering from live desk data
- Users: roles, suspension, deletion (complaints and messages go with the account)
- Analytics: volume, resolution rate, average close time, workload, priority mix
- Reports: pick a range, print it, or export CSV
- Category management: names, descriptions, colours and the keywords that drive routing
- Team and roles: members, expertise, presence, capacity and current load
- System settings: auto-assignment, assistant, registration, maintenance mode, defaults
- Notifications and a searchable audit log of every action
- Help and support: the customer inbox plus a short guide to how the desk works

---

## How routing works

When a complaint is filed, `server/services/routingService.js`:

1. Reads the title and description and scores them against each category's keywords.
   An explicit choice on the form is the starting point, not the last word.
2. Raises priority to High when the wording says something is unsafe, blocked or urgent.
3. Picks members whose expertise matches the category, ranks them by open workload and
   then by presence, and assigns one, two or three people depending on priority.

High priority gets three people, medium two, low one. Turning off **Automatic
assignment** in system settings leaves everything Pending for manual routing.

---

## Project structure

```
ResolveX/
├── server/
│   ├── config/         db connection, shared constants
│   ├── models/         User, Complaint, Message, Category, TeamMember,
│   │                   Notification, AuditLog, Setting
│   ├── middleware/     auth, upload, error handling
│   ├── services/       routing, assistant, statistics
│   ├── controllers/    auth, complaint, admin, analytics, category, team,
│   │                   notification, audit, setting, chat
│   ├── routes/         mounted under /api
│   └── seed.js         demo data
└── client/
    └── src/
        ├── styles/     tokens, shell, components, pages
        ├── lib/        icons, formatting helpers
        ├── services/   axios instance and API wrappers
        ├── context/    auth and theme
        ├── components/ shell, cards, tables, charts, chat, modals
        ├── layouts/    member and admin shells
        └── pages/      member pages and pages/admin
```

---

## API reference

All routes are prefixed with `/api`. Everything except register and login needs
`Authorization: Bearer <token>`.

**Auth** `POST /auth/register` · `POST /auth/login` · `GET /auth/me` ·
`PUT /auth/profile` · `PUT /auth/password`

**Complaints** `GET|POST /complaints` · `GET /complaints/summary` ·
`GET /complaints/categories` · `GET|PUT|DELETE /complaints/:id` ·
`GET /complaints/:id/evidence`

**Notifications** `GET /notifications` · `PUT /notifications/read-all` ·
`PUT /notifications/:id/read` · `DELETE /notifications/:id`

**Chat** `GET|POST|DELETE /chat` · `GET /chat/unread-count` · `POST /chat/ask` ·
`DELETE /chat/:messageId`

**Admin** (admin role only) `GET /admin/overview` · `/analytics` · `/reports` ·
`/health` · `GET /admin/complaints` · `PUT /admin/complaints/:id/assign` ·
`/auto-assign` · `/status` · `DELETE /admin/complaints/:id` ·
`GET|PUT|DELETE /admin/users` · `/categories` · `/team` · `/audit` · `/settings` ·
`/chat/*`

---

## Deploying

**Server** — any Node host (Render, Railway, Fly). Set the environment variables,
run `npm start` in `server/`. Evidence lives in MongoDB, so an ephemeral filesystem
is not a problem.

**Client** — `npm run build` in `client/` and serve `dist/`. Set `VITE_API_URL` to the
deployed API (including `/api`). `vercel.json` already rewrites all routes to
`index.html` for the router.

Add the deployed client origin to `CLIENT_URL` on the server so CORS lets it through.

---

## Notes

- Evidence is capped at 10 MB and must be an image.
- Deleting a user removes their complaints, messages and notifications.
- Every assignment, status change, sign-in and deletion is written to the audit log.
- The assistant never changes a status or an assignment; those stay manual and audited.
