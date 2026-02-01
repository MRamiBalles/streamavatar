/**
 * Audio Lip Sync Hook
 * 
 * Combines viseme analysis with the animation system.
 * Provides a unified interface for lip-sync that integrates with
 * both the VRM tracking bridge and the idle animation system.
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useCallback, useEffect, useRef } from 'react';
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { useVisemeAnalyzer, VisemeWeights } from './useVisemeAnalyzer';

// =============================================================================
// Types
// =============================================================================

export interface LipSyncState {
    /** Whether lip sync is active */
    isActive: boolean;
    /** Whether the user is currently speaking */
    isSpeaking: boolean;
    /** Current viseme weights */
    visemes: VisemeWeights;
    /** Dominant viseme (for simple animations) */
    dominantViseme: keyof VisemeWeights;
    /** Mouth openness (0-1) derived from visemes */
    mouthOpen: number;
    /** Error message if any */
    error: string | null;
}

export interface UseAudioLipSyncOptions {
    /** Whether to auto-start lip sync */
    autoStart?: boolean;
    /** Intensity multiplier for expressions (0-2) */
    intensity?: number;
    /** Minimum mouth opening for any viseme */
    minMouthOpen?: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAudioLipSync(options: UseAudioLipSyncOptions = {}) {
    const {
        autoStart = false,
        intensity = 1.0,
        minMouthOpen = 0.1,
    } = options;

    // Use the viseme analyzer
    const analyzer = useVisemeAnalyzer({ autoStart });

    // Track previous state for smooth transitions
    const prevMouthOpenRef = useRef(0);

    /**
     * Get the dominant viseme (highest weight)
     */
    const getDominantViseme = useCallback((visemes: VisemeWeights): keyof VisemeWeights => {
        let maxKey: keyof VisemeWeights = 'sil';
        let maxValue = 0;

        for (const [key, value] of Object.entries(visemes)) {
            if (value > maxValue) {
                maxValue = value;
                maxKey = key as keyof VisemeWeights;
            }
        }

        return maxKey;
    }, []);

    /**
     * Calculate mouth openness from visemes
     * Different visemes have different mouth openness levels
     */
    const calculateMouthOpen = useCallback((visemes: VisemeWeights): number => {
        // Weight factors for each viseme's mouth openness
        const openWeights = {
            aa: 1.0,   // Wide open
            ee: 0.3,   // Stretched but not very open
            ih: 0.4,   // Slightly open
            oh: 0.7,   // Rounded, medium open
            ou: 0.5,   // Pursed, slightly open
            sil: 0,    // Closed
        };

        // Calculate weighted sum
        let mouthOpen = 0;
        for (const [key, value] of Object.entries(visemes)) {
            mouthOpen += value * openWeights[key as keyof VisemeWeights];
        }

        // Apply intensity and minimum
        mouthOpen = mouthOpen * intensity;

        // Apply minimum if speaking
        if (mouthOpen > 0.01) {
            mouthOpen = Math.max(minMouthOpen, mouthOpen);
        }

        // Smooth transition
        const smoothed = prevMouthOpenRef.current * 0.7 + mouthOpen * 0.3;
        prevMouthOpenRef.current = smoothed;

        return Math.min(1, smoothed);
    }, [intensity, minMouthOpen]);

    /**
     * Apply visemes to a VRM model
     */
    const applyToVRM = useCallback((vrm: VRM) => {
        const exp = vrm.expressionManager;
        if (!exp) return;

        const visemes = analyzer.visemes;
        const i = intensity;

        // Apply each viseme expression
        exp.setValue(VRMExpressionPresetName.Aa, visemes.aa * i);
        exp.setValue(VRMExpressionPresetName.Ee, visemes.ee * i);
        exp.setValue(VRMExpressionPresetName.Ih, visemes.ih * i);
        exp.setValue(VRMExpressionPresetName.Oh, visemes.oh * i);
        exp.setValue(VRMExpressionPresetName.Ou, visemes.ou * i);
    }, [analyzer.visemes, intensity]);

    /**
     * Get the current lip sync state
     */
    const getLipSyncState = useCallback((): LipSyncState => {
        return {
            isActive: analyzer.isActive,
            isSpeaking: analyzer.isSpeaking,
            visemes: analyzer.visemes,
            dominantViseme: getDominantViseme(analyzer.visemes),
            mouthOpen: calculateMouthOpen(analyzer.visemes),
            error: analyzer.error,
        };
    }, [analyzer, getDominantViseme, calculateMouthOpen]);

    return {
        // State
        isActive: analyzer.isActive,
        isSpeaking: analyzer.isSpeaking,
        visemes: analyzer.visemes,
        error: analyzer.error,

        // Actions
        start: analyzer.start,
        stop: analyzer.stop,
        toggle: analyzer.toggle,

        // Integration
        getLipSyncState,
        applyToVRM,

        // Computed values
        dominantViseme: getDominantViseme(analyzer.visemes),
        mouthOpen: calculateMouthOpen(analyzer.visemes),
    };
}
