# ResolveX — Neon Platform Remodel

This version keeps the existing ResolveX complaint workflow and backend API while remodeling the frontend around a dark, premium platform/dashboard visual language inspired by the supplied reference image.

## Main changes
- New dark navy / electric blue / purple / cyan visual system across public, auth, user and admin pages.
- New ResolveX landing page with platform-style dashboard hero visual and responsive layout.
- User dashboard retains the Write a Complaint action and optional image upload workflow.
- Admin dashboard redesigned with operations statistics, resolution pulse and complaint queue.
- Admin navigation contains Dashboard, Complaints and Profile only — no Write a Complaint.
- Admin complaint table redesigned with Assign / Status / Delete controls.
- Assignment and status modals redesigned.
- Profile automatically uses the correct user/admin shell.
- Protected routes added for user/admin areas.
- API uses localhost:5000 automatically during Vite development and supports VITE_API_URL for deployment.
- Backend auth parsing made defensive when req.body is missing.
- Existing 50 MB optional image upload remains supported.

## Local development
Server:
```bash
cd server
npm install
npm run dev
```

Client:
```bash
cd client
npm install
npm run dev
```

The client automatically calls `http://localhost:5000/api` in Vite development mode. For a deployed frontend, set `VITE_API_URL` to the deployed backend API URL.
