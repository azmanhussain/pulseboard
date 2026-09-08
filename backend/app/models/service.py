from datetime import datetime
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from .base import TimestampMixin, new_uuid, utc_now
from .enums import ServiceStatus

if TYPE_CHECKING:
    from .organization import Organization
    from .incident import Incident


class Service(TimestampMixin, table=True):
    __tablename__ = "services"
    __table_args__ = (UniqueConstraint("organization_id", "name"),)

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", nullable=False, index=True)
    name: str = Field(max_length=255, nullable=False)
    url: str = Field(max_length=500, nullable=False)
    environment: str = Field(default="production", max_length=50, nullable=False)
    owner_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    health_check_interval: int = Field(default=60, nullable=False)
    timeout_ms: int = Field(default=5000, nullable=False)
    current_status: ServiceStatus = Field(default=ServiceStatus.unknown, nullable=False, index=True)

    organization: Optional["Organization"] = Relationship(back_populates="services")
    checks: List["ServiceCheck"] = Relationship(back_populates="service")
    incidents: List["Incident"] = Relationship(back_populates="service")


class ServiceCheck(SQLModel, table=True):
    __tablename__ = "service_checks"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="services.id", nullable=False, index=True)
    status_code: Optional[int] = None
    response_ms: Optional[int] = None
    is_healthy: bool = Field(nullable=False)
    checked_at: datetime = Field(default_factory=utc_now, nullable=False)

    service: Optional["Service"] = Relationship(back_populates="checks")