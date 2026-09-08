import uuid
from pydantic import BaseModel, EmailStr, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str

    model_config = ConfigDict(from_attributes=True)