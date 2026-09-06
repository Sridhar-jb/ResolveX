# ResolveX — Deployment-ready Neon Edition

## Project structure

```text
ResolveX/
├── client/   # React + Vite frontend
└── server/   # Express + MongoDB API
```

## Local development

### Backend

```bash
cd server
npm install
npm run dev
```

Create `server/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5174
PORT=5000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Optional `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Railway backend

The repository root also contains a small `package.json` so Railway can detect the project even when the repository is deployed from `/`.

For the backend service, either:

### Recommended monorepo configuration

Set **Root Directory** to:

```text
/server
```

Build Command:

```text
npm install
```

Start Command:

```text
node server.js
```

Environment variables:

```text
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=https://YOUR-FRONTEND-DOMAIN
```

### If Railway root-directory configuration is unavailable

Leave Root Directory empty and use:

```text
Build Command: npm run build
Start Command: node server/server.js
```

The root build command installs the server dependencies.

Railway automatically supplies `PORT`; the server listens on `0.0.0.0`.

## Railway frontend

Create a second service from the same GitHub repository.

Set:

```text
Root Directory: /client
Build Command: npm run build
Start Command: npm start
```

Set:

```text
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

Generate a public domain for the frontend.

Then set the backend `CLIENT_URL` to that exact frontend URL and redeploy the backend.

## Complaint images

Images are optional and limited to 50 MB. They are stored in `server/uploads/`.

Important: Railway service storage is ephemeral. For permanent complaint evidence in production, move uploads to persistent object storage (for example Cloudinary or an S3-compatible service) or attach an appropriate Railway volume.

## Admin

Admin navigation intentionally does **not** include "Write a Complaint". Only normal users see that action.

## Health checks

Backend:

```text
GET /
GET /health
```

Expected:

```json
{"success":true,"status":"ok"}
```

for `/health`.

## New AI features
- ResolveX AI customer support is available from the floating support button.
- The AI endpoint uses the customer's recent complaint history to answer status, priority and support questions.
- Add `OPENAI_API_KEY` in the backend environment to enable the hosted AI provider. If it is not configured, the app automatically uses its built-in ResolveX AI support logic.
- Complaints are automatically classified/routed when submitted. Routing considers category, priority and current workload and assigns up to 3 relevant members.
- Admins can use **AI Assign** to re-run automatic routing from the complaint table.
