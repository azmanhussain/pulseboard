import uuid
import json
from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    """
    Tracks active WebSocket connections grouped by organization_id.
    In-memory only — fine for a single backend instance. If you ever run
    multiple backend instances behind a load balancer, this breaks (instance A
    can't push to a client connected to instance B) — that's exactly the
    problem Redis pub/sub solves, and is worth mentioning as the "how would
    you scale this" answer even if you don't implement it.
    """
    
    def __init__(self):
        self._connections: Dict[uuid.UUID, Set[WebSocket]] = {}
        
    def register(self, organization_id: uuid.UUID, websocket: WebSocket):
        # Connection is already accepted by the route handler before this is called
        # (accept() has to happen before any auth-failure close() can send a real code).
        self._connections.setdefault(organization_id, set()).add(websocket)
        
    def disconnect(self, organization_id: uuid.UUID, websocket: WebSocket):
        connections = self._connections.get(organization_id)
        if connections:
            connections.discard(websocket)
            if not connections:
                del self._connections[organization_id]
                
    async def broadcast(self, organization_id: uuid.UUID, message: dict):
        connections = self._connections.get(organization_id, set())
        dead: Set[WebSocket] = set()
        for ws in connections:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.add(ws)  # connection dropped without a clean close
        for ws in dead:
            connections.discard(ws)
            
manager = ConnectionManager()
