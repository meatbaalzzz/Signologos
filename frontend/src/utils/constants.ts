/**
 * Signologos — Application constants and configuration.
 */

/** API base URL (from env or default) */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** WebSocket base URL */
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

/** STUN server for WebRTC */
export const STUN_SERVER = import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302';

/** Default ICE servers (fallback if not provided by API) */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: STUN_SERVER },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/** Sign detection settings */
export const SIGN_DETECTION = {
    /** Minimum confidence to accept a prediction */
    CONFIDENCE_THRESHOLD: 0.7,
    /** How many consecutive frames of the same letter to confirm */
    CONFIRMATION_FRAMES: 3,
    /** Debounce time between confirmed letters (ms) */
    DEBOUNCE_MS: 300,
    /** FPS for detection loop */
    TARGET_FPS: 15,
};

/** Speech recognition settings */
export const SPEECH_RECOGNITION = {
    /** Language for Web Speech API */
    LANGUAGE: 'en-US',
    /** Continuous recognition mode */
    CONTINUOUS: true,
    /** Show interim results */
    INTERIM_RESULTS: true,
};

/** ASL alphabet label mapping (index → letter) */
export const ASL_LABELS: Record<number, string> = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E',
    5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
    10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O',
    15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T',
    20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y',
    25: 'Z', 26: 'DEL', 27: 'NOTHING', 28: 'SPACE',
};

/** WebSocket reconnection settings */
export const WS_RECONNECT = {
    MAX_RETRIES: 10,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
};
