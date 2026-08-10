/**
 * Signologos — TypeScript type definitions.
 */

/** User roles in a video call */
export type UserRole = 'speaker' | 'signer';

/** Room info from the API */
export interface RoomInfo {
    id: string;
    code: string;
    created_at: string;
    expires_at: string;
    is_active: boolean;
    speaker_user_id: string | null;
    signer_user_id: string | null;
    participant_count: number;
    is_full: boolean;
}

/** Response from creating a room */
export interface RoomCreatedResponse {
    id: string;
    code: string;
    message: string;
}

/** Response from joining a room */
export interface JoinRoomResponse {
    room_id: string;
    code: string;
    role: UserRole;
    user_id: string;
    message: string;
    ice_servers: RTCIceServer[];
}

/** WebSocket message types */
export type WSMessageType =
    | 'webrtc_offer'
    | 'webrtc_answer'
    | 'webrtc_ice_candidate'
    | 'peer_joined'
    | 'peer_left'
    | 'peer_list'
    | 'sign_translation'
    | 'speech_translation'
    | 'ping'
    | 'pong'
    | 'error'
    | 'get_peers';

/** Base WebSocket message */
export interface WSMessage {
    type: WSMessageType;
    [key: string]: unknown;
}

/** Peer info */
export interface PeerInfo {
    user_id: string;
    role: UserRole;
}

/** Translation entry for the history panel */
export interface TranslationEntry {
    id: string;
    direction: 'sign_to_speech' | 'speech_to_sign';
    text: string;
    timestamp: Date;
}

/** Sign detection result */
export interface SignDetectionResult {
    letter: string;
    confidence: number;
    timestamp: number;
}

/** Call state */
export interface CallState {
    roomCode: string;
    userId: string;
    role: UserRole;
    iceServers: RTCIceServer[];
    isConnected: boolean;
    remotePeer: PeerInfo | null;
}

/** Media state */
export interface MediaState {
    cameraOn: boolean;
    micOn: boolean;
    screenSharing: boolean;
}
