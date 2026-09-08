import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.incident import (
    IncidentCreate, IncidentRead, IncidentDetailRead,
    IncidentStatusUpdate, IncidentAssign, CommentCreate, CommentRead,
)
from app.services import incident_service

router = APIRouter(prefix="/organizations/{organization_id}/incidents", tags=["incidents"])


@router.post("", response_model=IncidentRead)
async def create_incident(
    organization_id: uuid.UUID,
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    return await incident_service.create_incident(db, organization_id, data, current_user.id)


@router.get("", response_model=List[IncidentRead])
def list_incidents(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return incident_service.list_incidents(db, organization_id)


@router.get("/{incident_id}", response_model=IncidentDetailRead)
def get_incident(
    organization_id: uuid.UUID,
    incident_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    return incident_service.get_incident(db, organization_id, incident_id)


@router.patch("/{incident_id}/status", response_model=IncidentRead)
async def update_status(
    organization_id: uuid.UUID,
    incident_id: uuid.UUID,
    data: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    incident = incident_service.get_incident(db, organization_id, incident_id)
    return await incident_service.transition_status(db, incident, data.status, current_user.id)


@router.patch("/{incident_id}/assign", response_model=IncidentRead)
async def assign_incident(
    organization_id: uuid.UUID,
    incident_id: uuid.UUID,
    data: IncidentAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    incident = incident_service.get_incident(db, organization_id, incident_id)
    return await incident_service.assign_incident(db, incident, data.assignee_id, current_user.id)


@router.post("/{incident_id}/comments", response_model=CommentRead)
async def add_comment(
    organization_id: uuid.UUID,
    incident_id: uuid.UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer, UserRole.viewer)),
):
    incident = incident_service.get_incident(db, organization_id, incident_id)
    return await incident_service.add_comment(db, incident, data, current_user.id)