"""Signologos Backend - Security utilities."""

import secrets
import string
from app.config import settings


def generate_room_code(length: int | None = None) -> str:
    """Generate a random alphanumeric room code.

    Uses uppercase letters and digits, avoiding ambiguous characters
    (0/O, 1/I/L) for readability.
    """
    if length is None:
        length = settings.ROOM_CODE_LENGTH

    # Avoid ambiguous characters for better readability
    alphabet = string.ascii_uppercase + string.digits
    ambiguous = set("0OIL1")
    safe_chars = [c for c in alphabet if c not in ambiguous]

    return "".join(secrets.choice(safe_chars) for _ in range(length))
