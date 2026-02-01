/**
 * StreamAvatar - Unified Avatar Animation Hook
 * 
 * Combines face tracking data with procedural idle animations and
 * audio-based lip-sync to create a seamless animation experience.
 * 
 * Priority order:
 * 1. Face tracking (when camera active)
 * 2. Lip-sync visemes (when microphone active)
 * 3. Idle animations (when nothing active)
 * 
 * Features:
 * - Automatic blending between tracking and idle
 * - Smooth transitions when tracking starts/stops
 * - Additive idle layer for extra organic feel
 * - Phonetic lip-sync from audio analysis
 * - Performance optimized with minimal re-renders
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAvatarStore } from '@/stores/avatarStore';
import { useIdleAnimations, IdleAnimationState } from './useIdleAnimations';
import { VisemeWeights } from './useVisemeAnalyzer';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Blend configuration for tracking/idle transitions
 */
const BLEND_CONFIG = {
    /** Time in ms before idle kicks in after tracking stops */
    idleDelay: 2000,

    /** Transition duration from tracking to idle */
    fadeToIdleMs: 500,

    /** Transition duration from idle to tracking */
    fadeToTrackingMs: 200,

    /** Add subtle idle on top of tracking for organic feel */
    additiveIdleIntensity: 0.15,
};

// =============================================================================
// Types
// =============================================================================

export interface AvatarAnimationState {
    /** Head rotation in radians */
    headRotation: {
        x: number;
        y: number;
        z: number;
    };

    /** Mouth openness (0-1) */
    mouthOpen: number;

    /** Eye blink values (0 = open, 1 = closed) */
    leftEyeBlink: number;
    rightEyeBlink: number;

    /** Breathing scale multiplier */
    breathScale: number;

    /** Current blend state for debugging */
    blendState: 'tracking' | 'idle' | 'transitioning';
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAvatarAnimation() {
    // Get store data
    const { faceData, isTracking, isCameraActive, audioData, audioReactiveEnabled } = useAvatarStore();

    // Initialize idle animations system
    const { getIdleState } = useIdleAnimations({
        enabled: true,
        intensity: 1.0,
    });

    // Blend state tracking
    const blendRef = useRef({
        lastTrackingTime: 0,
        currentBlend: 0, // 0 = full idle, 1 = full tracking
        targetBlend: 0,
    });

    // Output state ref
    const outputRef = useRef<AvatarAnimationState>({
        headRotation: { x: 0, y: 0, z: 0 },
        mouthOpen: 0,
        leftEyeBlink: 0,
        rightEyeBlink: 0,
        breathScale: 1,
        blendState: 'idle',
    });

    /**
     * Linear interpolation helper
     */
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    /**
     * Calculate the tracking-to-idle blend factor
     */
    const updateBlendFactor = useCallback(() => {
        const now = Date.now();
        const blend = blendRef.current;

        if (isTracking && isCameraActive) {
            // Tracking is active
            blend.lastTrackingTime = now;
            blend.targetBlend = 1;
        } else if (now - blend.lastTrackingTime > BLEND_CONFIG.idleDelay) {
            // Enough time passed, transition to idle
            blend.targetBlend = 0;
        }

        // Smooth transition
        const transitionSpeed = blend.targetBlend > blend.currentBlend
            ? 1 / (BLEND_CONFIG.fadeToTrackingMs / 16.67)  // ~60fps
            : 1 / (BLEND_CONFIG.fadeToIdleMs / 16.67);

        blend.currentBlend = lerp(blend.currentBlend, blend.targetBlend, transitionSpeed);

        // Clamp
        blend.currentBlend = Math.max(0, Math.min(1, blend.currentBlend));
    }, [isTracking, isCameraActive]);

    /**
     * Blend tracking data with idle animations
     */
    const blendAnimations = useCallback((idleState: IdleAnimationState) => {
        const blend = blendRef.current.currentBlend;
        const output = outputRef.current;

        // Determine blend state for debugging
        if (blend > 0.95) {
            output.blendState = 'tracking';
        } else if (blend < 0.05) {
            output.blendState = 'idle';
        } else {
            output.blendState = 'transitioning';
        }

        // Head rotation - blend between tracking and idle
        // When tracking, add subtle idle on top for organic feel
        const additiveIdle = BLEND_CONFIG.additiveIdleIntensity;

        output.headRotation = {
            x: lerp(idleState.headRotation.x, faceData.headRotation.x + idleState.headRotation.x * additiveIdle, blend),
            y: lerp(idleState.headRotation.y, faceData.headRotation.y + idleState.headRotation.y * additiveIdle, blend),
            z: lerp(idleState.headRotation.z, faceData.headRotation.z + idleState.headRotation.z * additiveIdle, blend),
        };

        // Mouth - tracking + audio reactive
        const audioMouth = audioReactiveEnabled ? audioData.volume * 0.5 : 0;
        const trackingMouth = Math.max(faceData.mouthOpen, audioMouth);
        output.mouthOpen = lerp(0, trackingMouth, blend);

        // Eyes - blend blinks, idle can blink too
        // Use max of tracking blink and idle blink for natural feel
        const trackingLeftBlink = faceData.leftEyeBlink;
        const trackingRightBlink = faceData.rightEyeBlink;

        if (blend > 0.5) {
            // Tracking dominant - use tracking blinks, but allow idle to override if blinking
            output.leftEyeBlink = Math.max(trackingLeftBlink, idleState.leftEyeBlink);
            output.rightEyeBlink = Math.max(trackingRightBlink, idleState.rightEyeBlink);
        } else {
            // Idle dominant - use idle blinks
            output.leftEyeBlink = idleState.leftEyeBlink;
            output.rightEyeBlink = idleState.rightEyeBlink;
        }

        // Breathing - always from idle, blended by intensity
        output.breathScale = lerp(idleState.breathScale, 1, blend * 0.5);
    }, [faceData, audioData, audioReactiveEnabled]);

    /**
     * Main animation frame - runs every frame via R3F
     */
    useFrame(() => {
        updateBlendFactor();
        const idleState = getIdleState();
        blendAnimations(idleState);
    });

    /**
     * Get current unified animation state
     * Call this in your avatar component's useFrame
     */
    const getAnimationState = useCallback((): AvatarAnimationState => {
        return { ...outputRef.current };
    }, []);

    return {
        getAnimationState,
        /** Direct access to current blend (0 = idle, 1 = tracking) */
        getBlendFactor: () => blendRef.current.currentBlend,
    };
}
