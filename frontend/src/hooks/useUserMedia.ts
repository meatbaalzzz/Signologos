/**
 * Signologos — useUserMedia hook.
 *
 * Manages the local media stream (camera + microphone).
 * Uses refs for MediaStream to avoid unnecessary re-renders.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseUserMediaReturn {
    localStream: MediaStream | null;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    cameraOn: boolean;
    micOn: boolean;
    error: string | null;
    isLoading: boolean;
    startMedia: () => Promise<void>;
    stopMedia: () => void;
    toggleCamera: () => void;
    toggleMic: () => void;
}

export function useUserMedia(): UseUserMediaReturn {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [, setStreamReady] = useState(false); // Force re-render when stream is ready

    const startMedia = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;
            setStreamReady(true);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            const message =
                err instanceof DOMException
                    ? err.name === 'NotAllowedError'
                        ? 'Camera/microphone permission denied. Please allow access.'
                        : err.name === 'NotFoundError'
                            ? 'No camera or microphone found.'
                            : `Media error: ${err.message}`
                    : 'Failed to access media devices.';
            setError(message);
            console.error('getUserMedia error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stopMedia = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setStreamReady(false);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOn(videoTrack.enabled);
            }
        }
    }, []);

    const toggleMic = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMedia();
        };
    }, [stopMedia]);

    return {
        localStream: streamRef.current,
        localVideoRef,
        cameraOn,
        micOn,
        error,
        isLoading,
        startMedia,
        stopMedia,
        toggleCamera,
        toggleMic,
    };
}
