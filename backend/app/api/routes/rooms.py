"""Signologos Backend - Room REST API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.schemas.room import (
    JoinRoomRequest,
    JoinRoomResponse,
    RoomCreatedResponse,
    RoomResponse,
)
from app.services.room_service import RoomService

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post(
    "",
    response_model=RoomCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_room(db: AsyncSession = Depends(get_db)):
    """Create a new video conference room."""
    try:
        room = await RoomService.create_room(db)
        return RoomCreatedResponse(id=room.id, code=room.code)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{code}", response_model=RoomResponse)
async def get_room(code: str, db: AsyncSession = Depends(get_db)):
    """Get room info by code."""
    room = await RoomService.get_room_by_code(db, code)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or expired",
        )

    return RoomResponse(
        id=room.id,
        code=room.code,
        created_at=room.created_at,
        expires_at=room.expires_at,
        is_active=room.is_active,
        speaker_user_id=room.speaker_user_id,
        signer_user_id=room.signer_user_id,
        participant_count=room.participant_count,
        is_full=room.is_full,
    )


@router.post("/{code}/join", response_model=JoinRoomResponse)
async def join_room(
    code: str,
    request: JoinRoomRequest,
    db: AsyncSession = Depends(get_db),
):
    """Join a room with a specific role (speaker or signer)."""
    try:
        room = await RoomService.join_room(db, code, request.role, request.user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Build ICE servers config for the client
    ice_servers = [
        {"urls": settings.STUN_SERVER},
        {"urls": "stun:stun1.l.google.com:19302"},
    ]

    if settings.TURN_SERVER_URL:
        ice_servers.append({
            "urls": settings.TURN_SERVER_URL,
            "username": settings.TURN_USERNAME,
            "credential": settings.TURN_PASSWORD,
        })

    return JoinRoomResponse(
        room_id=room.id,
        code=room.code,
        role=request.role,
        user_id=request.user_id,
        message=f"Joined room as {request.role}",
        ice_servers=ice_servers,
    )
