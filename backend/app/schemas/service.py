import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import ServiceStatus


class ServiceCreate(BaseModel):
    name: str
    url: str
    environment: str = "production"
    health_check_interval: int = 60
    timeout_ms: int = 5000


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    environment: Optional[str] = None
    health_check_interval: Optional[int] = None
    timeout_ms: Optional[int] = None
    owner_id: Optional[uuid.UUID] = None


class ServiceRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    url: str
    environment: str
    owner_id: Optional[uuid.UUID]
    health_check_interval: int
    timeout_ms: int
    current_status: ServiceStatus

    model_config = ConfigDict(from_attributes=True)