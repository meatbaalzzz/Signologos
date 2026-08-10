/**
 * Signologos — useWebRTC hook.
 *
 * Manages the RTCPeerConnection lifecycle for P2P video/audio.
 * Handles offer/answer exchange, ICE candidates, and stream management.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { DEFAULT_ICE_SERVERS } from '../utils/constants';
import type { WSMessage } from '../types';

interface UseWebRTCOptions {
    iceServers?: RTCIceServer[];
    onRemoteStream?: (stream: MediaStream) => void;
}

interface UseWebRTCReturn {
    remoteStream: MediaStream | null;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    connectionState: RTCPeerConnectionState | 'new';
    createOffer: () => Promise<void>;
    handleSignalingMessage: (message: WSMessage) => Promise<void>;
    addLocalStream: (stream: MediaStream) => void;
    close: () => void;
}

export function useWebRTC(
    sendSignaling: (msg: Record<string, unknown>) => void,
    targetUserId: string | null,
    options: UseWebRTCOptions = {}
): UseWebRTCReturn {
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | 'new'>('new');

    const { iceServers = DEFAULT_ICE_SERVERS, onRemoteStream } = options;
    const onRemoteStreamRef = useRef(onRemoteStream);
    onRemoteStreamRef.current = onRemoteStream;

    const getOrCreatePC = useCallback((): RTCPeerConnection => {
        if (pcRef.current && pcRef.current.connectionState !== 'closed') {
            return pcRef.current;
        }

        const pc = new RTCPeerConnection({
            iceServers,
            iceCandidatePoolSize: 10,
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignaling({
                    type: 'webrtc_ice_candidate',
                    candidate: event.candidate.toJSON(),
                    target_user_id: targetUserId || '',
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (stream) {
                setRemoteStream(stream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
                onRemoteStreamRef.current?.(stream);
            }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            setConnectionState(pc.connectionState);
            console.log(`[WebRTC] Connection state: ${pc.connectionState}`);

            if (pc.connectionState === 'failed') {
                // Attempt ICE restart
                console.log('[WebRTC] Connection failed, attempting ICE restart...');
                pc.restartIce();
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state: ${pc.iceConnectionState}`);
        };

        pcRef.current = pc;
        return pc;
    }, [iceServers, sendSignaling, targetUserId]);

    const addLocalStream = useCallback(
        (stream: MediaStream) => {
            const pc = getOrCreatePC();
            // Remove existing senders
            pc.getSenders().forEach((sender) => pc.removeTrack(sender));
            // Add new tracks
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
        },
        [getOrCreatePC]
    );

    const createOffer = useCallback(async () => {
        const pc = getOrCreatePC();

        try {
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);

            sendSignaling({
                type: 'webrtc_offer',
                offer: {
                    type: offer.type,
                    sdp: offer.sdp,
                },
                target_user_id: targetUserId || '',
            });

            console.log('[WebRTC] Offer created and sent');
        } catch (err) {
            console.error('[WebRTC] Failed to create offer:', err);
        }
    }, [getOrCreatePC, sendSignaling, targetUserId]);

    const handleSignalingMessage = useCallback(
        async (message: WSMessage) => {
            const pc = getOrCreatePC();

            try {
                switch (message.type) {
                    case 'webrtc_offer': {
                        const offer = message.offer as RTCSessionDescriptionInit;
                        await pc.setRemoteDescription(new RTCSessionDescription(offer));

                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        sendSignaling({
                            type: 'webrtc_answer',
                            answer: {
                                type: answer.type,
                                sdp: answer.sdp,
                            },
                            target_user_id: (message.sender_id as string) || '',
                        });

                        console.log('[WebRTC] Answer created and sent');
                        break;
                    }

                    case 'webrtc_answer': {
                        const answer = message.answer as RTCSessionDescriptionInit;
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        console.log('[WebRTC] Remote description set from answer');
                        break;
                    }

                    case 'webrtc_ice_candidate': {
                        const candidate = message.candidate as RTCIceCandidateInit;
                        if (candidate) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                        break;
                    }
                }
            } catch (err) {
                console.error(`[WebRTC] Error handling ${message.type}:`, err);
            }
        },
        [getOrCreatePC, sendSignaling]
    );

    const close = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setRemoteStream(null);
        setConnectionState('new');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            close();
        };
    }, [close]);

    return {
        remoteStream,
        remoteVideoRef,
        connectionState,
        createOffer,
        handleSignalingMessage,
        addLocalStream,
        close,
    };
}
