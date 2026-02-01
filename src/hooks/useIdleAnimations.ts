/**
 * StreamAvatar - Idle Animations Engine
 * 
 * Procedural animation system that brings the avatar to life when face tracking
 * is inactive or to add subtle organic movement on top of tracking data.
 * 
 * Features:
 * - Natural blinking with Gaussian-distributed intervals
 * - Perlin noise-based micro head movements
 * - Sinusoidal breathing cycle
 * - Gaze wandering for "looking around" effect
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

// =============================================================================
// Configuration Constants
// =============================================================================

/**
 * Blink Configuration
 * Average adult blinks 15-20 times per minute
 * We use Gaussian distribution for natural variation
 */
const BLINK_CONFIG = {
    meanInterval: 4000,      // Average 4 seconds between blinks
    intervalVariance: 1500,  // ±1.5 seconds variance
    duration: 150,           // Blink takes 150ms
    holdClosed: 50,          // Eyes stay closed for 50ms
};

/**
 * Breathing Configuration
 * Normal breathing rate: 12-16 breaths per minute
 */
const BREATHING_CONFIG = {
    cycleSpeed: 0.002,       // ~14 breaths per minute at 60fps
    amplitude: 0.008,        // Very subtle scale change (0.8%)
};

/**
 * Head Micro-Movement Configuration
 * Simulates natural head sway using Perlin-like noise
 */
const HEAD_SWAY_CONFIG = {
    frequency: 0.0005,       // Very slow movement
    amplitudeX: 0.015,       // Pitch amplitude (radians)
    amplitudeY: 0.02,        // Yaw amplitude (radians)  
    amplitudeZ: 0.008,       // Roll amplitude (radians)
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Simple pseudo-random number generator with seed
 * Used for deterministic noise generation
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

/**
 * Simplified Perlin-like noise function
 * Creates smooth, organic-looking random values
 */
function smoothNoise(time: number, frequency: number, seed: number = 0): number {
    const t = time * frequency;
    const t0 = Math.floor(t);
    const t1 = t0 + 1;
    const frac = t - t0;

    // Smooth interpolation curve (smoothstep)
    const smooth = frac * frac * (3 - 2 * frac);

    // Get pseudo-random values at integer points
    const v0 = seededRandom(t0 + seed * 100) * 2 - 1;
    const v1 = seededRandom(t1 + seed * 100) * 2 - 1;

    // Interpolate
    return v0 + smooth * (v1 - v0);
}

/**
 * Gaussian random number generator using Box-Muller transform
 * Used for natural blink timing variation
 */
function gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
}

// =============================================================================
// Types
// =============================================================================

export interface IdleAnimationState {
    /** Current blink value (0 = open, 1 = closed) */
    leftEyeBlink: number;
    rightEyeBlink: number;

    /** Head rotation offsets in radians */
    headRotation: {
        x: number;
        y: number;
        z: number;
    };

    /** Breathing scale multiplier (centered at 1.0) */
    breathScale: number;

    /** Whether idle animations are currently active */
    isActive: boolean;
}

export interface UseIdleAnimationsOptions {
    /** Enable/disable the idle system */
    enabled?: boolean;

    /** Intensity multiplier (0-1) for blending with tracking */
    intensity?: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useIdleAnimations(options: UseIdleAnimationsOptions = {}) {
    const { enabled = true, intensity = 1.0 } = options;

    // Animation state refs (to avoid re-renders)
    const stateRef = useRef<IdleAnimationState>({
        leftEyeBlink: 0,
        rightEyeBlink: 0,
        headRotation: { x: 0, y: 0, z: 0 },
        breathScale: 1,
        isActive: enabled,
    });

    // Blink timing state
    const blinkRef = useRef({
        nextBlinkTime: Date.now() + gaussianRandom(BLINK_CONFIG.meanInterval, BLINK_CONFIG.intervalVariance),
        isBlinking: false,
        blinkStartTime: 0,
    });

    // Animation start time for consistent noise
    const startTimeRef = useRef(Date.now());

    /**
     * Update blink state based on timing
     */
    const updateBlink = useCallback(() => {
        const now = Date.now();
        const blink = blinkRef.current;

        if (!blink.isBlinking) {
            // Check if it's time to blink
            if (now >= blink.nextBlinkTime) {
                blink.isBlinking = true;
                blink.blinkStartTime = now;
            }
        } else {
            // Currently blinking - calculate blink progress
            const elapsed = now - blink.blinkStartTime;
            const totalDuration = BLINK_CONFIG.duration + BLINK_CONFIG.holdClosed;

            if (elapsed >= totalDuration) {
                // Blink complete
                blink.isBlinking = false;
                blink.nextBlinkTime = now + gaussianRandom(BLINK_CONFIG.meanInterval, BLINK_CONFIG.intervalVariance);
                stateRef.current.leftEyeBlink = 0;
                stateRef.current.rightEyeBlink = 0;
            } else if (elapsed < BLINK_CONFIG.duration / 2) {
                // Closing phase
                const progress = elapsed / (BLINK_CONFIG.duration / 2);
                const value = Math.sin(progress * Math.PI / 2); // Ease in
                stateRef.current.leftEyeBlink = value;
                stateRef.current.rightEyeBlink = value;
            } else if (elapsed < BLINK_CONFIG.duration / 2 + BLINK_CONFIG.holdClosed) {
                // Hold closed
                stateRef.current.leftEyeBlink = 1;
                stateRef.current.rightEyeBlink = 1;
            } else {
                // Opening phase
                const openElapsed = elapsed - BLINK_CONFIG.duration / 2 - BLINK_CONFIG.holdClosed;
                const progress = openElapsed / (BLINK_CONFIG.duration / 2);
                const value = 1 - Math.sin(progress * Math.PI / 2); // Ease out
                stateRef.current.leftEyeBlink = value;
                stateRef.current.rightEyeBlink = value;
            }
        }
    }, []);

    /**
     * Update head micro-movements using smooth noise
     */
    const updateHeadSway = useCallback(() => {
        const elapsed = Date.now() - startTimeRef.current;

        stateRef.current.headRotation = {
            x: smoothNoise(elapsed, HEAD_SWAY_CONFIG.frequency, 1) * HEAD_SWAY_CONFIG.amplitudeX * intensity,
            y: smoothNoise(elapsed, HEAD_SWAY_CONFIG.frequency, 2) * HEAD_SWAY_CONFIG.amplitudeY * intensity,
            z: smoothNoise(elapsed, HEAD_SWAY_CONFIG.frequency, 3) * HEAD_SWAY_CONFIG.amplitudeZ * intensity,
        };
    }, [intensity]);

    /**
     * Update breathing cycle
     */
    const updateBreathing = useCallback(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const breathPhase = Math.sin(elapsed * BREATHING_CONFIG.cycleSpeed);
        stateRef.current.breathScale = 1 + breathPhase * BREATHING_CONFIG.amplitude * intensity;
    }, [intensity]);

    /**
     * Main animation frame update
     * Uses R3F's useFrame for optimal performance
     */
    useFrame(() => {
        if (!enabled) {
            // Reset to neutral when disabled
            stateRef.current = {
                leftEyeBlink: 0,
                rightEyeBlink: 0,
                headRotation: { x: 0, y: 0, z: 0 },
                breathScale: 1,
                isActive: false,
            };
            return;
        }

        stateRef.current.isActive = true;
        updateBlink();
        updateHeadSway();
        updateBreathing();
    });

    /**
     * Get current animation state
     * Called by avatar components each frame
     */
    const getIdleState = useCallback((): IdleAnimationState => {
        return { ...stateRef.current };
    }, []);

    /**
     * Force a blink (useful for expressions)
     */
    const triggerBlink = useCallback(() => {
        blinkRef.current.isBlinking = true;
        blinkRef.current.blinkStartTime = Date.now();
    }, []);

    return {
        getIdleState,
        triggerBlink,
        isActive: stateRef.current.isActive,
    };
}
