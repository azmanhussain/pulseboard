import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import IncidentStatus, IncidentSeverity, IncidentEventType


class IncidentCreate(BaseModel):
    service_id: uuid.UUID
    title: str
    description: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.sev3


class IncidentAssign(BaseModel):
    assignee_id: uuid.UUID


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class IncidentSeverityUpdate(BaseModel):
    severity: IncidentSeverity


class CommentCreate(BaseModel):
    body: str


class CommentRead(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentEventRead(BaseModel):
    id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    event_type: IncidentEventType
    event_metadata: Optional[dict]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    service_id: uuid.UUID
    title: str
    description: Optional[str]
    status: IncidentStatus
    severity: IncidentSeverity
    assignee_id: Optional[uuid.UUID]
    created_by: Optional[uuid.UUID]

    model_config = ConfigDict(from_attributes=True)


class IncidentDetailRead(IncidentRead):
    events: List[IncidentEventRead] = []
    comments: List[CommentRead] = []