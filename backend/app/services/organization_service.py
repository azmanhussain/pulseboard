from sqlmodel import Session
from fastapi import HTTPException, status
import uuid
from typing import List
from sqlmodel import Session, select

from app.models.organization import Organization
from app.models.user import OrganizationMember, User
from app.models.enums import UserRole
from app.schemas.organization import OrganizationCreate, OrganizationMemberRead, OrganizationMemberAdd


def create_organization(db: Session, data: OrganizationCreate, creator: User) -> Organization:
    org = Organization(name=data.name, slug=data.slug)
    db.add(org)
    db.commit()
    db.refresh(org)

    # Creator automatically becomes admin of the org they create
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=creator.id,
        role=UserRole.admin,
    )
    db.add(membership)
    db.commit()

    return org

def list_members(db: Session, organization_id: uuid.UUID) -> List[OrganizationMemberRead]:
    rows = db.exec(
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == organization_id)
    ).all()

    return [
        OrganizationMemberRead(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=membership.role,
        )
        for membership, user in rows
    ]

def add_member(
    db: Session, organization_id: uuid.UUID, data: OrganizationMemberAdd
) -> OrganizationMemberRead:
    user = db.exec(select(User).where(User.email == data.email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user found with that email — they must register first",
        )

    existing = db.exec(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user.id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this organization",
        )

    membership = OrganizationMember(
        organization_id=organization_id,
        user_id=user.id,
        role=data.role,
    )
    db.add(membership)
    db.commit()

    return OrganizationMemberRead(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=membership.role,
    )
    
def get_organization(db: Session, organization_id: uuid.UUID) -> Organization:
    org = db.get(Organization, organization_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org