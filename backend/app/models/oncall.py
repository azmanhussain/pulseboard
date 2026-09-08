import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from .base import new_uuid, utc_now

class OnCallSchedule(SQLModel, table=True):
    __tablename__ = "on_call_schedules"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", nullable=False, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    starts_at: datetime = Field(nullable=False)
    ends_at: datetime = Field(nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)


class Deployment(SQLModel, table=True):
    __tablename__ = "deployments"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="services.id", nullable=False, index=True)
    version: str = Field(max_length=100, nullable=False)
    deployed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    deployed_at: datetime = Field(default_factory=utc_now, nullable=False)
    notes: Optional[str] = None