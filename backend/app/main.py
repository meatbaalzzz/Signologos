"""Signologos Backend - FastAPI Application Entry Point.

The main application that brings together REST API routes,
WebSocket signaling, database connections, and CORS config.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.rooms import router as rooms_router
from app.api.websocket.signaling import router as signaling_router
from app.db.session import engine
from app.db.base import Base
from app.core.redis import get_redis, close_redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    # Startup
    logger.info("Starting Signologos backend...")

    # Create database tables (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

    # Initialize Redis
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis not available: {e} — running without Redis")

    logger.info(f"Signologos backend ready on {settings.HOST}:{settings.PORT}")

    yield

    # Shutdown
    logger.info("Shutting down Signologos backend...")
    await close_redis()
    await engine.dispose()
    logger.info("Cleanup complete")


# Create FastAPI application
app = FastAPI(
    title="Signologos",
    description="La palabra hecha signo — API for real-time sign language video conferencing",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware — required for frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(rooms_router)
app.include_router(signaling_router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Signologos API",
        "version": "0.1.0",
        "description": "La palabra hecha signo — Real-time sign language translation",
        "docs": "/docs",
    }
