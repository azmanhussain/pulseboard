import uuid
from typing import List
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


def create_service(db: Session, organization_id: uuid.UUID, data: ServiceCreate) -> Service:
    existing = db.exec(
        select(Service).where(
            Service.organization_id == organization_id,
            Service.name == data.name,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service '{data.name}' already exists in this organization",
        )

    service = Service(organization_id=organization_id, **data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def list_services(db: Session, organization_id: uuid.UUID) -> List[Service]:
    return db.exec(
        select(Service).where(Service.organization_id == organization_id)
    ).all()


def get_service(db: Session, organization_id: uuid.UUID, service_id: uuid.UUID) -> Service:
    service = db.get(Service, service_id)
    if not service or service.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


def update_service(
    db: Session, organization_id: uuid.UUID, service_id: uuid.UUID, data: ServiceUpdate
) -> Service:
    service = get_service(db, organization_id, service_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, organization_id: uuid.UUID, service_id: uuid.UUID) -> None:
    service = get_service(db, organization_id, service_id)
    db.delete(service)
    db.commit()