"""Signologos Backend - Room SQLAlchemy model."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.config import settings
from app.db.base import Base


class Room(Base):
    """Represents a video conference room."""

    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(8), unique=True, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(hours=settings.ROOM_EXPIRY_HOURS),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)

    # User IDs (set when users join with a role)
    speaker_user_id = Column(String(36), nullable=True)
    signer_user_id = Column(String(36), nullable=True)

    @property
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def is_full(self) -> bool:
        return self.speaker_user_id is not None and self.signer_user_id is not None

    @property
    def participant_count(self) -> int:
        count = 0
        if self.speaker_user_id:
            count += 1
        if self.signer_user_id:
            count += 1
        return count
