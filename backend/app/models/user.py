from datetime import datetime
import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from .base import TimestampMixin, new_uuid, utc_now
from .enums import UserRole

if TYPE_CHECKING:
    from .organization import Organization

class User(TimestampMixin, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    email: str = Field(max_length=255, nullable=False, unique=True, index=True)
    hashed_password: str = Field(max_length=255, nullable=False)
    full_name: str = Field(max_length=255, nullable=False)
    is_active: bool = Field(default=True, nullable=False)

    org_memberships: List["OrganizationMember"] = Relationship(back_populates="user")


class OrganizationMember(SQLModel, table=True):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id"),)

    id: uuid.UUID = Field(default_factory=new_uuid, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", nullable=False, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    role: UserRole = Field(default=UserRole.engineer, nullable=False)
    joined_at: datetime = Field(default_factory=utc_now, nullable=False)

    organization: Optional["Organization"] = Relationship(back_populates="members")
    user: Optional["User"] = Relationship(back_populates="org_memberships")