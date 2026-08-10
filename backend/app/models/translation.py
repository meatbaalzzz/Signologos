"""Signologos Backend - Translation log SQLAlchemy model."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class TranslationLog(Base):
    """Logs translations for analytics and session history."""

    __tablename__ = "translation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    direction = Column(String(20), nullable=False)  # 'sign_to_speech' | 'speech_to_sign'
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
