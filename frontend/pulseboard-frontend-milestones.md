# PulseBoard Frontend — Milestones & Prompt Phases

A phased build plan so you (or your AI coding tool) build and verify one working slice at a time, rather than generating the whole frontend in one shot and debugging everything at once. Each phase has a milestone (what "done" looks like) and a ready-to-paste prompt.

**Before Phase 1**: make sure both `pulseboard-react-structure.md` and `pulseboard-frontend-requirements.md` are available to whatever tool you're using (attach them, paste them into context, or reference their contents) — every prompt below assumes the tool has already seen these two documents.

---

## Phase 0 — Project Scaffold

**Milestone**: `npm run dev` runs a blank Vite+React+TS app with Tailwind v4 working (visible if you drop a `bg-blue-500` class somewhere) and Redux Toolkit store wired up with an empty reducer.

**Prompt:**
> Set up a new Vite + React + TypeScript project called `pulseboard-frontend`. Install and configure Tailwind CSS v4 using the `@tailwindcss/vite` plugin (no `tailwind.config.js`, no PostCSS config — v4 doesn't need them). Set up Redux Toolkit with `configureStore` in `src/app/store.ts`, and typed hooks (`useAppDispatch`, `useAppSelector`) in `src/app/hooks.ts`. Set up React Router in `App.tsx` with a single placeholder route at `/` that renders "PulseBoard" styled with a Tailwind class, to confirm styling works. Follow the folder structure in the attached `pulseboard-react-structure.md`.

---

## Phase 1 — Auth Flow

**Milestone**: You can register a new user, log in, get redirected to a protected page, and refreshing the page keeps you logged in (token persists). Logging out clears the session and redirects to login.

**Prompt:**
> Build the authentication flow for PulseBoard. Create `src/api/baseApi.ts` (RTK Query base API with `Authorization: Bearer` header injection from Redux state) and `src/features/auth/authSlice.ts` (stores token + current user, persists token to localStorage) exactly as specified in `pulseboard-react-structure.md`. Create `src/api/authApi.ts` with `register`, `login`, and `getCurrentUser` (`/auth/me`) endpoints per the request/response shapes in `pulseboard-frontend-requirements.md` — note `/auth/login` is form-encoded, not JSON. Build `LoginPage.tsx` and `RegisterPage.tsx` using React Hook Form with basic validation (required fields, valid email). On successful login, call `/auth/me`, store the user + token in `authSlice`, and redirect to `/dashboard`. Build a `ProtectedRoute` component in `src/components/` that redirects to `/login` if there's no token. Add a logout button/action anywhere reasonable for now (e.g. a placeholder header) that clears the session and redirects to `/login`.

**Test yourself**: register two users via the UI, log in as one, refresh the page (should stay logged in), log out, confirm you're bounced to login when visiting `/dashboard` directly.

---

## Phase 2 — Layout Shell & Organization Selection

**Milestone**: After login, you land on a dashboard shell with a sidebar (Overview / Services / Incidents / Members, matching the original UI mockup) and can create an organization or see existing ones. The selected org's ID is available app-wide.

**Prompt:**
> Build the dashboard layout shell and organization handling for PulseBoard. Create `src/layouts/DashboardLayout.tsx` with a sidebar (Overview, Services, Incidents, Members) and a header showing the current user's name and a logout button, matching this rough structure: a fixed left sidebar with nav links, main content area on the right rendering nested routes via `<Outlet />`. Create `src/api/organizationsApi.ts` with `createOrganization` and `listMembers`/`addMember` endpoints per `pulseboard-frontend-requirements.md`. Since there's no "list my organizations" endpoint on the backend, store the currently selected organization's ID in a new `organizationSlice` (client state, similar pattern to `authSlice`) — for now, build a simple "Create Organization" form shown when no org is selected, and once created, store its ID and route into `DashboardLayout`. Persist the selected org ID to localStorage so it survives a refresh.

**Test yourself**: log in, create an org, confirm you land on the dashboard shell with the sidebar visible, refresh and confirm the org selection persists.

---

## Phase 3 — Services CRUD

**Milestone**: Full services list/create/edit/delete working, with role-based UI (viewers can't see create/edit/delete controls).

**Prompt:**
> Build the Services feature for PulseBoard. Create `src/api/servicesApi.ts` with `listServices`, `getService`, `createService`, `updateService`, `deleteService` endpoints per the shapes in `pulseboard-frontend-requirements.md`, using RTK Query tags (`Service`) for cache invalidation. Build `ServicesListPage.tsx` showing a table/grid of services with name, URL, environment, and a colored status badge (`StatusBadge.tsx` component — green for healthy, red for down, yellow for degraded, gray for unknown). Add a "Create Service" button opening a modal/form (React Hook Form) for admins and engineers only — hide it entirely for viewers. Add edit (pencil icon) and delete (trash icon, admin-only) actions per row. To determine the current user's role for this org, fetch `GET /organizations/{organization_id}/members` and match against the current user's ID from `authSlice`; store this role in `organizationSlice` once fetched so other features can reuse it without re-fetching. Use the permission matrix in `pulseboard-frontend-requirements.md` to decide what to show/hide.

**Test yourself**: as admin, create/edit/delete a service; as a viewer account (add one via the Members phase later, or manually via SQL for now), confirm create/edit/delete controls are hidden.

---

## Phase 4 — Incidents List

**Milestone**: Incident list page showing all incidents with status/severity badges, filterable, with a "Create Incident" flow.

**Prompt:**
> Build the Incidents list feature for PulseBoard. Create `src/api/incidentsApi.ts` with `listIncidents`, `getIncident`, `createIncident`, `updateIncidentStatus`, `assignIncident`, `addComment` endpoints exactly as specified in `pulseboard-react-structure.md` (including the optimistic update pattern with `onQueryStarted` for `updateIncidentStatus`) and shapes from `pulseboard-frontend-requirements.md`. Build `IncidentsListPage.tsx` showing incidents in a table with title, service name, status badge, severity badge (`SeverityBadge.tsx` — sev1 red through sev4 gray), and assignee. Add client-side filter dropdowns for status and severity (filtering the already-fetched list, no need for new backend query params). Add a "Create Incident" button/modal (admin/engineer only) requiring a service selection (fetch services via `servicesApi` for the dropdown), title, optional description, and severity. Clicking a row navigates to `/incidents/:incidentId` (the detail page, to be built next — a placeholder page is fine for now).

**Test yourself**: create a few incidents at different severities, confirm filters work, confirm viewers can't see the create button.

---

## Phase 5 — Incident Detail (Timeline + State Machine + Comments)

**Milestone**: Full incident detail page — status transition buttons that only show valid next states, an event timeline, and a working comment thread.

**Prompt:**
> Build the Incident Detail page for PulseBoard — this is the centerpiece feature. Build `IncidentDetailPage.tsx` fetching via `getIncident` (returns the full `IncidentDetail` with `events` and `comments`, per `pulseboard-frontend-requirements.md`). Show the incident's title, description, current status and severity badges, and assignee. Build status transition buttons that only render the *valid next states* for the current status, following this exact state machine: triggered→acknowledged, acknowledged→investigating, investigating→mitigated or resolved, mitigated→resolved, resolved→(none, terminal). Clicking a transition button calls `updateIncidentStatus`; if the backend returns a 400 (invalid transition), show the error message from the response in a toast/banner rather than failing silently. Build `IncidentTimeline.tsx` rendering the `events` array chronologically, with a human-readable description per `event_type` (e.g. "status changed from triggered to acknowledged", "assigned to {name}", "comment added") — show "System" instead of a user reference when `actor_id` is null. Build `CommentThread.tsx` showing existing comments with author and timestamp, plus a text input + submit button (React Hook Form) calling `addComment`; available to all roles including viewers. Only admins/engineers should see the status transition buttons and an "assign" control (a simple dropdown of org members from the members list).

**Test yourself**: walk an incident through its full lifecycle via the UI, confirm invalid transitions are rejected with a visible error, confirm comments and timeline update after each action.

---

## Phase 6 — Real-Time WebSocket Layer

**Milestone**: Incident/service changes made by *another* browser tab/session appear live on your dashboard and incident detail pages without a manual refresh.

**Prompt:**
> Add real-time updates to PulseBoard via WebSocket. Build `src/hooks/useWebSocket.ts` — a hook that connects to `ws://localhost:8000/ws/organizations/{organizationId}?token={jwt}` (using the current org ID and token from Redux state), parses incoming JSON messages by their `"type"` field per the contract in `pulseboard-frontend-requirements.md`, and on any `incident.*` or `service.*` message, invalidates the relevant RTK Query cache tags (`Incident` or `Service`) so already-open pages refetch and re-render automatically — don't manually splice data into the cache, just invalidate and let RTK Query refetch, it's simpler and less error-prone. Handle connection close codes `4401`/`4403` by showing an error state. Implement automatic reconnection with exponential backoff (start at 1s, cap at 30s) if the connection drops unexpectedly (not on a clean 4401/4403 close, which shouldn't retry). Call this hook once in `DashboardLayout.tsx` so it's active across the whole authenticated app. On successful (re)connection, don't rely on any messages that might have been missed — the existing RTK Query cache/refetch-on-mount behavior already covers catching up on state.

**Test yourself**: open the app in two browser tabs (or one normal + one incognito) logged in as different users in the same org. Make a change in one tab (create incident, change status, add comment) and confirm it appears in the other tab within a second or two, with no manual refresh.

---

## Phase 7 — Organization Members

**Milestone**: Members page showing everyone in the org and their role, with an admin-only "add member" form.

**Prompt:**
> Build the Organization Members page for PulseBoard. Build `MembersPage.tsx` (or fold into an existing features folder) listing all members via the already-built `listMembers` endpoint, showing name, email, and role as a badge. For admins only, add an "Add Member" form (React Hook Form) taking an email and a role dropdown (admin/engineer/viewer), calling `addMember`. Handle and display the specific backend errors: 404 if the email isn't a registered user yet ("ask them to register first"), 400 if already a member. Add this page to the sidebar navigation from `DashboardLayout.tsx`.

**Test yourself**: as admin, add a second registered user as engineer and a third as viewer; confirm the members list updates and role badges are correct.

---

## Phase 8 — Dashboard Overview & Polish

**Milestone**: The "Overview" landing page matches the original UI mockup — service health grid + active incidents at a glance — and the app feels cohesive rather than a set of disconnected pages.

**Prompt:**
> Build the Dashboard Overview page for PulseBoard, matching this layout: a grid of service health cards (name, status badge, uptime-ish indicator) across the top, and a list of currently-active (non-resolved) incidents below, sorted by severity then recency, each linking to its detail page. Reuse `StatusBadge` and `SeverityBadge` from earlier phases. Add basic empty states ("No services yet — create one to get started" / "No active incidents 🎉") for a new organization with nothing in it yet. Do a pass over the whole app for consistent spacing, a coherent color palette (Tailwind), and loading spinners/skeletons on the RTK Query loading states across all pages built so far, so nothing shows a blank white screen while fetching.

---

## Optional Phase 9 — Public Status Page

**Milestone**: An unauthenticated, read-only page showing service health for a given org — the "polish" feature from the original requirements doc.

**Prompt:**
> Build a public, unauthenticated status page for PulseBoard at route `/status/:orgSlug`. Note: the current backend doesn't have a public/unauthenticated services endpoint — you'll need to either add one (`GET /public/organizations/{slug}/status` returning just service names + status, no auth required) or skip this phase until that backend endpoint exists. If building the frontend piece now in anticipation, use a placeholder API call and mock data, and design the page to show each service's name and a simple healthy/degraded/down indicator, refreshing every 30 seconds via polling (a public page doesn't need the authenticated WebSocket).

---

## How to Use These Phases

Work through them **in order**, one at a time, testing each milestone before moving to the next — same discipline as the backend build. If a phase's prompt produces something that doesn't quite work, debug that phase fully before starting the next one; letting broken pieces pile up across phases makes debugging the whole app much harder later, same lesson as the datetime-field bug that touched 7 models at once on the backend.