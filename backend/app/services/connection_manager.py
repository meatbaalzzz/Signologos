"""Signologos Backend - WebSocket Connection Manager."""

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by room.

    Handles connect/disconnect lifecycle and message routing between peers.
    In a multi-worker setup, Redis Pub/Sub would be layered on top.
    """

    def __init__(self):
        # room_id -> { user_id: WebSocket }
        self.active_connections: dict[str, dict[str, WebSocket]] = {}
        # user_id -> role mapping
        self.user_roles: dict[str, str] = {}

    async def connect(
        self, room_id: str, user_id: str, role: str, websocket: WebSocket
    ) -> None:
        """Accept a WebSocket connection and add it to the room."""
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}

        self.active_connections[room_id][user_id] = websocket
        self.user_roles[user_id] = role

        logger.info(f"User {user_id} ({role}) connected to room {room_id}")

        # Notify other users in the room
        await self.broadcast_to_room(
            room_id,
            {
                "type": "peer_joined",
                "user_id": user_id,
                "role": role,
            },
            exclude_user=user_id,
        )

    async def disconnect(self, room_id: str, user_id: str) -> None:
        """Remove a WebSocket connection from the room."""
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)

            # Clean up empty rooms
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        self.user_roles.pop(user_id, None)

        logger.info(f"User {user_id} disconnected from room {room_id}")

        # Notify remaining users
        await self.broadcast_to_room(
            room_id,
            {
                "type": "peer_left",
                "user_id": user_id,
            },
        )

    async def send_to_user(
        self, room_id: str, target_user_id: str, message: dict[str, Any]
    ) -> bool:
        """Send a message to a specific user in a room."""
        if room_id in self.active_connections:
            ws = self.active_connections[room_id].get(target_user_id)
            if ws:
                try:
                    await ws.send_json(message)
                    return True
                except Exception as e:
                    logger.error(f"Failed to send to {target_user_id}: {e}")
                    return False
        return False

    async def broadcast_to_room(
        self,
        room_id: str,
        message: dict[str, Any],
        exclude_user: str | None = None,
    ) -> None:
        """Broadcast a message to all users in a room, optionally excluding one."""
        if room_id not in self.active_connections:
            return

        disconnected = []
        for user_id, ws in self.active_connections[room_id].items():
            if user_id == exclude_user:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {user_id}: {e}")
                disconnected.append(user_id)

        # Clean up failed connections
        for user_id in disconnected:
            await self.disconnect(room_id, user_id)

    def get_room_users(self, room_id: str) -> list[dict[str, str]]:
        """Get list of users currently connected to a room."""
        if room_id not in self.active_connections:
            return []

        return [
            {"user_id": uid, "role": self.user_roles.get(uid, "unknown")}
            for uid in self.active_connections[room_id]
        ]

    def get_user_role(self, user_id: str) -> str | None:
        """Get the role of a user."""
        return self.user_roles.get(user_id)


# Singleton instance
manager = ConnectionManager()
