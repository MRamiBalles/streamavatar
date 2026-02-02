/**
 * Viseme Analyzer Hook
 * 
 * Real-time lip-sync through audio frequency analysis.
 * Analyzes the microphone or audio stream to detect visemes (mouth shapes)
 * based on formant frequencies of vowels.
 * 
 * Based on research:
 * - Formant frequencies for vowels (F1/F2 analysis)
 * - wawa-lipsync approach for browser-native detection
 * - VRM standard viseme set (Aa, Ee, Ih, Oh, Ou)
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useRef, useEffect, useCallback, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface VisemeWeights {
    /** Open vowel - "ah" sound (father, car) */
    aa: number;
    /** Close front vowel - "ee" sound (feet, eat) */
    ee: number;
    /** Near-close front vowel - "ih" sound (bit, lip) */
    ih: number;
    /** Mid back vowel - "oh" sound (boat, go) */
    oh: number;
    /** Close back vowel - "oo" sound (food, blue) */
    ou: number;
    /** Silence / neutral mouth */
    sil: number;
}

export interface VisemeAnalyzerState {
    /** Current viseme weights (0-1) */
    visemes: VisemeWeights;
    /** Whether the analyzer is active */
    isActive: boolean;
    /** Whether speech is detected */
    isSpeaking: boolean;
    /** Current volume level (0-1) */
    volume: number;
    /** Error message if setup failed */
    error: string | null;
}

export interface UseVisemeAnalyzerOptions {
    /** Audio source: 'microphone' or an HTMLMediaElement */
    source?: 'microphone' | HTMLMediaElement;
    /** FFT size (power of 2, default 2048) */
    fftSize?: number;
    /** Smoothing factor (0-1, default 0.8) */
    smoothing?: number;
    /** Volume threshold for speech detection (0-1, default 0.01) */
    speechThreshold?: number;
    /** Whether to auto-start on mount */
    autoStart?: boolean;
}

// =============================================================================
// Formant Configuration
// =============================================================================

/**
 * Formant frequency ranges for vowel detection
 * Based on average F1 (first formant) frequencies
 * 
 * F1 correlates with tongue height (low F1 = high tongue)
 * F2 correlates with tongue position (high F2 = front)
 */
const FORMANT_RANGES = {
    // Aa - Open vowel (low tongue, open mouth) - high F1
    aa: { f1Min: 700, f1Max: 1100, f2Min: 1000, f2Max: 1500 },

    // Ee - Close front vowel (high tongue, front) - low F1, high F2
    ee: { f1Min: 250, f1Max: 400, f2Min: 2200, f2Max: 2800 },

    // Ih - Near-close front vowel - mid-low F1, high F2
    ih: { f1Min: 350, f1Max: 500, f2Min: 1800, f2Max: 2400 },

    // Oh - Mid back vowel (rounded lips) - mid F1, low-mid F2
    oh: { f1Min: 450, f1Max: 650, f2Min: 800, f2Max: 1200 },

    // Ou - Close back vowel (rounded, forward lips) - low F1, low F2
    ou: { f1Min: 280, f1Max: 450, f2Min: 600, f2Max: 1000 },
};

/** Minimum volume to consider as speech */
const DEFAULT_SPEECH_THRESHOLD = 0.015;

/** Number of consecutive silent frames before resetting */
const SILENCE_FRAMES = 5;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useVisemeAnalyzer(options: UseVisemeAnalyzerOptions = {}) {
    const {
        source = 'microphone',
        fftSize = 2048,
        smoothing = 0.75,
        speechThreshold = DEFAULT_SPEECH_THRESHOLD,
        autoStart = false,
    } = options;

    // State
    const [state, setState] = useState<VisemeAnalyzerState>({
        visemes: { aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, sil: 1 },
        isActive: false,
        isSpeaking: false,
        volume: 0,
        error: null,
    });

    // Audio nodes refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Animation frame ref
    const animationFrameRef = useRef<number | null>(null);

    // Analysis data refs (avoid re-allocation)
    const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const previousVisemesRef = useRef<VisemeWeights>({ aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, sil: 1 });
    const silenceCountRef = useRef(0);

    /**
     * Get energy in a frequency range from FFT data
     */
    const getFrequencyEnergy = useCallback((
        data: Uint8Array,
        minFreq: number,
        maxFreq: number,
        sampleRate: number
    ): number => {
        const binWidth = sampleRate / fftSize;
        const minBin = Math.floor(minFreq / binWidth);
        const maxBin = Math.ceil(maxFreq / binWidth);

        if (maxBin <= minBin || minBin >= data.length) return 0;

        let sum = 0;
        let count = 0;
        for (let i = Math.max(0, minBin); i <= Math.min(data.length - 1, maxBin); i++) {
            sum += data[i];
            count++;
        }

        return count > 0 ? (sum / count) / 255 : 0;
    }, [fftSize]);

    /**
     * Analyze frequency data to detect visemes
     */
    const analyzeVisemes = useCallback((data: Uint8Array, sampleRate: number): VisemeWeights => {
        // Calculate overall volume
        let totalEnergy = 0;
        for (let i = 0; i < data.length; i++) {
            totalEnergy += data[i];
        }
        const volume = (totalEnergy / data.length) / 255;

        // If too quiet, return silence
        if (volume < speechThreshold) {
            silenceCountRef.current++;
            if (silenceCountRef.current > SILENCE_FRAMES) {
                return { aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, sil: 1 };
            }
            // Keep previous visemes during short silences
            return previousVisemesRef.current;
        }

        silenceCountRef.current = 0;

        // Analyze formant regions for each viseme
        const weights: VisemeWeights = {
            aa: getFrequencyEnergy(data, FORMANT_RANGES.aa.f1Min, FORMANT_RANGES.aa.f1Max, sampleRate),
            ee: getFrequencyEnergy(data, FORMANT_RANGES.ee.f1Min, FORMANT_RANGES.ee.f2Max, sampleRate),
            ih: getFrequencyEnergy(data, FORMANT_RANGES.ih.f1Min, FORMANT_RANGES.ih.f2Max, sampleRate),
            oh: getFrequencyEnergy(data, FORMANT_RANGES.oh.f1Min, FORMANT_RANGES.oh.f2Max, sampleRate),
            ou: getFrequencyEnergy(data, FORMANT_RANGES.ou.f1Min, FORMANT_RANGES.ou.f2Max, sampleRate),
            sil: 0,
        };

        // Normalize weights so they sum to ~1
        const total = weights.aa + weights.ee + weights.ih + weights.oh + weights.ou;
        if (total > 0.01) {
            weights.aa = Math.min(1, (weights.aa / total) * 2);
            weights.ee = Math.min(1, (weights.ee / total) * 2);
            weights.ih = Math.min(1, (weights.ih / total) * 2);
            weights.oh = Math.min(1, (weights.oh / total) * 2);
            weights.ou = Math.min(1, (weights.ou / total) * 2);
        }

        // Apply smoothing for natural transitions
        const prev = previousVisemesRef.current;
        const smoothed: VisemeWeights = {
            aa: prev.aa * smoothing + weights.aa * (1 - smoothing),
            ee: prev.ee * smoothing + weights.ee * (1 - smoothing),
            ih: prev.ih * smoothing + weights.ih * (1 - smoothing),
            oh: prev.oh * smoothing + weights.oh * (1 - smoothing),
            ou: prev.ou * smoothing + weights.ou * (1 - smoothing),
            sil: 0,
        };

        previousVisemesRef.current = smoothed;
        return smoothed;
    }, [speechThreshold, smoothing, getFrequencyEnergy]);

    /**
     * Animation loop for continuous analysis
     */
    const analyze = useCallback(() => {
        if (!analyserRef.current || !frequencyDataRef.current || !audioContextRef.current) {
            return;
        }

        // Get current frequency data
        const frequencyData = frequencyDataRef.current;
        analyserRef.current.getByteFrequencyData(frequencyData);

        // Analyze for visemes
        const visemes = analyzeVisemes(
            frequencyData,
            audioContextRef.current.sampleRate
        );

        // Calculate volume
        let sum = 0;
        for (let i = 0; i < frequencyDataRef.current.length; i++) {
            sum += frequencyDataRef.current[i];
        }
        const volume = (sum / frequencyDataRef.current.length) / 255;

        // Update state
        setState(prev => ({
            ...prev,
            visemes,
            volume,
            isSpeaking: volume > speechThreshold,
        }));

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(analyze);
    }, [analyzeVisemes, speechThreshold]);

    /**
     * Start the analyzer
     */
    const start = useCallback(async () => {
        try {
            // Create audio context
            audioContextRef.current = new AudioContext();

            // Create analyser node
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = fftSize;
            analyserRef.current.smoothingTimeConstant = 0.3;

            // Allocate frequency data array
            frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

            // Connect source
            if (source === 'microphone') {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });
                streamRef.current = stream;
                sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
            } else {
                // HTML Media Element
                sourceNodeRef.current = audioContextRef.current.createMediaElementSource(source);
                sourceNodeRef.current.connect(audioContextRef.current.destination);
            }

            // Connect to analyser
            sourceNodeRef.current.connect(analyserRef.current);

            // Start analysis loop
            animationFrameRef.current = requestAnimationFrame(analyze);

            setState(prev => ({ ...prev, isActive: true, error: null }));
            console.log('[VisemeAnalyzer] Started successfully');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
            console.error('[VisemeAnalyzer] Error:', errorMessage);
            setState(prev => ({ ...prev, error: errorMessage }));
        }
    }, [source, fftSize, analyze]);

    /**
     * Stop the analyzer
     */
    const stop = useCallback(() => {
        // Stop animation loop
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Reset state
        setState({
            visemes: { aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, sil: 1 },
            isActive: false,
            isSpeaking: false,
            volume: 0,
            error: null,
        });

        console.log('[VisemeAnalyzer] Stopped');
    }, []);

    /**
     * Toggle analyzer on/off
     */
    const toggle = useCallback(() => {
        if (state.isActive) {
            stop();
        } else {
            start();
        }
    }, [state.isActive, start, stop]);

    // Auto-start if requested
    useEffect(() => {
        if (autoStart) {
            start();
        }

        return () => {
            stop();
        };
    }, [autoStart, start, stop]);

    return {
        ...state,
        start,
        stop,
        toggle,
    };
}
