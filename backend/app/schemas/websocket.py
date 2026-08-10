"""Signologos Backend - Pydantic schemas for WebSocket messages."""

from pydantic import BaseModel
from typing import Any


class WSMessage(BaseModel):
    """Base WebSocket message."""
    type: str
    data: dict[str, Any] = {}


class WebRTCOffer(BaseModel):
    type: str = "webrtc_offer"
    offer: dict
    target_user_id: str


class WebRTCAnswer(BaseModel):
    type: str = "webrtc_answer"
    answer: dict
    target_user_id: str


class WebRTCIceCandidate(BaseModel):
    type: str = "webrtc_ice_candidate"
    candidate: dict
    target_user_id: str


class PeerJoined(BaseModel):
    type: str = "peer_joined"
    user_id: str
    role: str  # 'speaker' | 'signer'


class PeerLeft(BaseModel):
    type: str = "peer_left"
    user_id: str


class SignTranslation(BaseModel):
    """Sent by signer when camera turns off — contains accumulated text."""
    type: str = "sign_translation"
    text: str
    user_id: str = ""


class SpeechTranslation(BaseModel):
    """Sent by speaker when mic turns off — contains accumulated text."""
    type: str = "speech_translation"
    text: str
    user_id: str = ""
