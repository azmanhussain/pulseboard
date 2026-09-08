from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.routers import auth, organizations, services, incidents, ws
from app.core.health_checker import run_all_health_checks
from app.core.idempotency import idempotency_middleware
from app.core.rate_limit import rate_limit_middleware

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs every 60 seconds — simplification vs. respecting each service's own
    # health_check_interval individually; fine for a portfolio project, and
    # worth explicitly naming as a simplification if asked in an interview.
    scheduler.add_job(run_all_health_checks, "interval", seconds=60, id="health_checks")
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="PulseBoard API", lifespan=lifespan)

app.middleware("http")(idempotency_middleware)
app.middleware("http")(rate_limit_middleware)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(services.router)
app.include_router(incidents.router)
app.include_router(ws.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}