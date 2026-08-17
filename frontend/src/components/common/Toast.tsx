/**
 * Signologos — Toast Notification System.
 *
 * A lightweight toast manager with auto-dismiss, icons per type,
 * and GSAP-like slide animations using CSS keyframes.
 *
 * Usage:
 *   import { toast } from './Toast';
 *   toast.success('Sala creada');
 *   toast.error('No se pudo conectar');
 *   toast.info('Esperando participante...');
 *   toast.warning('Modelo cargando lentamente');
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// Singleton emitter
type ToastListener = (toast: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

function emit(toast: Omit<ToastMessage, 'id'>) {
    const full: ToastMessage = { ...toast, id: crypto.randomUUID() };
    listeners.forEach((fn) => fn(full));
}

/** Public toast API — use this anywhere in the app */
export const toast = {
    success: (message: string, duration = 4000) => emit({ type: 'success', message, duration }),
    error:   (message: string, duration = 6000) => emit({ type: 'error',   message, duration }),
    warning: (message: string, duration = 5000) => emit({ type: 'warning', message, duration }),
    info:    (message: string, duration = 3500) => emit({ type: 'info',    message, duration }),
};

const ICONS: Record<ToastType, string> = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    '💬',
};

const COLORS: Record<ToastType, { border: string; bg: string; text: string }> = {
    success: { border: 'hsla(142, 70%, 50%, 0.4)', bg: 'hsla(142, 70%, 50%, 0.08)', text: 'hsl(142, 70%, 60%)' },
    error:   { border: 'hsla(0, 72%, 55%, 0.4)',   bg: 'hsla(0, 72%, 55%, 0.08)',   text: 'hsl(0, 72%, 70%)'   },
    warning: { border: 'hsla(38, 92%, 55%, 0.4)',  bg: 'hsla(38, 92%, 55%, 0.08)',  text: 'hsl(38, 92%, 65%)'  },
    info:    { border: 'hsla(170, 80%, 50%, 0.4)', bg: 'hsla(170, 80%, 50%, 0.08)', text: 'hsl(170, 80%, 60%)' },
};

interface ToastItemProps {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}

function ToastItem({ toast: t, onDismiss }: ToastItemProps) {
    const colors = COLORS[t.type];
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => onDismiss(t.id), 350);
    }, [t.id, onDismiss]);

    useEffect(() => {
        timerRef.current = setTimeout(dismiss, t.duration ?? 4000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [dismiss, t.duration]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                background: `hsla(222, 40%, 15%, 0.85)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${colors.text}`,
                borderRadius: '12px',
                boxShadow: '0 8px 32px hsla(0,0%,0%,0.4)',
                minWidth: '280px',
                maxWidth: '420px',
                animation: exiting
                    ? 'toastOut 0.35s ease-in forwards'
                    : 'toastIn 0.35s ease-out forwards',
                cursor: 'pointer',
            }}
            onClick={dismiss}
            role="alert"
        >
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>
                {ICONS[t.type]}
            </span>
            <span style={{
                fontSize: '0.875rem',
                color: 'hsl(0, 0%, 90%)',
                lineHeight: 1.5,
                flex: 1,
            }}>
                {t.message}
            </span>
            <button
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(222, 15%, 55%)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: 0,
                    lineHeight: 1,
                    flexShrink: 0,
                }}
                aria-label="Cerrar notificación"
            >
                ×
            </button>
        </div>
    );
}

/** Mount this once in your app root (e.g. App.tsx) */
export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handler: ToastListener = (t) => {
            setToasts((prev) => [...prev, t]);
        };
        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return createPortal(
        <>
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(40px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)  scale(1); }
                }
                @keyframes toastOut {
                    from { opacity: 1; transform: translateX(0)  scale(1); }
                    to   { opacity: 0; transform: translateX(40px) scale(0.95); }
                }
            `}</style>
            <div
                role="region"
                aria-label="Notificaciones"
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    alignItems: 'flex-end',
                }}
            >
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </>,
        document.body
    );
}
