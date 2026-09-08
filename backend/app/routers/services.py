import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from app.db.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceRead
from app.services import monitoring_service

router = APIRouter(prefix="/organizations/{organization_id}/services", tags=["services"])


@router.post("", response_model=ServiceRead)
def create_service(
    organization_id: uuid.UUID,
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    return monitoring_service.create_service(db, organization_id, data)


@router.get("", response_model=List[ServiceRead])
def list_services(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return monitoring_service.list_services(db, organization_id)


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(
    organization_id: uuid.UUID,
    service_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return monitoring_service.get_service(db, organization_id, service_id)


@router.patch("/{service_id}", response_model=ServiceRead)
def update_service(
    organization_id: uuid.UUID,
    service_id: uuid.UUID,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    return monitoring_service.update_service(db, organization_id, service_id, data)


@router.delete("/{service_id}", status_code=204)
def delete_service(
    organization_id: uuid.UUID,
    service_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    monitoring_service.delete_service(db, organization_id, service_id)