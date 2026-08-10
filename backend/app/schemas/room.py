"""Signologos Backend - Pydantic schemas for Room API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    """Request schema for creating a room (no body needed)."""
    pass


class RoomResponse(BaseModel):
    """Response schema for room info."""
    id: UUID
    code: str
    created_at: datetime
    expires_at: datetime
    is_active: bool
    speaker_user_id: str | None = None
    signer_user_id: str | None = None
    participant_count: int
    is_full: bool

    model_config = {"from_attributes": True}


class RoomCreatedResponse(BaseModel):
    """Response after creating a new room."""
    id: UUID
    code: str
    message: str = "Room created successfully"


class JoinRoomRequest(BaseModel):
    """Request schema for joining a room."""
    role: str = Field(..., pattern="^(speaker|signer)$", description="Role: 'speaker' or 'signer'")
    user_id: str = Field(..., min_length=1, max_length=36, description="Client-generated user ID")


class JoinRoomResponse(BaseModel):
    """Response after joining a room."""
    room_id: UUID
    code: str
    role: str
    user_id: str
    message: str

    # WebRTC config to pass to the client
    ice_servers: list[dict] = []
