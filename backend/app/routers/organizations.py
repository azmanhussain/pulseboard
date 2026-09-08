import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from app.db.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.organization import OrganizationCreate, OrganizationRead, OrganizationMemberRead, OrganizationMemberAdd
from app.services import organization_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationRead)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return organization_service.create_organization(db, data, current_user)


@router.get("/{organization_id}/admin-only-check")
def admin_only_check(
    organization_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """A throwaway test route — proves require_role() works before you build real admin features on top of it."""
    return {"message": f"Hello admin {current_user.full_name}, you have access to org {organization_id}"}

@router.get("/{organization_id}/members", response_model=List[OrganizationMemberRead])
def list_members(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return organization_service.list_members(db, organization_id)

@router.post("/{organization_id}/members", response_model=OrganizationMemberRead)
def add_member(
    organization_id: uuid.UUID,
    data: OrganizationMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    return organization_service.add_member(db, organization_id, data)

@router.get("/{organization_id}", response_model=OrganizationRead)
def get_organization(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return organization_service.get_organization(db, organization_id)