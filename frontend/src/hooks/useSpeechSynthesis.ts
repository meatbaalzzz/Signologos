/**
 * Signologos — useSpeechSynthesis hook.
 *
 * Wraps the Web Speech API SpeechSynthesis for text-to-speech.
 * Used to speak the translated sign language text to the SPEAKER.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechSynthesisReturn {
    speak: (text: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    rate: number;
    setRate: (rate: number) => void;
    isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [rate, setRate] = useState(1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const isSupported = 'speechSynthesis' in window;

    // Load available voices
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            setVoices(available);

            // Auto-select an English voice
            if (!selectedVoice && available.length > 0) {
                const english = available.find((v) => v.lang.startsWith('en-'));
                setSelectedVoice(english || available[0]);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSupported, selectedVoice]);

    const speak = useCallback(
        (text: string) => {
            if (!isSupported || !text.trim()) return;

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = 1;
            utterance.volume = 1;

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        },
        [isSupported, selectedVoice, rate]
    );

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setSelectedVoice(voice);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSupported]);

    return {
        speak,
        stop,
        isSpeaking,
        voices,
        selectedVoice,
        setVoice,
        rate,
        setRate,
        isSupported,
    };
}
