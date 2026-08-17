/**
 * Signologos — Call Page.
 *
 * The main video conferencing page that integrates:
 * - WebRTC P2P video/audio
 * - Sign language detection (signer role)
 * - Speech recognition (speaker role)
 * - Translation panel
 * - Media controls
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useCallStore } from '../stores/callStore';
import { useTranslationStore } from '../stores/translationStore';
import { useUserMedia } from '../hooks/useUserMedia';
import { useSignaling } from '../hooks/useSignaling';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSignDetection } from '../hooks/useSignDetection';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { toast } from '../components/common/Toast';
import type { WSMessage, TranslationEntry } from '../types';
import '../styles/videocall.css';

export default function CallPage() {
    const navigate = useNavigate();
    const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
    const callStore = useCallStore();
    const translationStore = useTranslationStore();
    const [showPanel, setShowPanel] = useState(true);
    const remotePeerWasNull = useRef(true);
    const detectionLetterRef = useRef<HTMLDivElement>(null);
    const translationPanelBodyRef = useRef<HTMLDivElement>(null);

    const { role, userId, iceServers, roomCode } = callStore;
    const effectiveRoomCode = urlRoomCode || roomCode;

    // If no room info, redirect to lobby
    useEffect(() => {
        if (!roomCode && !urlRoomCode) {
            navigate('/lobby');
        }
    }, [roomCode, urlRoomCode, navigate]);

    // Media
    const media = useUserMedia();

    // Sign detection (signer only)
    const signDetection = useSignDetection();

    // Speech recognition (speaker only)
    const speechRecognition = useSpeechRecognition();

    // Speech synthesis (speaker only — to play sign translations)
    const speechSynthesis = useSpeechSynthesis();

    // Handle incoming signaling messages
    const handleSignalingMessage = useCallback(
        (message: WSMessage) => {
            // WebRTC signaling messages
            if (['webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate'].includes(message.type)) {
                webrtc.handleSignalingMessage(message);
            }

            // Peer events
            if (message.type === 'peer_joined') {
                const peerRole = message.role as string;
                callStore.setRemotePeer({
                    user_id: message.user_id as string,
                    role: peerRole as any,
                });
                toast.success(
                    peerRole === 'signer'
                        ? '🤟 Participante (Señas) se ha unido'
                        : '🗣️ Participante (Voz) se ha unido'
                );
                // If we're the one who was already here, create the offer
                if (media.localStream) {
                    webrtc.addLocalStream(media.localStream);
                    webrtc.createOffer();
                }
            }

            if (message.type === 'peer_left') {
                callStore.setRemotePeer(null);
                callStore.setConnected(false);
                toast.warning('El otro participante ha abandonado la sala');
            }

            if (message.type === 'peer_list') {
                const peers = message.peers as any[];
                if (peers && peers.length > 0) {
                    callStore.setRemotePeer(peers[0]);
                }
            }

            // Translation messages
            if (message.type === 'sign_translation') {
                const text = message.text as string;
                const entry: TranslationEntry = {
                    id: crypto.randomUUID(),
                    direction: 'sign_to_speech',
                    text,
                    timestamp: new Date(),
                };
                translationStore.addTranslation(entry);
                translationStore.setLatestReceived(entry);

                // If I'm the speaker, play the text as audio
                if (role === 'speaker') {
                    speechSynthesis.speak(text);
                }
            }

            if (message.type === 'speech_translation') {
                const text = message.text as string;
                const entry: TranslationEntry = {
                    id: crypto.randomUUID(),
                    direction: 'speech_to_sign',
                    text,
                    timestamp: new Date(),
                };
                translationStore.addTranslation(entry);
                translationStore.setLatestReceived(entry);
            }
        },
        [callStore, translationStore, media.localStream, role, speechSynthesis]
    );

    // Signaling
    const signaling = useSignaling(effectiveRoomCode, userId, role, handleSignalingMessage);

    // WebRTC
    const webrtc = useWebRTC(signaling.sendMessage, callStore.remotePeer?.user_id || null, {
        iceServers,
    });

    // Start media and connect on mount
    useEffect(() => {
        media.startMedia();
        signaling.connect();

        return () => {
            signaling.disconnect();
            webrtc.close();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Add local stream to WebRTC when ready
    useEffect(() => {
        if (media.localStream && callStore.remotePeer) {
            webrtc.addLocalStream(media.localStream);
        }
    }, [media.localStream, callStore.remotePeer]); // eslint-disable-line react-hooks/exhaustive-deps

    // Track connection state
    useEffect(() => {
        callStore.setConnected(webrtc.connectionState === 'connected');
    }, [webrtc.connectionState]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── GSAP: Animate remote video container when peer joins ──
    useEffect(() => {
        if (callStore.remotePeer && remotePeerWasNull.current) {
            remotePeerWasNull.current = false;
            // Slide the remote video container in
            gsap.fromTo('.remote-video-container', {
                scale: 0.95,
                opacity: 0,
            }, {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            });
            // Slide translation panel in from right
            gsap.fromTo('.translation-panel', {
                x: 40,
                opacity: 0,
            }, {
                x: 0,
                opacity: 1,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.2,
            });
        } else if (!callStore.remotePeer) {
            remotePeerWasNull.current = true;
        }
    }, [callStore.remotePeer]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── GSAP: Pulse the detection letter overlay when a letter is confirmed ──
    useEffect(() => {
        if (signDetection.currentLetter && detectionLetterRef.current) {
            gsap.fromTo(detectionLetterRef.current, {
                scale: 1.15,
                boxShadow: '0 0 20px hsla(170, 80%, 50%, 0.6)',
            }, {
                scale: 1,
                boxShadow: '0 0 0px hsla(170, 80%, 50%, 0)',
                duration: 0.35,
                ease: 'power2.out',
            });
        }
    }, [signDetection.accumulatedText]); // fires when a letter is confirmed

    // ── GSAP: Animate new translation entries sliding in ──
    useEffect(() => {
        const entries = document.querySelectorAll('.translation-entry');
        if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1] as HTMLElement;
            gsap.fromTo(lastEntry, {
                y: 20,
                opacity: 0,
            }, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
            });
            // Scroll the panel to bottom
            if (translationPanelBodyRef.current) {
                translationPanelBodyRef.current.scrollTop = translationPanelBodyRef.current.scrollHeight;
            }
        }
    }, [translationStore.translations.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Signer: Camera toggle → start/stop sign detection ──
    const handleCameraToggle = useCallback(() => {
        if (media.cameraOn && role === 'signer') {
            // Camera turning OFF → stop detection and send text
            const text = signDetection.stopDetection();
            if (text) {
                signaling.sendMessage({
                    type: 'sign_translation',
                    text,
                    user_id: userId,
                });
                translationStore.addTranslation({
                    id: crypto.randomUUID(),
                    direction: 'sign_to_speech',
                    text,
                    timestamp: new Date(),
                });
            }
        }

        media.toggleCamera();

        // Camera turning ON → start detection (next tick)
        if (!media.cameraOn && role === 'signer' && media.localVideoRef.current) {
            setTimeout(() => {
                if (media.localVideoRef.current) {
                    signDetection.startDetection(media.localVideoRef.current);
                }
            }, 500);
        }
    }, [media, role, signDetection, signaling, userId, translationStore]);

    // ── Speaker: Mic toggle → start/stop speech recognition ──
    const handleMicToggle = useCallback(() => {
        if (media.micOn && role === 'speaker') {
            // Mic turning OFF → stop recognition and send text
            const text = speechRecognition.stop();
            if (text) {
                signaling.sendMessage({
                    type: 'speech_translation',
                    text,
                    user_id: userId,
                });
                translationStore.addTranslation({
                    id: crypto.randomUUID(),
                    direction: 'speech_to_sign',
                    text,
                    timestamp: new Date(),
                });
                speechRecognition.reset();
            }
        }

        media.toggleMic();

        // Mic turning ON → start recognition (next tick)
        if (!media.micOn && role === 'speaker') {
            setTimeout(() => {
                speechRecognition.start();
            }, 300);
        }
    }, [media, role, speechRecognition, signaling, userId, translationStore]);

    // Start signer detection when camera starts
    const localVideoRefCallback = useCallback(
        (el: HTMLVideoElement | null) => {
            (media.localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
            if (el && media.localStream) {
                el.srcObject = media.localStream;
            }
        },
        [media.localStream, media.localVideoRef]
    );

    // Hang up
    const handleHangUp = useCallback(() => {
        webrtc.close();
        media.stopMedia();
        signaling.disconnect();
        callStore.reset();
        translationStore.reset();
        navigate('/');
    }, [webrtc, media, signaling, callStore, translationStore, navigate]);

    // Connection status display
    const statusText =
        signaling.connectionStatus === 'connected'
            ? callStore.remotePeer
                ? webrtc.connectionState === 'connected'
                    ? 'Conectado'
                    : 'Estableciendo conexión...'
                : 'Esperando participante...'
            : signaling.connectionStatus === 'connecting'
                ? 'Conectando...'
                : 'Desconectado';

    const statusClass =
        webrtc.connectionState === 'connected'
            ? 'connected'
            : signaling.connectionStatus === 'connected'
                ? 'connecting'
                : 'disconnected';

    return (
        <div className="call-page">
            {/* Header */}
            <header className="call-header">
                <div className="call-header-left">
                    <span style={{ fontSize: 'var(--text-lg)' }}>🤟</span>
                    <span className="call-room-code">{effectiveRoomCode}</span>
                    <div className="call-status">
                        <span className={`call-status-dot call-status-dot--${statusClass}`} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                            {statusText}
                        </span>
                    </div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Rol: {role === 'signer' ? '🤟 Señas' : '🗣️ Voz'}
                </div>
            </header>

            {/* Main content */}
            <div className="call-content">
                {/* Video area */}
                <div className="video-area">
                    {/* Remote video */}
                    <div className="remote-video-container">
                        <video
                            ref={webrtc.remoteVideoRef}
                            className="remote-video"
                            autoPlay
                            playsInline
                        />
                        {!callStore.remotePeer && (
                            <div className="remote-video-placeholder">
                                <div className="remote-video-placeholder-icon">👤</div>
                                <div className="remote-video-placeholder-text">
                                    Esperando a que se conecte el otro participante...
                                </div>
                                <div className="remote-video-placeholder-text" style={{ fontSize: 'var(--text-xs)' }}>
                                    Comparte el código <strong>{effectiveRoomCode}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local video (PiP) */}
                    <div className="local-video-container">
                        {media.cameraOn ? (
                            <video
                                ref={localVideoRefCallback}
                                className="local-video"
                                autoPlay
                                playsInline
                                muted
                            />
                        ) : (
                            <div className="local-video-off">📷</div>
                        )}
                    </div>

                    {/* Signer: Detection overlay */}
                    {role === 'signer' && media.cameraOn && (
                        <div className="detection-overlay">
                            {signDetection.currentLetter && (
                                <div className="detection-letter" ref={detectionLetterRef}>
                                    <span className="detection-letter-char">
                                        {signDetection.currentLetter}
                                    </span>
                                    <div>
                                        <div className="detection-confidence">
                                            {Math.round(signDetection.currentConfidence * 100)}%
                                        </div>
                                        <div className="detection-confidence-bar">
                                            <div
                                                className="detection-confidence-fill"
                                                style={{
                                                    width: `${signDetection.currentConfidence * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {signDetection.accumulatedText && (
                                <div className="detection-accumulated">
                                    <div className="detection-accumulated-label">Texto detectado:</div>
                                    {signDetection.accumulatedText}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Speaker: Speech overlay */}
                    {role === 'speaker' && media.micOn && speechRecognition.isListening && (
                        <div className="speech-overlay">
                            <div className="speech-indicator">
                                <span className="speech-indicator-dot" />
                                Escuchando...
                            </div>
                            <div className="speech-text">
                                {speechRecognition.accumulatedText}
                                <span className="speech-interim">
                                    {speechRecognition.interimText}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Model loading indicator */}
                    {role === 'signer' && !signDetection.isModelReady && (
                        <div className="model-loading-overlay">
                            <div className="spinner" />
                            {signDetection.modelLoadingProgress || 'Cargando modelos de IA...'}
                        </div>
                    )}
                </div>

                {/* Translation panel */}
                {showPanel && (
                    <div className="translation-panel">
                        <div className="translation-panel-header">
                            📝 Traducciones
                        </div>
                        <div className="translation-panel-body" ref={translationPanelBodyRef}>
                            {translationStore.translations.length === 0 ? (
                                <div className="translation-empty">
                                    Las traducciones aparecerán aquí cuando
                                    {role === 'signer'
                                        ? ' apagues la cámara después de hacer señas'
                                        : ' apagues el micrófono después de hablar'}
                                </div>
                            ) : (
                                translationStore.translations.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`translation-entry translation-entry--${entry.direction === 'sign_to_speech' ? 'sign' : 'speech'
                                            }`}
                                    >
                                        <div className="translation-entry-header">
                                            <span
                                                className="translation-entry-role"
                                                style={{
                                                    color:
                                                        entry.direction === 'sign_to_speech'
                                                            ? 'var(--accent-primary)'
                                                            : 'var(--accent-secondary)',
                                                }}
                                            >
                                                {entry.direction === 'sign_to_speech'
                                                    ? '🤟 Señas'
                                                    : '🗣️ Voz'}
                                            </span>
                                            <span className="translation-entry-time">
                                                {entry.timestamp.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div className="translation-entry-text">{entry.text}</div>

                                        {/* Sign display for signer receiving speech */}
                                        {role === 'signer' && entry.direction === 'speech_to_sign' && (
                                            <div className="sign-display">
                                                <div className="sign-display-header">
                                                    Traducción a señas:
                                                </div>
                                                <div className="sign-images-grid">
                                                    {entry.text
                                                        .toUpperCase()
                                                        .split('')
                                                        .map((char, i) =>
                                                            char === ' ' ? (
                                                                <div key={i} className="sign-space" />
                                                            ) : /[A-Z]/.test(char) ? (
                                                                <img
                                                                    key={i}
                                                                    src={`/signs/${char}.png`}
                                                                    alt={`Seña: ${char}`}
                                                                    className="sign-image"
                                                                    style={{
                                                                        animationDelay: `${i * 0.08}s`,
                                                                    }}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : null
                                                        )}
                                                </div>
                                                <div className="sign-text-below">{entry.text}</div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="controls-bar">
                <button
                    id="btn-toggle-mic"
                    className={`control-btn ${media.micOn ? 'control-btn--active' : 'control-btn--muted'}`}
                    onClick={handleMicToggle}
                    title={media.micOn ? 'Silenciar micrófono' : 'Activar micrófono'}
                >
                    {media.micOn ? '🎤' : '🔇'}
                    <span className="control-btn-label">
                        {media.micOn ? 'Mic ON' : 'Mic OFF'}
                    </span>
                </button>

                <button
                    id="btn-toggle-camera"
                    className={`control-btn ${media.cameraOn ? 'control-btn--active' : 'control-btn--muted'}`}
                    onClick={handleCameraToggle}
                    title={media.cameraOn ? 'Apagar cámara' : 'Encender cámara'}
                >
                    {media.cameraOn ? '📹' : '📷'}
                    <span className="control-btn-label">
                        {media.cameraOn ? 'Cam ON' : 'Cam OFF'}
                    </span>
                </button>

                <button
                    id="btn-toggle-panel"
                    className={`control-btn control-btn--active`}
                    onClick={() => setShowPanel(!showPanel)}
                    title="Panel de traducciones"
                >
                    📝
                    <span className="control-btn-label">Panel</span>
                </button>

                <button
                    id="btn-hangup"
                    className="control-btn control-btn--hangup"
                    onClick={handleHangUp}
                    title="Colgar"
                >
                    📞
                    <span className="control-btn-label">Colgar</span>
                </button>
            </div>
        </div>
    );
}
