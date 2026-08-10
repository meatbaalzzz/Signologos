/**
 * Signologos — Call state store (Zustand).
 */

import { create } from 'zustand';
import type { UserRole, PeerInfo, CallState, MediaState } from '../types';

interface CallStore extends CallState, MediaState {
    // Setters
    setRoom: (roomCode: string, userId: string, role: UserRole, iceServers: RTCIceServer[]) => void;
    setConnected: (connected: boolean) => void;
    setRemotePeer: (peer: PeerInfo | null) => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    setScreenSharing: (sharing: boolean) => void;
    reset: () => void;
}

const initialState = {
    roomCode: '',
    userId: '',
    role: 'speaker' as UserRole,
    iceServers: [],
    isConnected: false,
    remotePeer: null,
    cameraOn: true,
    micOn: true,
    screenSharing: false,
};

export const useCallStore = create<CallStore>((set) => ({
    ...initialState,

    setRoom: (roomCode, userId, role, iceServers) =>
        set({ roomCode, userId, role, iceServers }),

    setConnected: (isConnected) => set({ isConnected }),

    setRemotePeer: (remotePeer) => set({ remotePeer }),

    toggleCamera: () => set((state) => ({ cameraOn: !state.cameraOn })),

    toggleMic: () => set((state) => ({ micOn: !state.micOn })),

    setScreenSharing: (screenSharing) => set({ screenSharing }),

    reset: () => set(initialState),
}));
