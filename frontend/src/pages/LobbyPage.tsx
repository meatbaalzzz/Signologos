/**
 * Signologos — Lobby Page.
 *
 * Handles room creation, joining by code, and role selection.
 */

import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useCallStore } from '../stores/callStore';
import { toast } from '../components/common/Toast';
import type { UserRole } from '../types';
import '../styles/lobby.css';

type LobbyStep = 'choose' | 'create' | 'join' | 'role';

export default function LobbyPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setRoom = useCallStore((s) => s.setRoom);

    const initialAction = searchParams.get('action');
    const [step, setStep] = useState<LobbyStep>(
        initialAction === 'create' || initialAction === 'join' ? initialAction : 'choose'
    );
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate a client-side user ID
    const userId = useState(() => crypto.randomUUID())[0];

    const handleCreateRoom = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const room = await apiService.createRoom();
            setRoomCode(room.code);
            setStep('role');
            toast.success(`Sala ${room.code} creada. Comparte el código.`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create room';
            setError(msg);
            toast.error(`Error al crear la sala: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleJoinRoom = useCallback(async () => {
        if (joinCode.length < 4) {
            setError('Please enter a valid room code');
            toast.warning('Ingresa un código de sala válido');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const room = await apiService.getRoom(joinCode);
            if (room.is_full) {
                setError('This room is already full');
                toast.error('La sala ya está llena');
                return;
            }
            setRoomCode(joinCode.toUpperCase());
            setStep('role');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Room not found';
            setError(msg);
            toast.error(`Sala no encontrada: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    }, [joinCode]);

    const handleSelectRole = useCallback(
        async (role: UserRole) => {
            setSelectedRole(role);
            setIsLoading(true);
            setError('');
            try {
                const response = await apiService.joinRoom(roomCode, role, userId);
                setRoom(roomCode, userId, role, response.ice_servers);
                navigate(`/call/${roomCode}`);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to join room');
                setSelectedRole(null);
            } finally {
                setIsLoading(false);
            }
        },
        [roomCode, userId, setRoom, navigate]
    );

    const copyCode = useCallback(() => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        toast.info('Código copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    }, [roomCode]);

    return (
        <div className="lobby">
            <div className="bg-glow" />

            <button className="lobby-back" onClick={() => navigate('/')}>
                ← Volver al inicio
            </button>

            {/* Step: Choose action */}
            {step === 'choose' && (
                <div className="lobby-card glass-card">
                    <div className="lobby-logo">🤟</div>
                    <h2 className="lobby-title">
                        <span className="gradient-text">Signologos</span>
                    </h2>
                    <p className="lobby-subtitle">
                        Elige una opción para comenzar
                    </p>
                    <div className="lobby-form">
                        <button
                            id="lobby-create"
                            className="btn btn-primary btn-lg"
                            onClick={() => {
                                setStep('create');
                                handleCreateRoom();
                            }}
                        >
                            🎥 Crear Reunión
                        </button>
                        <div className="lobby-divider">o</div>
                        <button
                            id="lobby-join"
                            className="btn btn-secondary btn-lg"
                            onClick={() => setStep('join')}
                        >
                            🔗 Unirse con Código
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Create room → show code */}
            {step === 'create' && !roomCode && (
                <div className="lobby-card glass-card">
                    <div className="lobby-loading">
                        <div className="spinner" />
                        <p>Creando sala...</p>
                    </div>
                </div>
            )}

            {/* Step: Join room → enter code */}
            {step === 'join' && (
                <div className="lobby-card glass-card">
                    <div className="lobby-logo">🔗</div>
                    <h2 className="lobby-title">Unirse a Reunión</h2>
                    <p className="lobby-subtitle">
                        Ingresa el código que te compartieron
                    </p>
                    <div className="lobby-form">
                        <input
                            id="input-room-code"
                            className="input code-input"
                            type="text"
                            placeholder="ABCD1234"
                            maxLength={8}
                            value={joinCode}
                            onChange={(e) => {
                                setJoinCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                            autoFocus
                        />
                        {error && <div className="lobby-error">{error}</div>}
                        <button
                            id="btn-continue-join"
                            className="btn btn-primary btn-lg"
                            onClick={handleJoinRoom}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verificando...' : 'Continuar'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setStep('choose');
                                setError('');
                            }}
                        >
                            ← Atrás
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Role selection */}
            {step === 'role' && roomCode && (
                <div className="lobby-card glass-card role-selection">
                    <div className="lobby-logo">👥</div>
                    <h2 className="lobby-title">Selecciona tu Rol</h2>

                    {/* Show room code */}
                    <div className="code-display" style={{ marginBottom: 'var(--space-6)' }}>
                        <span className="code-text">{roomCode}</span>
                        <button className="code-copy-btn" onClick={copyCode}>
                            {copied ? '✅' : '📋'}
                        </button>
                    </div>

                    <p className="lobby-subtitle">
                        Comparte el código con tu compañero y elige cómo te comunicarás
                    </p>

                    {error && (
                        <div className="lobby-error" style={{ marginBottom: 'var(--space-4)' }}>
                            {error}
                        </div>
                    )}

                    <div className="role-grid">
                        <div
                            id="role-signer"
                            className={`role-card glass-card ${selectedRole === 'signer' ? 'selected' : ''}`}
                            onClick={() => !isLoading && handleSelectRole('signer')}
                        >
                            <span className="role-icon">🤟</span>
                            <div className="role-name">Lenguaje de Señas</div>
                            <div className="role-desc">
                                Usaré señas ASL frente a la cámara para comunicarme
                            </div>
                        </div>

                        <div
                            id="role-speaker"
                            className={`role-card glass-card ${selectedRole === 'speaker' ? 'selected' : ''}`}
                            onClick={() => !isLoading && handleSelectRole('speaker')}
                        >
                            <span className="role-icon">🗣️</span>
                            <div className="role-name">Voz Natural</div>
                            <div className="role-desc">
                                Hablaré con mi voz y el sistema la convertirá a texto
                            </div>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="lobby-loading" style={{ marginTop: 'var(--space-6)' }}>
                            <div className="spinner" />
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Entrando a la sala...
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
