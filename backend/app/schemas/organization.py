import uuid
from pydantic import BaseModel, ConfigDict, EmailStr
from app.models.enums import UserRole

class OrganizationCreate(BaseModel):
    name: str
    slug: str

class OrganizationRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberRead(BaseModel):
    user_id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberAdd(BaseModel):
    email: EmailStr       # the user being added must already be registered
    role: UserRole = UserRole.engineer