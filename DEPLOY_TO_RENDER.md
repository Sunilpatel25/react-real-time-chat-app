React Real-Time Chat App — Deploy to Render

This document explains how to deploy the updated React + Vite frontend and Node/Express backend of the Real-Time Chat App to Render (https://render.com). It also highlights the important changes included in this release (mobile/safe-area fixes, Activity Log performance improvements, and admin features) and quick post-deploy checks.

Summary of key user-facing changes (what you'll see live)

- Mobile & safe-area improvements
  - Body scrolling enabled on mobile and `#root` no longer uses fixed positioning. The app respects device safe-area insets using the `safe-top` and `safe-bottom` helper classes. This removes input/keyboard overlap on modern iOS/Android devices.
  - Inputs now target 16px font-size to prevent iOS zoom-on-focus and have improved touch targets.

- Chat UX & performance
  - Activity Log now uses an optimized infinite-scroll / debounced search approach — initial render size reduced to improve Interaction to Next Paint (INP).
  - Message sending uses optimistic UI and Socket.IO acknowledgements; read receipts and edits are emitted via sockets and persisted through the backend.

- Admin features
  - Admin dashboard is lazily loaded (React.lazy + Suspense) to reduce initial bundle size for normal users.
  - Admin actions (edit/delete/flag) use Socket.IO events and are tracked in the Message model with audit fields.

Render deployment (recommended setup)

We recommend deploying the backend as a separate Web Service and the frontend as a Static Site or separate Web Service. The app expects the backend to run on an HTTP endpoint that the frontend and Socket.IO client can reach.

Backend (Node.js + Express)
- Type: Web Service
- Environment: Node 18+ (use same or compatible Node version as local dev)
- Build & Start commands (example):
  - Build: none (server code is JS). If you use transpilation, add your build step here.
  - Start: node backend/server.js
- Instance settings: Choose a small instance for testing (e.g., free/cheaper tier); increase for production.
- Environment variables (add in Render dashboard):
  - MONGO_URI (required)
  - JWT_SECRET (required)
  - PORT (optional; default 8900)

Frontend (React + Vite)
- Option 1 (Static site): build on Render and serve `dist/` via Render static site
  - Build Command: npm install && npm run build
  - Publish Directory: dist
  - Add environment variable(s) for build if needed (e.g., VITE_PROD_BACKEND_URL)
- Option 2 (Web Service): run Vite in production or serve a static build via a small server
  - Build as above and serve using a lightweight static server if preferred.

Socket.IO considerations
- Socket.IO client is loaded from a CDN in `index.html` and expects the `SOCKET_URL` configured in `src/config.ts` or via environment variables.
- If deploying backend under a custom domain, ensure `SOCKET_URL` points to the correct origin (wss/http) and allow CORS in `backend/server.js`.

Environment variables to configure in Render
- FRONTEND
  - VITE_PROD_BACKEND_URL (optional) — set to your backend public URL so the frontend can call REST APIs and Socket.IO.
- BACKEND
  - MONGO_URI — MongoDB Atlas connection string (required)
  - JWT_SECRET — JWT signing secret (required)
  - PORT — optional

Post-deploy smoke checks
- Visit the frontend URL and verify the app loads without console errors.
- Login with a test user. Confirm messages send and are delivered in real time. Open the console to ensure socket connection successful.
- On a mobile device (or responsive devtools):
  - Ensure the app scrolls normally.
  - Tap an input — no unexpected zoom should occur (input font-size set to 16px).
  - Open a chat and type: typing indicator should show on the other client.
- Admin flow: Log in as an admin user and open the admin dashboard. Confirm lazy loading spinner appears and admin actions (edit/delete/flag) broadcast events.

Quick Rollback
- Render keeps previous deployments. If you discover a problem, you can rollback to the previous deploy from the Render dashboard in a few clicks.

Changelog (what changed in this release)
- Global CSS: allowed mobile body scrolling; added safe-area helpers `safe-top` and `safe-bottom` (see `index.html`).
- `src/components/admin/ActivityLogComponent.tsx`: infinite scroll + debounced search; memoized list items.
- `src/hooks/useDebounce.ts`: new reusable hook used by Activity Log.
- `src/App.tsx`: added safe-area wrapper and fixed runtime issues; socket connection improvements.
- `src/components/chat/ChatWindow.tsx` (planned): input & safe-area changes to be applied (follow-up commit will complete sticky behaviors).

Notes & troubleshooting
- If Socket.IO fails to connect: check `SOCKET_URL` in `src/config.ts` and backend CORS/socket settings.
- If admin features show 401: ensure the user in MongoDB has `role: 'admin'`.
- If you see "Unexpected token '<'" on API calls: ensure your frontend is calling the correct backend endpoint and that the backend returns JSON for API endpoints.

Contact
- If you need me to push the final ChatWindow sticky input fix and Sidebar overlay for mobile, reply and I'll implement and create a new patch and redeploy steps.

---
Generated: October 8, 2025
