# PulseBoard — Complete Frontend Requirements

Everything the backend exposes, consolidated into one spec you can hand to an AI coding assistant (or use yourself) to build the full React frontend in one pass.

---

## 1. Tech Stack

- React + TypeScript (Vite)
- Redux Toolkit + RTK Query (server state + client state)
- React Router v6+
- React Hook Form (forms/validation)
- Tailwind CSS v4 (`@tailwindcss/vite` plugin, no config file)
- Recharts (uptime/latency charts)
- Native WebSocket API (real-time updates)

Base API URL: `http://localhost:8000`
WebSocket URL: `ws://localhost:8000/ws/organizations/{organization_id}?token={jwt}`

---

## 2. Auth

All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <jwt>
```

### `POST /auth/register`
Request:
```json
{ "email": "string", "password": "string", "full_name": "string" }
```
Response `200`:
```json
{ "id": "uuid", "email": "string", "full_name": "string" }
```
Response `400`: email already registered.

### `POST /auth/login`
**Form-encoded, not JSON** (`application/x-www-form-urlencoded`):
```
username=<email>&password=<password>
```
Response `200`:
```json
{ "access_token": "string", "token_type": "bearer" }
```
Response `401`: incorrect credentials.

### `GET /auth/me`
Response `200`:
```json
{ "id": "uuid", "email": "string", "full_name": "string" }
```
Response `401`: invalid/missing/expired token.

---

## 3. Organizations

### `POST /organizations`
Creates an org; creator is automatically made `admin`.
Request:
```json
{ "name": "string", "slug": "string" }
```
Response `200`:
```json
{ "id": "uuid", "name": "string", "slug": "string" }
```

### `GET /organizations/{organization_id}/members`
Any role can view. Response `200`:
```json
[
  { "user_id": "uuid", "email": "string", "full_name": "string", "role": "admin" | "engineer" | "viewer" }
]
```
Response `403`: not a member of this org.

### `POST /organizations/{organization_id}/members`
**Admin only.** Adds an already-registered user.
Request:
```json
{ "email": "string", "role": "admin" | "engineer" | "viewer" }
```
Response `200`: same shape as a single member above.
Response `404`: no user with that email is registered.
Response `400`: already a member.
Response `403`: caller isn't an admin of this org.

---

## 4. Services

Base path: `/organizations/{organization_id}/services`

### `POST /` — **admin or engineer**
Request:
```json
{
  "name": "string",
  "url": "string",
  "environment": "string (default: production)",
  "health_check_interval": "number (default: 60)",
  "timeout_ms": "number (default: 5000)"
}
```
Response `200`: full `Service` object (see shape below).
Response `400`: a service with that name already exists in this org.

### `GET /` — **any role**
Response `200`: array of `Service` objects.

### `GET /{service_id}` — **any role**
Response `200`: single `Service` object.
Response `404`: not found (or belongs to a different org).

### `PATCH /{service_id}` — **admin or engineer**
Partial update — send only the fields you want to change.
Request (all optional):
```json
{
  "name": "string",
  "url": "string",
  "environment": "string",
  "health_check_interval": "number",
  "timeout_ms": "number",
  "owner_id": "uuid"
}
```
Response `200`: updated `Service` object.

### `DELETE /{service_id}` — **admin only**
Response `204`: no content.
Response `403`: caller isn't an admin.

### `Service` object shape:
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "name": "string",
  "url": "string",
  "environment": "string",
  "owner_id": "uuid | null",
  "health_check_interval": "number",
  "timeout_ms": "number",
  "current_status": "healthy" | "degraded" | "down" | "unknown"
}
```

---

## 5. Incidents

Base path: `/organizations/{organization_id}/incidents`

### `POST /` — **admin or engineer**
Request:
```json
{
  "service_id": "uuid",
  "title": "string",
  "description": "string | null (optional)",
  "severity": "sev1" | "sev2" | "sev3" | "sev4" (default: sev3)
}
```
Response `200`: `Incident` object (status starts as `"triggered"`).

### `GET /` — **any role**
Response `200`: array of `Incident` objects (lightweight — no events/comments).

### `GET /{incident_id}` — **any role**
Response `200`: `IncidentDetail` object — includes full `events` timeline and `comments`.
Response `404`: not found.

### `PATCH /{incident_id}/status` — **admin or engineer**
Request:
```json
{ "status": "triggered" | "acknowledged" | "investigating" | "mitigated" | "resolved" }
```
Response `200`: updated `Incident` object.
Response `400`: invalid transition — **the frontend must handle this gracefully** (e.g. toast/error message), since the state machine only allows specific transitions:
```
triggered      → acknowledged
acknowledged   → investigating
investigating  → mitigated | resolved
mitigated      → resolved
resolved       → (terminal — no further transitions)
```

### `PATCH /{incident_id}/assign` — **admin or engineer**
Request:
```json
{ "assignee_id": "uuid" }
```
Response `200`: updated `Incident` object.

### `POST /{incident_id}/comments` — **any role**
Request:
```json
{ "body": "string" }
```
Response `200`:
```json
{ "id": "uuid", "author_id": "uuid", "body": "string", "created_at": "ISO 8601 datetime" }
```

### `Incident` object shape:
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "service_id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "triggered" | "acknowledged" | "investigating" | "mitigated" | "resolved",
  "severity": "sev1" | "sev2" | "sev3" | "sev4",
  "assignee_id": "uuid | null",
  "created_by": "uuid | null"
}
```

### `IncidentDetail` object shape (extends `Incident`):
```json
{
  ...Incident fields,
  "events": [
    {
      "id": "uuid",
      "actor_id": "uuid | null",
      "event_type": "created" | "assigned" | "reassigned" | "status_changed" | "severity_changed" | "comment_added" | "resolved",
      "event_metadata": { "...arbitrary key-value pairs, e.g.": "{\"from\": \"triggered\", \"to\": \"acknowledged\"}" },
      "created_at": "ISO 8601 datetime"
    }
  ],
  "comments": [
    { "id": "uuid", "author_id": "uuid", "body": "string", "created_at": "ISO 8601 datetime" }
  ]
}
```
`actor_id: null` on an event means it was system-generated (e.g. auto-created by the health-check worker) — the UI should render this distinctly, e.g. "System" instead of a user name.

---

## 6. WebSocket — Real-Time Events

Connect to: `ws://localhost:8000/ws/organizations/{organization_id}?token={jwt}`

**Connection close codes:**
- `4401` — invalid/expired token
- `4403` — valid token, but user isn't a member of this organization

**Message envelope** — every message is JSON with a `"type"` field:

```json
{ "type": "incident.created", "incident_id": "uuid", "title": "string", "severity": "string", "status": "string", "auto_created": "boolean (optional, true if from health-check worker)" }
```
```json
{ "type": "incident.status_changed", "incident_id": "uuid", "from": "string", "to": "string", "actor_id": "uuid" }
```
```json
{ "type": "incident.assigned", "incident_id": "uuid", "old_assignee": "uuid | null", "new_assignee": "uuid", "actor_id": "uuid" }
```
```json
{ "type": "incident.comment_added", "incident_id": "uuid", "comment_id": "uuid", "author_id": "uuid", "body": "string" }
```
```json
{ "type": "service.health_check", "service_id": "uuid", "is_healthy": "boolean", "status_code": "number | null", "response_ms": "number" }
```
```json
{ "type": "service.status_changed", "service_id": "uuid", "from": "string", "to": "string" }
```

**Frontend behavior**: on receiving any `incident.*` message, invalidate/refetch the relevant RTK Query cache tags (or manually patch the cache) so the UI updates without a page reload. On `service.*` messages, same for the services list/dashboard.

**Important gotcha to design around**: WebSocket connections don't replay missed messages. On initial page load *and* on any reconnect, the frontend must fetch current state via the REST endpoints (`GET /incidents`, `GET /services`) first, then layer live WebSocket updates on top going forward — don't rely on WebSocket alone for the source of truth.

---

## 7. Roles & Permission Matrix (for conditionally rendering UI)

| Action                  | Admin | Engineer | Viewer |
|---                      |---    |---       |---     |
| View services/incidents | ✅    | ✅       | ✅     |
| Create/update service   | ✅    | ✅       | ❌     |
| Delete service          | ✅    | ❌       | ❌     |
| Create incident         | ✅    | ✅       | ❌     |
| Change incident status  | ✅    | ✅       | ❌     |
| Assign incident         | ✅    | ✅       | ❌     |
| Comment on incident     | ✅    | ✅       | ✅     |
| Add org member          | ✅    | ❌       | ❌     |
| View org members        | ✅    | ✅       | ✅     |

The frontend should hide/disable actions the current user's role doesn't permit (better UX), but the backend is the actual source of truth/enforcement — a hidden button is a UX nicety, not the security boundary.

**Determining the current user's role**: there's no single "my role" endpoint — call `GET /organizations/{organization_id}/members` and find the entry matching the current user's `id` (from `GET /auth/me`) to get their `role` for that org.

---

## 8. Screens to Build

1. **Login / Register** — public, unauthenticated
2. **Organization selector/creator** — after login, if the user belongs to multiple orgs, let them pick one; also allow creating a new org
3. **Dashboard** (per org) — matches original UI mockup: service health grid + active incidents list, live-updating via WebSocket
4. **Services list** — table/grid of all services, status badges, create/edit/delete (role-gated)
5. **Incident list** — filterable by status/severity, links to detail
6. **Incident detail** — status/severity, assignee, full event timeline, comment thread with a comment box, status-transition buttons (only showing valid next states per the state machine)
7. **Members page** — list org members + roles; admin-only "add member" form
8. **(Optional/polish) Public status page** — read-only, no auth, shows service health for a given org slug

---

## 9. Error Handling Requirements

- `401` responses anywhere → clear stored token, redirect to login
- `403` responses → show a clear "you don't have permission" message, don't just fail silently
- `400` on incident status transition → surface the backend's error message directly (it already explains valid next states)
- Network/WebSocket disconnects → show a subtle "reconnecting..." indicator, attempt reconnect with backoff, refetch state via REST once reconnected

---

Hand this whole document to your AI coding tool along with the earlier structure doc (folder layout, RTK Query patterns, types) — between the two, everything needed to build the full frontend in one pass is here: every endpoint, every request/response shape, the WebSocket contract, the permission matrix, and the screens to build.