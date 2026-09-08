import asyncio
import uuid
import httpx
from datetime import datetime, timezone
from sqlmodel import Session, select

from app.db.session import engine
from app.models.service import Service, ServiceCheck
from app.models.incident import Incident, IncidentEvent
from app.models.enums import ServiceStatus, IncidentStatus, IncidentSeverity, IncidentEventType
from app.models.base import utc_now
from app.core.ws_manager import manager

# After this many consecutive failures, auto-create an incident.
FAILURE_THRESHOLD = 3


async def check_one_service(service_id: uuid.UUID):
    """Pings a single service, records the result, and handles status transitions."""
    with Session(engine) as db:
        service = db.get(Service, service_id)
        if not service:
            return  # deleted between scheduling and running

        is_healthy = False
        status_code = None
        response_ms = None

        start = datetime.now(timezone.utc)
        try:
            async with httpx.AsyncClient(timeout=service.timeout_ms / 1000) as client:
                response = await client.get(service.url)
                status_code = response.status_code
                is_healthy = 200 <= status_code < 400
        except httpx.RequestError:
            is_healthy = False  # timeout, connection refused, DNS failure, etc.
        finally:
            elapsed = datetime.now(timezone.utc) - start
            response_ms = int(elapsed.total_seconds() * 1000)

        check = ServiceCheck(
            service_id=service.id,
            status_code=status_code,
            response_ms=response_ms,
            is_healthy=is_healthy,
            checked_at=utc_now(),
        )
        db.add(check)

        old_status = service.current_status
        new_status = ServiceStatus.healthy if is_healthy else ServiceStatus.down
        service.current_status = new_status
        db.add(service)
        db.commit()

        await manager.broadcast(service.organization_id, {
            "type": "service.health_check",
            "service_id": str(service.id),
            "is_healthy": is_healthy,
            "status_code": status_code,
            "response_ms": response_ms,
        })

        if old_status != new_status:
            await manager.broadcast(service.organization_id, {
                "type": "service.status_changed",
                "service_id": str(service.id),
                "from": old_status.value,
                "to": new_status.value,
            })

        if not is_healthy:
            await _maybe_create_incident(db, service)


async def _maybe_create_incident(db: Session, service: Service):
    """Checks recent consecutive failures and auto-creates an incident if the threshold is hit."""
    recent_checks = db.exec(
        select(ServiceCheck)
        .where(ServiceCheck.service_id == service.id)
        .order_by(ServiceCheck.checked_at.desc())
        .limit(FAILURE_THRESHOLD)
    ).all()

    if len(recent_checks) < FAILURE_THRESHOLD:
        return  # not enough history yet

    if not all(not c.is_healthy for c in recent_checks):
        return  # not consecutive failures — a recent success breaks the streak

    # Don't create a duplicate incident if one is already open for this service.
    existing_open = db.exec(
        select(Incident).where(
            Incident.service_id == service.id,
            Incident.status.in_([
                IncidentStatus.triggered,
                IncidentStatus.acknowledged,
                IncidentStatus.investigating,
                IncidentStatus.mitigated,
            ]),
        )
    ).first()
    if existing_open:
        return

    incident = Incident(
        organization_id=service.organization_id,
        service_id=service.id,
        title=f"{service.name} is down",
        description=f"Automatically created after {FAILURE_THRESHOLD} consecutive failed health checks.",
        severity=IncidentSeverity.sev1,
        status=IncidentStatus.triggered,
        created_by=None,  # None = system-generated, per your original schema design
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    event = IncidentEvent(
        incident_id=incident.id,
        actor_id=None,
        event_type=IncidentEventType.created,
        event_metadata={"reason": "auto-created by health check", "consecutive_failures": FAILURE_THRESHOLD},
    )
    db.add(event)
    db.commit()

    await manager.broadcast(service.organization_id, {
        "type": "incident.created",
        "incident_id": str(incident.id),
        "title": incident.title,
        "severity": incident.severity.value,
        "status": incident.status.value,
        "auto_created": True,
    })


async def run_all_health_checks():
    """Called on a schedule — checks every service, respecting each one's own interval."""
    with Session(engine) as db:
        services = db.exec(select(Service)).all()

    # Run all checks concurrently rather than one-by-one — a slow/timing-out
    # service shouldn't delay checks for every other service.
    await asyncio.gather(*(check_one_service(s.id) for s in services))