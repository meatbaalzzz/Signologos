/**
 * Signologos — Translation state store (Zustand).
 */

import { create } from 'zustand';
import type { TranslationEntry } from '../types';

interface TranslationStore {
    /** All translations in this session */
    translations: TranslationEntry[];

    /** Currently detected letter (signer role) */
    currentLetter: string;
    currentConfidence: number;

    /** Accumulated text while camera/mic is on */
    accumulatedText: string;

    /** The latest received translation (to display) */
    latestReceived: TranslationEntry | null;

    // Actions
    addTranslation: (entry: TranslationEntry) => void;
    setCurrentLetter: (letter: string, confidence: number) => void;
    setAccumulatedText: (text: string) => void;
    appendToAccumulated: (char: string) => void;
    clearAccumulated: () => void;
    setLatestReceived: (entry: TranslationEntry | null) => void;
    reset: () => void;
}

export const useTranslationStore = create<TranslationStore>((set) => ({
    translations: [],
    currentLetter: '',
    currentConfidence: 0,
    accumulatedText: '',
    latestReceived: null,

    addTranslation: (entry) =>
        set((state) => ({
            translations: [...state.translations, entry],
        })),

    setCurrentLetter: (letter, confidence) =>
        set({ currentLetter: letter, currentConfidence: confidence }),

    setAccumulatedText: (text) => set({ accumulatedText: text }),

    appendToAccumulated: (char) =>
        set((state) => ({
            accumulatedText: state.accumulatedText + char,
        })),

    clearAccumulated: () => set({ accumulatedText: '' }),

    setLatestReceived: (latestReceived) => set({ latestReceived }),

    reset: () =>
        set({
            translations: [],
            currentLetter: '',
            currentConfidence: 0,
            accumulatedText: '',
            latestReceived: null,
        }),
}));
