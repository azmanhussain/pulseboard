import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from .base import TimestampMixin, new_uuid

if TYPE_CHECKING:
    from .user import OrganizationMember
    from .incident import Incident
    from .service import Service

class Organization(TimestampMixin, table=True):
    __tablename__ = "organizations"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    slug: str = Field(max_length=100, nullable=False, unique=True, index=True)

    members: List["OrganizationMember"] = Relationship(back_populates="organization")
    services: List["Service"] = Relationship(back_populates="organization")
    incidents: List["Incident"] = Relationship(back_populates="organization")