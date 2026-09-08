export type UserRole = 'admin' | 'engineer' | 'viewer';
export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type IncidentStatus = 'triggered' | 'acknowledged' | 'investigating' | 'mitigated' | 'resolved';
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: UserRole;
  organization_id?: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface OrganizationMember {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AddMemberPayload {
  email: string;
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
  status?: ServiceStatus;
  organizationId?: string;
}

export interface ServiceCreatePayload {
  name: string;
  url: string;
  environment?: string;
  health_check_interval?: number;
  timeout_ms?: number;
}

export interface ServiceUpdatePayload {
  name?: string;
  url?: string;
  environment?: string;
  health_check_interval?: number;
  timeout_ms?: number;
  owner_id?: string | null;
}

export interface IncidentEvent {
  id: string;
  actor_id: string | null;
  event_type:
    | 'created'
    | 'assigned'
    | 'reassigned'
    | 'status_changed'
    | 'severity_changed'
    | 'comment_added'
    | 'resolved'
    | string;
  event_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  user?: Pick<User, 'id' | 'email' | 'full_name'>;
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
  created_at?: string;
  updated_at?: string;
  service?: Service;
}

export interface IncidentDetail extends Incident {
  events: IncidentEvent[];
  comments: Comment[];
  timeline?: IncidentEvent[];
}

export interface IncidentCreatePayload {
  service_id: string;
  title: string;
  description?: string | null;
  severity?: IncidentSeverity;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  token?: string;
  user?: User | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  email: string;
  password?: string;
  full_name: string;
}

export type WebSocketMessageType =
  | 'incident.created'
  | 'incident.status_changed'
  | 'incident.assigned'
  | 'incident.comment_added'
  | 'service.health_check'
  | 'service.status_changed'
  | string;

export interface WebSocketEventMessage {
  type: WebSocketMessageType;
  incident_id?: string;
  service_id?: string;
  title?: string;
  severity?: string;
  status?: string;
  from?: string;
  to?: string;
  actor_id?: string;
  old_assignee?: string | null;
  new_assignee?: string;
  comment_id?: string;
  author_id?: string;
  body?: string;
  is_healthy?: boolean;
  status_code?: number | null;
  response_ms?: number;
  auto_created?: boolean;
  [key: string]: unknown;
}
