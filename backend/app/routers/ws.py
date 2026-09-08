import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlmodel import Session, select
from jose import JWTError

from app.db.session import get_db
from app.core.security import decode_access_token
from app.core.ws_manager import manager
from app.models.user import User, OrganizationMember

router = APIRouter()


@router.websocket("/ws/organizations/{organization_id}")
async def organization_ws(
    websocket: WebSocket,
    organization_id: uuid.UUID,
    token: str = Query(...),
):
    # IMPORTANT: you must accept() the connection before you can close() it
    # with a meaningful custom code. Closing pre-accept doesn't complete the
    # WS handshake, so the browser just sees an abnormal closure (code 1006)
    # instead of the 4401/4403 you actually intended to send.
    await websocket.accept()

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        try:
            payload = decode_access_token(token)
            user_id = uuid.UUID(payload.get("sub"))
        except (JWTError, ValueError, TypeError):
            await websocket.close(code=4401)  # invalid/expired token
            return

        user = db.get(User, user_id)
        if not user or not user.is_active:
            await websocket.close(code=4401)
            return

        membership = db.exec(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user.id,
            )
        ).first()
        if not membership:
            await websocket.close(code=4403)  # not a member of this org
            return

        manager.register(organization_id, websocket)  # connection already accepted above
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(organization_id, websocket)
    finally:
        db.close()