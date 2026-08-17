/**
 * Signologos — Error Boundary Component.
 *
 * Catches unhandled React render errors and displays a friendly
 * dark-mode error screen with options to retry or go home.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'hsl(222, 47%, 6%)',
                    padding: '2rem',
                    fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                    <div style={{
                        maxWidth: '480px',
                        width: '100%',
                        padding: '2.5rem',
                        background: 'hsla(222, 40%, 15%, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid hsla(0, 0%, 100%, 0.08)',
                        borderRadius: '24px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💥</div>
                        <h2 style={{
                            fontFamily: "'Outfit', system-ui, sans-serif",
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'hsl(0, 0%, 95%)',
                            marginBottom: '0.75rem',
                        }}>
                            Algo salió mal
                        </h2>
                        <p style={{
                            color: 'hsl(222, 20%, 65%)',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6,
                        }}>
                            Se produjo un error inesperado en la aplicación. Puedes intentar recuperarte o volver al inicio.
                        </p>

                        {this.state.error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'hsla(0, 72%, 55%, 0.1)',
                                border: '1px solid hsla(0, 72%, 55%, 0.2)',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                textAlign: 'left',
                            }}>
                                <code style={{
                                    fontSize: '0.75rem',
                                    color: 'hsl(0, 72%, 70%)',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={this.handleRetry}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, hsl(170, 80%, 50%), hsl(260, 70%, 65%))',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'hsl(222, 47%, 6%)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                🔄 Reintentar
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'hsla(222, 40%, 15%, 0.6)',
                                    border: '1px solid hsla(0, 0%, 100%, 0.08)',
                                    borderRadius: '12px',
                                    color: 'hsl(0, 0%, 95%)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                🔁 Recargar
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'hsla(222, 40%, 15%, 0.6)',
                                    border: '1px solid hsla(0, 0%, 100%, 0.08)',
                                    borderRadius: '12px',
                                    color: 'hsl(0, 0%, 95%)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                🏠 Inicio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
