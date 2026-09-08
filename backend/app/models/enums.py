import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    engineer = "engineer"
    viewer = "viewer"

class ServiceStatus(str, enum.Enum):
    healthy = "healthy"
    degraded = "degraded"
    down = "down"
    unknown = "unknown"

class IncidentStatus(str, enum.Enum):
    triggered = "triggered"
    acknowledged = "acknowledged"
    investigating = "investigating"
    mitigated = "mitigated"
    resolved = "resolved"

class IncidentSeverity(str, enum.Enum):
    sev1 = "sev1"
    sev2 = "sev2"
    sev3 = "sev3"
    sev4 = "sev4"

class IncidentEventType(str, enum.Enum):
    created = "created"
    assigned = "assigned"
    reassigned = "reassigned"
    status_changed = "status_changed"
    severity_changed = "severity_changed"
    comment_added = "comment_added"
    resolved = "resolved"