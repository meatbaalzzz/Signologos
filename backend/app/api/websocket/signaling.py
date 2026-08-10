"""Signologos Backend - WebSocket signaling endpoint."""

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.connection_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()

# Message types that should be relayed directly to a target user
RELAY_TYPES = {
    "webrtc_offer",
    "webrtc_answer",
    "webrtc_ice_candidate",
}

# Message types that should be broadcast to the room (except sender)
BROADCAST_TYPES = {
    "sign_translation",
    "speech_translation",
}


@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    user_id: str,
    role: str = Query(default="unknown"),
):
    """WebSocket endpoint for WebRTC signaling and translation messages.

    URL format: /ws/{room_id}/{user_id}?role=speaker|signer
    """
    await manager.connect(room_id, user_id, role, websocket)

    try:
        while True:
            # Receive JSON messages from the client
            raw_data = await websocket.receive_text()

            try:
                message = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {user_id}: {raw_data[:100]}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                })
                continue

            msg_type = message.get("type")

            if not msg_type:
                await websocket.send_json({
                    "type": "error",
                    "message": "Missing 'type' field",
                })
                continue

            # Add sender info
            message["sender_id"] = user_id
            message["sender_role"] = manager.get_user_role(user_id)

            if msg_type in RELAY_TYPES:
                # Relay WebRTC signaling to the specific target user
                target_id = message.get("target_user_id")
                if target_id:
                    sent = await manager.send_to_user(room_id, target_id, message)
                    if not sent:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Target user {target_id} not found in room",
                        })
                else:
                    # If no target, broadcast to all others (for 1:1 this works)
                    await manager.broadcast_to_room(room_id, message, exclude_user=user_id)

            elif msg_type in BROADCAST_TYPES:
                # Broadcast translation to all other users in the room
                await manager.broadcast_to_room(room_id, message, exclude_user=user_id)

            elif msg_type == "ping":
                # Heartbeat
                await websocket.send_json({"type": "pong"})

            elif msg_type == "get_peers":
                # Request list of connected peers
                peers = manager.get_room_users(room_id)
                await websocket.send_json({
                    "type": "peer_list",
                    "peers": [p for p in peers if p["user_id"] != user_id],
                })

            else:
                logger.warning(f"Unknown message type '{msg_type}' from {user_id}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}",
                })

    except WebSocketDisconnect:
        await manager.disconnect(room_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for {user_id} in room {room_id}: {e}")
        await manager.disconnect(room_id, user_id)
