/**
 * Signologos — Landing Page.
 *
 * Premium dark-themed landing with animated hero, features, and CTAs.
 * GSAP ScrollTrigger animations for scroll-driven reveals and micro-interactions.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const navigate = useNavigate();
    const heroRef = useRef<HTMLElement>(null);
    const featuresRef = useRef<HTMLElement>(null);
    const flowRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // ── Hero entrance animation (overrides CSS opacity:0 animations) ──
            const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            heroTl
                .fromTo('.hero-badge',    { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
                .fromTo('.hero-title',    { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
                .fromTo('.hero-subtitle', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
                .fromTo('.hero-actions',  { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
                .fromTo('.hero-stats',    { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3');

            // ── Hero stat values — counting up effect ──
            gsap.fromTo('.hero-stat-value', {
                scale: 0.8,
                opacity: 0,
            }, {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                stagger: 0.15,
                ease: 'back.out(2)',
                delay: 1.2,
            });

            // ── Feature cards — scroll triggered stagger reveal ──
            gsap.fromTo('.feature-card', {
                y: 60,
                opacity: 0,
                scale: 0.95,
            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.7,
                stagger: 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.features',
                    start: 'top 80%',
                    toggleActions: 'play none none none',
                },
            });

            // ── Features title reveal ──
            gsap.fromTo('.features-title, .features-subtitle', {
                y: 40,
                opacity: 0,
            }, {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.features',
                    start: 'top 85%',
                },
            });

            // ── Flow steps — sequential reveal ──
            gsap.fromTo('.flow-step', {
                x: -40,
                opacity: 0,
            }, {
                x: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.flow-section',
                    start: 'top 80%',
                },
            });

            gsap.fromTo('.flow-arrow', {
                scaleX: 0,
                opacity: 0,
            }, {
                scaleX: 1,
                opacity: 1,
                duration: 0.4,
                stagger: 0.15,
                ease: 'power2.out',
                delay: 0.4,
                scrollTrigger: {
                    trigger: '.flow-section',
                    start: 'top 80%',
                },
            });

            // ── Feature icons — pulse glow on scroll ──
            gsap.fromTo('.feature-icon', {
                scale: 0.5,
                opacity: 0,
                rotateY: -90,
            }, {
                scale: 1,
                opacity: 1,
                rotateY: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: '.features',
                    start: 'top 75%',
                },
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <div className="landing">
            {/* Animated background glow */}
            <div className="bg-glow" />

            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <span>🤟</span>
                    <span>Signologos</span>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero" ref={heroRef}>
                <div className="hero-badge">
                    ✨ Potenciado con Inteligencia Artificial
                </div>

                <h1 className="hero-title">
                    La palabra{' '}
                    <span className="gradient-text">hecha signo</span>
                </h1>

                <p className="hero-subtitle">
                    Videollamadas en tiempo real con traducción bidireccional entre
                    lenguaje de señas y voz. Comunicación sin barreras.
                </p>

                <div className="hero-actions">
                    <button
                        id="btn-create-room"
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/lobby?action=create')}
                    >
                        🎥 Crear Reunión
                    </button>
                    <button
                        id="btn-join-room"
                        className="btn btn-secondary btn-lg"
                        onClick={() => navigate('/lobby?action=join')}
                    >
                        🔗 Unirse a Reunión
                    </button>
                </div>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-value">ASL</div>
                        <div className="hero-stat-label">Lenguaje de Señas</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-value">P2P</div>
                        <div className="hero-stat-label">Conexión Directa</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-value">IA</div>
                        <div className="hero-stat-label">Detección en Tiempo Real</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" ref={featuresRef}>
                <h2 className="features-title">
                    ¿Cómo <span className="gradient-text">funciona</span>?
                </h2>
                <p className="features-subtitle">
                    Tecnología avanzada para una comunicación simple y natural
                </p>

                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <div className="feature-icon feature-icon--cyan">🤟</div>
                        <h4>Detección de Señas</h4>
                        <p>
                            MediaPipe detecta los landmarks de tus manos en tiempo real.
                            Un modelo de IA clasifica cada seña del alfabeto ASL con alta
                            precisión directamente en tu navegador.
                        </p>
                    </div>

                    <div className="feature-card glass-card">
                        <div className="feature-icon feature-icon--purple">🗣️</div>
                        <h4>Reconocimiento de Voz</h4>
                        <p>
                            La Web Speech API captura todo lo que dices en tiempo real y lo
                            convierte en texto. Al cerrar el micrófono, el texto se traduce
                            a imágenes de señas para tu compañero.
                        </p>
                    </div>

                    <div className="feature-card glass-card">
                        <div className="feature-icon feature-icon--green">🔒</div>
                        <h4>Privado y Seguro</h4>
                        <p>
                            Todo el procesamiento de IA ocurre en tu navegador — tus datos
                            nunca salen de tu dispositivo. La videollamada es peer-to-peer,
                            sin servidores intermedios.
                        </p>
                    </div>
                </div>
            </section>

            {/* Flow Section */}
            <section className="flow-section" ref={flowRef}>
                <h2>
                    Flujo de <span className="gradient-text">comunicación</span>
                </h2>

                <div className="flow-container">
                    <div className="flow-step glass-card">
                        <div className="flow-step-number">1</div>
                        <h5>Señas → Cámara</h5>
                        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                            El sordomudo hace señas frente a la cámara
                        </p>
                    </div>

                    <div className="flow-arrow">→</div>

                    <div className="flow-step glass-card">
                        <div className="flow-step-number">2</div>
                        <h5>IA → Texto</h5>
                        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                            La IA detecta y acumula las letras
                        </p>
                    </div>

                    <div className="flow-arrow">→</div>

                    <div className="flow-step glass-card">
                        <div className="flow-step-number">3</div>
                        <h5>Texto → Voz</h5>
                        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                            El hablante escucha la traducción por audio
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>
                    Signologos © {new Date().getFullYear()} — La palabra hecha signo.
                    Construido con ❤️ para la accesibilidad.
                </p>
            </footer>
        </div>
    );
}
