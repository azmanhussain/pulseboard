# PulseBoard — React Frontend Structure

Given your existing experience with hooks, Redux Toolkit, TypeScript, and Jest, this skips straight to structuring the actual app rather than teaching fundamentals — matching the tech stack from your original requirements doc (React + TypeScript, Redux Toolkit + RTK Query, React Router, Tailwind, Recharts).

---

## 1. Scaffold the Project

```bash
npm create vite@latest pulseboard-frontend -- --template react-ts
cd pulseboard-frontend
npm install
```

Vite over Create React App — CRA is deprecated/unmaintained at this point, and Vite is the current standard. Worth knowing why if asked: esbuild-based dev server, near-instant HMR, native ESM.

### Install dependencies
```bash
npm install @reduxjs/toolkit react-redux react-router-dom react-hook-form recharts
npm install -D @tailwindcss/vite tailwindcss
```

Tailwind CSS v4 changed its setup significantly — there's no more `tailwindcss init -p` command or `tailwind.config.js` file. Instead, it's a Vite plugin with CSS-based configuration. Update `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Then in `src/index.css` (or wherever your global stylesheet is), replace its contents with:
```css
@import "tailwindcss";
```

That's the entire setup — no `postcss.config.js`, no `autoprefixer` package needed, no config file. If you see Tailwind classes not applying, restart the dev server (`npm run dev`) after this change, since Vite needs to pick up the new plugin.

---

## 2. Folder Structure

```
src/
├── main.tsx
├── App.tsx
├── app/
│   ├── store.ts                  # Redux store configuration
│   └── hooks.ts                  # Typed useAppDispatch/useAppSelector
├── api/
│   ├── baseApi.ts                 # RTK Query base API slice
│   ├── authApi.ts                 # Auth endpoints (extends baseApi)
│   ├── organizationsApi.ts
│   ├── servicesApi.ts
│   └── incidentsApi.ts
├── features/
│   ├── auth/
│   │   ├── authSlice.ts           # Client-side auth state (token, current user)
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── services/
│   │   ├── ServicesListPage.tsx
│   │   └── ServiceCard.tsx
│   └── incidents/
│       ├── IncidentsListPage.tsx
│       ├── IncidentDetailPage.tsx
│       ├── IncidentTimeline.tsx
│       └── CommentThread.tsx
├── components/                    # Shared, dumb/presentational components
│   ├── StatusBadge.tsx
│   ├── SeverityBadge.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   └── useWebSocket.ts            # The real-time layer
├── types/
│   └── index.ts                   # Shared TS types matching your backend schemas
└── layouts/
    └── DashboardLayout.tsx        # Sidebar + header shell (matches your original UI mockup)
```

**Why `api/` is split from `features/`**: RTK Query API slices are pure data-fetching definitions with no UI — keeping them separate from page components means the same `incidentsApi` hooks can be reused across the list page, detail page, and dashboard without any component owning the fetching logic. This is exactly the "server-state vs client-state" separation your original requirements doc called out as an interview talking point.

---

## 3. Types Matching Your Backend

### `src/types/index.ts`
```typescript
export type UserRole = "admin" | "engineer" | "viewer";
export type ServiceStatus = "healthy" | "degraded" | "down" | "unknown";
export type IncidentStatus = "triggered" | "acknowledged" | "investigating" | "mitigated" | "resolved";
export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface OrganizationMember {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  environment: string;
  owner_id: string | null;
  health_check_interval: number;
  timeout_ms: number;
  current_status: ServiceStatus;
}

export interface Incident {
  id: string;
  organization_id: string;
  service_id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  assignee_id: string | null;
  created_by: string | null;
}

export interface IncidentEvent {
  id: string;
  actor_id: string | null;
  event_type: string;
  event_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface IncidentDetail extends Incident {
  events: IncidentEvent[];
  comments: Comment[];
}
```

These mirror your Pydantic response schemas field-for-field — keeping them in sync manually is fine at this scale; at a larger scale you'd generate these from your OpenAPI schema (`openapi-typescript` is the standard tool), worth mentioning as a known scaling step.

---

## 4. RTK Query Setup

### `src/api/baseApi.ts`
```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../app/store";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8000",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Service", "Incident", "Member"],
  endpoints: () => ({}),
});
```

The empty `endpoints: () => ({})` plus `tagTypes` here is intentional — this is the RTK Query pattern of a single base API "injected" with endpoints from separate files (`servicesApi.ts`, `incidentsApi.ts`, etc.) via `.injectEndpoints()`, rather than one giant file. Keeps each domain's endpoints colocated with that domain.

### `src/api/incidentsApi.ts`
```typescript
import { baseApi } from "./baseApi";
import type { Incident, IncidentDetail } from "../types";

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listIncidents: builder.query<Incident[], string>({
      query: (organizationId) => `/organizations/${organizationId}/incidents`,
      providesTags: ["Incident"],
    }),
    getIncident: builder.query<IncidentDetail, { organizationId: string; incidentId: string }>({
      query: ({ organizationId, incidentId }) =>
        `/organizations/${organizationId}/incidents/${incidentId}`,
      providesTags: ["Incident"],
    }),
    createIncident: builder.mutation<Incident, { organizationId: string; body: Partial<Incident> }>({
      query: ({ organizationId, body }) => ({
        url: `/organizations/${organizationId}/incidents`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Incident"],
    }),
    updateIncidentStatus: builder.mutation<
      Incident,
      { organizationId: string; incidentId: string; status: string }
    >({
      query: ({ organizationId, incidentId, status }) => ({
        url: `/organizations/${organizationId}/incidents/${incidentId}/status`,
        method: "PATCH",
        body: { status },
      }),
      // Optimistic update: flip the status in the cache immediately,
      // before the server responds — this is the RTK Query feature
      // your original requirements doc specifically called out.
      async onQueryStarted({ organizationId, incidentId, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          incidentsApi.util.updateQueryData("getIncident", { organizationId, incidentId }, (draft) => {
            draft.status = status as Incident["status"];
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); // roll back if the server rejects the transition (e.g. invalid state)
        }
      },
      invalidatesTags: ["Incident"],
    }),
  }),
});

export const {
  useListIncidentsQuery,
  useGetIncidentQuery,
  useCreateIncidentMutation,
  useUpdateIncidentStatusMutation,
} = incidentsApi;
```

This `onQueryStarted` block is the actual optimistic-update pattern from your requirements doc's resume bullet — worth understanding this specific shape well, since "how does your optimistic update work" is a near-guaranteed interview follow-up once you list it. The rollback (`patchResult.undo()`) is what makes this safe: if your backend's state machine rejects the transition (e.g. `resolved` → `acknowledged`), the UI snaps back to the real status instead of showing a lie.

---

## 5. Auth State (Redux slice, not RTK Query — this is client state, not server state)

### `src/features/auth/authSlice.ts`
```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types";

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

This is exactly the "server state vs client state" distinction worth being able to articulate: the JWT and current user identity are genuinely client-owned state (RTK Query has no business managing "am I logged in"), while incidents/services are server state that RTK Query owns and caches.

### `src/app/store.ts`
```typescript
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../api/baseApi";
import authReducer from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 6. Suggested Build Order

1. **Auth flow** — Login/Register pages, `authSlice`, protected route wrapper. Get a token stored and confirm `GET /auth/me` works from the frontend before building anything else.
2. **Layout shell** — sidebar + header matching your original UI mockup, with React Router set up
3. **Services list + create** — simplest CRUD screen, good warm-up before Incidents
4. **Incidents list + detail** — the centerpiece, including the timeline component
5. **WebSocket hook** — wire `useWebSocket` into the dashboard so incident updates arrive live
6. **Status page** (public, read-only) — the polish feature from your original phase 6

---

## Next Steps

Want to start with the **Auth flow** (Login/Register pages + wiring up the token), since everything else depends on being logged in?