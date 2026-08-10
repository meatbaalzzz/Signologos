/**
 * Signologos — useSpeechRecognition hook.
 *
 * Wraps the Web Speech API SpeechRecognition for real-time
 * voice-to-text transcription (used by the SPEAKER role).
 *
 * When enabled (mic on): continuously transcribes speech.
 * When disabled (mic off): returns the final accumulated text.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { SPEECH_RECOGNITION } from '../utils/constants';

// Browser compatibility
const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseSpeechRecognitionReturn {
    interimText: string;
    accumulatedText: string;
    finalText: string | null;
    isListening: boolean;
    isSupported: boolean;
    start: () => void;
    stop: () => string;
    reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const recognitionRef = useRef<any>(null);
    const accumulatedRef = useRef('');
    const [interimText, setInterimText] = useState('');
    const [accumulatedText, setAccumulatedText] = useState('');
    const [finalText, setFinalText] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);

    const isSupported = !!SpeechRecognitionAPI;

    const start = useCallback(() => {
        if (!isSupported) return;

        // Reset final text
        setFinalText(null);

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = SPEECH_RECOGNITION.CONTINUOUS;
        recognition.interimResults = SPEECH_RECOGNITION.INTERIM_RESULTS;
        recognition.lang = SPEECH_RECOGNITION.LANGUAGE;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                accumulatedRef.current += final;
                setAccumulatedText(accumulatedRef.current);
            }
            setInterimText(interim);
        };

        recognition.onerror = (event: any) => {
            console.error('[SpeechRecognition] Error:', event.error);
            if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Auto-restart if still supposed to be listening
            if (isListening && recognitionRef.current) {
                try {
                    recognition.start();
                } catch {
                    // Already started
                }
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.error('[SpeechRecognition] Failed to start:', err);
        }
    }, [isSupported, isListening]);

    const stop = useCallback((): string => {
        setIsListening(false);

        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent auto-restart
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        const result = accumulatedRef.current.trim();
        setFinalText(result);
        setInterimText('');
        return result;
    }, []);

    const reset = useCallback(() => {
        accumulatedRef.current = '';
        setAccumulatedText('');
        setFinalText(null);
        setInterimText('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, []);

    return {
        interimText,
        accumulatedText,
        finalText,
        isListening,
        isSupported,
        start,
        stop,
        reset,
    };
}
