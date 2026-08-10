/**
 * Signologos — useSignaling hook.
 *
 * Manages WebSocket connection to the signaling server.
 * Handles reconnection with exponential backoff.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { WS_URL, WS_RECONNECT } from '../utils/constants';
import type { WSMessage } from '../types';

interface UseSignalingReturn {
    sendMessage: (message: WSMessage | Record<string, unknown>) => void;
    lastMessage: WSMessage | null;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    connect: () => void;
    disconnect: () => void;
}

export function useSignaling(
    roomId: string,
    userId: string,
    role: string,
    onMessage?: (message: WSMessage) => void
): UseSignalingReturn {
    const wsRef = useRef<WebSocket | null>(null);
    const retriesRef = useRef(0);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        'connecting' | 'connected' | 'disconnected' | 'error'
    >('disconnected');

    const startHeartbeat = useCallback(() => {
        heartbeatRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!roomId || !userId) return;

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        setConnectionStatus('connecting');

        const wsUrl = `${WS_URL}/ws/${roomId}/${userId}?role=${role}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnectionStatus('connected');
            retriesRef.current = 0;
            startHeartbeat();
            console.log(`[Signaling] Connected to room ${roomId}`);

            // Request peer list
            ws.send(JSON.stringify({ type: 'get_peers' }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WSMessage;

                // Ignore pong heartbeats
                if (message.type === 'pong') return;

                setLastMessage(message);
                onMessageRef.current?.(message);
            } catch (err) {
                console.error('[Signaling] Failed to parse message:', err);
            }
        };

        ws.onclose = (event) => {
            setConnectionStatus('disconnected');
            stopHeartbeat();
            console.log(`[Signaling] Disconnected (code: ${event.code})`);

            // Auto-reconnect with exponential backoff
            if (!event.wasClean && retriesRef.current < WS_RECONNECT.MAX_RETRIES) {
                const delay = Math.min(
                    WS_RECONNECT.BASE_DELAY_MS * Math.pow(2, retriesRef.current),
                    WS_RECONNECT.MAX_DELAY_MS
                );
                retriesRef.current++;
                console.log(`[Signaling] Reconnecting in ${delay}ms (attempt ${retriesRef.current})`);
                setTimeout(connect, delay);
            }
        };

        ws.onerror = () => {
            setConnectionStatus('error');
            console.error('[Signaling] WebSocket error');
        };
    }, [roomId, userId, role, startHeartbeat, stopHeartbeat]);

    const disconnect = useCallback(() => {
        retriesRef.current = WS_RECONNECT.MAX_RETRIES; // Prevent reconnection
        stopHeartbeat();
        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }
        setConnectionStatus('disconnected');
    }, [stopHeartbeat]);

    const sendMessage = useCallback((message: WSMessage | Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('[Signaling] Cannot send — WebSocket not open');
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        sendMessage,
        lastMessage,
        connectionStatus,
        connect,
        disconnect,
    };
}
