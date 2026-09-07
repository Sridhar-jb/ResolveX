# ResolveX — 3D + AI Customer Support Upgrade

This build keeps the existing ResolveX complaint-management backend and AI support services while adding a full visual 3D layer.

## Included
- Animated canvas particle field on home/auth/dashboard/admin pages
- CSS 3D floating R/X cubes with depth, rotation and glow
- Mouse-following parallax across the 3D environment
- Floating Pending / In Progress / Resolved status cards on the home hero
- 3D glass/tilt interactions for dashboard cards
- Animated 3D Resolution Map on the user dashboard
- 3D AI support orb and dedicated `/support` page
- Customer Support choice cards: track, submit, status help, team support
- Existing AI complaint-aware assistant retained
- Existing human Team Support chat retained
- Existing optional complaint image upload retained (JPG/PNG/WEBP, 50 MB)
- Animated upload preview/remove flow
- Admin dashboard/table/modal workflow retained
- Responsive mobile layout and reduced-motion support

## Run
### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

Set the required server environment variables from `server/.env.example`. The AI service can fall back to the built-in ResolveX support responses when no external AI key is configured.

## Main 3D files
- `client/src/components/ThreeDScene.jsx`
- `client/src/pages/Support.jsx`
- 3D styles appended to `client/src/index.css`
