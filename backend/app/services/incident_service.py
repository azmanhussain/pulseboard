import uuid
from typing import List
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.core.ws_manager import manager
from app.models.base import utc_now
from app.models.incident import Incident, IncidentEvent, Comment
from app.models.enums import IncidentStatus, IncidentEventType
from app.schemas.incident import IncidentCreate, CommentCreate

# The entire state machine, in one place. This dict IS the domain rule —
# no status transition happens anywhere else in the code without going through this.
VALID_TRANSITIONS: dict[IncidentStatus, set[IncidentStatus]] = {
    IncidentStatus.triggered: {IncidentStatus.acknowledged},
    IncidentStatus.acknowledged: {IncidentStatus.investigating},
    IncidentStatus.investigating: {IncidentStatus.mitigated, IncidentStatus.resolved},
    IncidentStatus.mitigated: {IncidentStatus.resolved},
    IncidentStatus.resolved: set(),  # terminal — no transitions out
}


async def create_incident(
    db: Session, organization_id: uuid.UUID, data: IncidentCreate, creator_id: uuid.UUID
) -> Incident:
    incident = Incident(
        organization_id=organization_id,
        service_id=data.service_id,
        title=data.title,
        description=data.description,
        severity=data.severity,
        created_by=creator_id,
        status=IncidentStatus.triggered,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    event = IncidentEvent(
        incident_id=incident.id,
        actor_id=creator_id,
        event_type=IncidentEventType.created,
        event_metadata={"severity": data.severity.value},
    )
    db.add(event)
    db.commit()
    
    await manager.broadcast(organization_id, {
        "type": "incident.created",
        "incident_id": str(incident.id),
        "title": incident.title,
        "severity": incident.severity.value,
        "status": incident.status.value,
    })

    return incident


def list_incidents(db: Session, organization_id: uuid.UUID) -> List[Incident]:
    return db.exec(
        select(Incident).where(Incident.organization_id == organization_id)
    ).all()


def get_incident(db: Session, organization_id: uuid.UUID, incident_id: uuid.UUID) -> Incident:
    incident = db.get(Incident, incident_id)
    if not incident or incident.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return incident


async def transition_status(
    db: Session, incident: Incident, new_status: IncidentStatus, actor_id: uuid.UUID
) -> Incident:
    allowed = VALID_TRANSITIONS.get(incident.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{incident.status.value}' to '{new_status.value}'. "
                   f"Valid next states: {[s.value for s in allowed] or 'none (terminal state)'}",
        )

    old_status = incident.status
    incident.status = new_status
    
    # NEW: actually stamp the timing fields when relevant transitions happen
    if new_status == IncidentStatus.acknowledged:
        incident.acknowledged_at = utc_now()
    elif new_status == IncidentStatus.resolved:
        incident.resolved_at = utc_now()

    db.add(incident)

    event_type = (
        IncidentEventType.resolved if new_status == IncidentStatus.resolved
        else IncidentEventType.status_changed
    )
    event = IncidentEvent(
        incident_id=incident.id,
        actor_id=actor_id,
        event_type=event_type,
        event_metadata={"from": old_status.value, "to": new_status.value},
    )
    db.add(event)
    db.commit()
    db.refresh(incident)
    
    await manager.broadcast(incident.organization_id, {
        "type": "incident.status_changed",
        "incident_id": str(incident.id),
        "from": old_status.value,
        "to": new_status.value,
        "actor_id": str(actor_id),
    })
    
    return incident


async def assign_incident(
    db: Session, incident: Incident, assignee_id: uuid.UUID, actor_id: uuid.UUID
) -> Incident:
    old_assignee = incident.assignee_id
    incident.assignee_id = assignee_id
    db.add(incident)

    event = IncidentEvent(
        incident_id=incident.id,
        actor_id=actor_id,
        event_type=(
            IncidentEventType.reassigned if old_assignee else IncidentEventType.assigned
        ),
        event_metadata={"from": str(old_assignee) if old_assignee else None, "to": str(assignee_id)},
    )
    db.add(event)
    db.commit()
    db.refresh(incident)
    
    await manager.broadcast(incident.organization_id, {
        "type": "incident.assigned",
        "incident_id": str(incident.id),
        "old_assignee": str(old_assignee) if old_assignee else None,
        "new_assignee": str(assignee_id),
        "actor_id": str(actor_id),
    })
    
    return incident


async def add_comment(
    db: Session, incident: Incident, data: CommentCreate, author_id: uuid.UUID
) -> Comment:
    comment = Comment(incident_id=incident.id, author_id=author_id, body=data.body)
    db.add(comment)

    event = IncidentEvent(
        incident_id=incident.id,
        actor_id=author_id,
        event_type=IncidentEventType.comment_added,
        event_metadata={"comment_preview": data.body[:100]},
    )
    db.add(event)
    db.commit()
    db.refresh(comment)
    
    await manager.broadcast(incident.organization_id, {
        "type": "incident.comment_added",
        "incident_id": str(incident.id),
        "comment_id": str(comment.id),
        "author_id": str(author_id),
        "body": comment.body,
    })
    
    return comment