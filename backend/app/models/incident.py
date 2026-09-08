from datetime import datetime
import uuid
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy.dialects.postgresql import JSONB
from .base import TimestampMixin, new_uuid, utc_now
from .enums import IncidentStatus, IncidentSeverity, IncidentEventType

if TYPE_CHECKING:
    from .organization import Organization
    from .service import Service

class Incident(TimestampMixin, table=True):
    __tablename__ = "incidents"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", nullable=False, index=True)
    service_id: uuid.UUID = Field(foreign_key="services.id", nullable=False, index=True)
    title: str = Field(max_length=255, nullable=False)
    description: Optional[str] = None
    status: IncidentStatus = Field(default=IncidentStatus.triggered, nullable=False, index=True)
    severity: IncidentSeverity = Field(default=IncidentSeverity.sev3, nullable=False, index=True)
    assignee_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    triggered_at: datetime = Field(default_factory=utc_now, nullable=False)
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    organization: Optional["Organization"] = Relationship(back_populates="incidents")
    service: Optional["Service"] = Relationship(back_populates="incidents")
    events: List["IncidentEvent"] = Relationship(back_populates="incident")
    comments: List["Comment"] = Relationship(back_populates="incident")


class IncidentEvent(SQLModel, table=True):
    __tablename__ = "incident_events"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", nullable=False, index=True)
    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    event_type: IncidentEventType = Field(nullable=False)
    event_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=utc_now, nullable=False)

    incident: Optional["Incident"] = Relationship(back_populates="events")


class Comment(TimestampMixin, table=True):
    __tablename__ = "comments"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", nullable=False, index=True)
    author_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    body: str = Field(nullable=False)

    incident: Optional["Incident"] = Relationship(back_populates="comments")