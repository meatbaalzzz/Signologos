"""Signologos Backend - Room business logic service."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_room_code
from app.models.room import Room


class RoomService:
    """Handles room creation, lookup, and joining logic."""

    @staticmethod
    async def create_room(db: AsyncSession) -> Room:
        """Create a new room with a unique code."""
        # Generate unique code (retry if collision)
        for _ in range(10):
            code = generate_room_code()
            existing = await db.execute(select(Room).where(Room.code == code))
            if existing.scalar_one_or_none() is None:
                break
        else:
            raise ValueError("Could not generate unique room code after 10 attempts")

        room = Room(code=code)
        db.add(room)
        await db.flush()
        return room

    @staticmethod
    async def get_room_by_code(db: AsyncSession, code: str) -> Room | None:
        """Find an active, non-expired room by its code."""
        result = await db.execute(
            select(Room).where(
                Room.code == code.upper(),
                Room.is_active == True,
            )
        )
        room = result.scalar_one_or_none()

        if room and room.is_expired:
            room.is_active = False
            await db.flush()
            return None

        return room

    @staticmethod
    async def join_room(
        db: AsyncSession, code: str, role: str, user_id: str
    ) -> Room:
        """Assign a user to a role in a room.

        Raises ValueError if the room doesn't exist, is full, or role is taken.
        """
        room = await RoomService.get_room_by_code(db, code)

        if room is None:
            raise ValueError("Room not found or expired")

        if role == "speaker":
            if room.speaker_user_id is not None:
                raise ValueError("Speaker role is already taken")
            room.speaker_user_id = user_id
        elif role == "signer":
            if room.signer_user_id is not None:
                raise ValueError("Signer role is already taken")
            room.signer_user_id = user_id
        else:
            raise ValueError(f"Invalid role: {role}")

        await db.flush()
        return room
