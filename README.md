# VZNX Workspace Prototype

A compact full-stack prototype that showcases how architecture studios can manage projects, tasks, and team capacity in a single workspace. The frontend is built with React + Vite, and a lightweight Express + Mongoose API persists data in MongoDB.

## Features
- Project dashboard with status pills, progress sliders, and studio metadata.
- In-project task list with completion toggles, assignee filtering, and auto progress syncing.
- Team overview that surfaces individual capacity and workload colour cues.
- Demo fallback that keeps the UI usable when the API/DB are unavailable.

## Prerequisites
- Node.js 18+
- A MongoDB connection string stored in `.env` as `MONGODB_URL` (or `MONGODB_URI`).

Example `.env`:

```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/vznx
# Optional: override the frontend API target (defaults to /api with a dev proxy)
# VITE_API_BASE_URL=http://localhost:4000/api
```

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the API (seeds the workspace if empty)
   ```bash
   npm run server
   ```
3. In a new terminal run the client
   ```bash
   npm run dev
   ```
4. Open the Vite URL (usually http://localhost:5173). The dev server proxies `/api` calls to http://localhost:4000.

## API Overview

The Express server exposes a minimal REST surface under `/api`:

- `GET /api/workspace` – fetch projects, tasks, team members in one round trip.
- `POST /api/projects` – create a project.
- `PATCH /api/projects/:projectId` – update status, progress, metadata.
- `DELETE /api/projects/:projectId` – remove a project and its tasks.
- `POST /api/tasks` – create a task (auto-updates parent progress).
- `PATCH /api/tasks/:taskId` – toggle completion or edit task fields.
- `DELETE /api/tasks/:taskId` – remove a task and resync progress.

When the API cannot be reached, the UI transparently switches to a local demo dataset so the flows remain interactive.
