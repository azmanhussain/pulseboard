import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSON
from .base import new_uuid, utc_now

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", nullable=False, index=True)
    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    event_type: str = Field(max_length=100, nullable=False)
    resource_type: str = Field(max_length=50, nullable=False, index=True)
    resource_id: uuid.UUID = Field(nullable=False, index=True)
    metadata_: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=utc_now, nullable=False)


class IdempotencyKey(SQLModel, table=True):
    __tablename__ = "idempotency_keys"

    key: str = Field(max_length=255, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    endpoint: str = Field(max_length=255, nullable=False)
    response_body: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    status_code: Optional[int] = None
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    expires_at: datetime = Field(nullable=False)