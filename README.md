# PulseBoard

**A real-time incident management and reliability platform** — a lightweight combination of PagerDuty, Datadog, and Linear, built to demonstrate full-stack system design, backend engineering, and real-time frontend architecture.
---

## Overview

Teams register the services they run. A background worker continuously monitors each one's health, and after repeated failures, PulseBoard automatically opens an incident — no human has to notice the outage first. From there, engineers acknowledge, investigate, assign, comment, and resolve the incident through a validated status lifecycle, with every action recorded in a full audit timeline and broadcast live to the whole team via WebSockets.

## Screenshots

> _Add screenshots here once the UI is polished — e.g._
> `![Dashboard](docs/screenshots/dashboard.png)`
> `![Incident Detail](docs/screenshots/incident-detail.png)`

## Key Features

- **JWT authentication** with organization-scoped **role-based access control** (Admin / Engineer / Viewer)
- **Service health monitoring** via an async, concurrent background worker
- **Automatic incident creation** after consecutive health-check failures, with duplicate prevention
- **Validated incident state machine**: `triggered → acknowledged → investigating → mitigated/resolved`, rejecting invalid transitions
- **Append-only audit trail** — every status change, assignment, and comment is recorded with a timestamp and actor
- **Real-time updates** via authenticated, organization-scoped WebSocket broadcasts
- **Optimistic UI updates** (RTK Query) with automatic rollback on server rejection
- **Idempotent APIs** and **Redis-backed rate limiting** for reliability under retries and load

## Architecture

```
React (RTK Query + WebSocket client)
        │
        ├─ HTTPS ──► FastAPI (REST API: auth, RBAC, CRUD)
        │                    │
        │                    ├─► PostgreSQL (all persistent data)
        │                    │
        │                    └─► APScheduler (background health-check worker)
        │
        └─ WebSocket ──► FastAPI (per-organization broadcast on incident/service events)
```

## Tech Stack

**Backend**: FastAPI · PostgreSQL · SQLModel/SQLAlchemy · Alembic · APScheduler · Redis · JWT · WebSockets

**Frontend**: React · TypeScript · Redux Toolkit · RTK Query · React Router · React Hook Form · Tailwind CSS

## Repository Structure

```
pulseboard/
├── backend/     # FastAPI application, database models, migrations
└── frontend/    # React + TypeScript single-page application
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+
- Redis

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (see `.env.example`):
```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/pulseboard
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(32))">
```

Set up the database:
```bash
sudo -u postgres psql -c "CREATE DATABASE pulseboard;"
sudo -u postgres psql -c "CREATE USER pulseboard_user WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pulseboard TO pulseboard_user;"
sudo -u postgres psql -d pulseboard -c "GRANT ALL PRIVILEGES ON SCHEMA public TO pulseboard_user;"
```

Run migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

Make sure Redis is running locally (`sudo systemctl start redis-server`) — it's used for idempotency keys and rate limiting.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (Vite's default port).

---

## Core Concepts

### Roles & Permissions

| Action                            | Admin | Engineer | Viewer |
|-----------------------------------|-------|----------|--------|
| View services/incidents           |   ✅  |    ✅    |   ✅   |
| Create/update service             |   ✅  |    ✅    |   ❌   |
| Delete service                    |   ✅  |    ❌    |   ❌   |
| Create/transition/assign incident |   ✅  |    ✅    |   ❌   |
| Comment on incident               |   ✅  |    ✅    |   ✅   |
| Add organization member           |   ✅  |    ❌    |   ❌   |

### Incident State Machine

```
triggered → acknowledged → investigating → mitigated → resolved
                                    └──────────────────┘
                              (investigating can skip straight to resolved)
```
`resolved` is terminal — no further transitions are permitted.

### Real-Time Events

WebSocket clients connect to `ws://localhost:8000/ws/organizations/{organization_id}?token={jwt}` and receive live JSON messages for incident and service events (`incident.created`, `incident.status_changed`, `incident.assigned`, `incident.comment_added`, `service.health_check`, `service.status_changed`).

---

## Known Limitations / Roadmap

- WebSocket broadcasting is in-memory and single-instance — would need Redis pub/sub to scale across multiple backend replicas
- Health checks run on a single global interval rather than respecting each service's individually configured interval
- Auto-created incidents don't auto-resolve when the service recovers — must be resolved manually
- No automated test suite yet
- No CI/CD pipeline or containerization (Docker) yet

## License

This is a personal portfolio project.
