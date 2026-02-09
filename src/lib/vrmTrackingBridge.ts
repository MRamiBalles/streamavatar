/**
 * VRM Tracking Bridge
 * 
 * Translates MediaPipe facial landmarks and ARKit-style blendshapes
 * to VRM expression weights. This module handles the conversion between
 * the 52 ARKit blendshapes and VRM's standardized expression set.
 * 
 * Based on research from:
 * - ARKit Face Tracking documentation
 * - VRM Consortium expression specifications
 * - Kalidokit mapping approaches
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 * 
 * @compliance Constitution §3 (Architecture Decoupling)
 * @specification specs/vrm-integration/spec.md
 */

import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';

// =============================================================================
// Type Definitions (SDD Compliant)
// =============================================================================

/**
 * Standardized tracking data stream
 * @compliance specs/vrm-integration/spec.md §2
 */
export interface BlendShapeData {
    /** 52 ARKit blendshape coefficients normalized 0.0-1.0 */
    coefficients: Float32Array;
    /** Head rotation as quaternion [x, y, z, w] */
    headRotation: [number, number, number, number];
    /** Timestamp in milliseconds */
    timestamp: number;
}

/**
 * Standardized Avatar Entity interface
 * @compliance specs/vrm-integration/spec.md §2
 */
export interface AvatarEntity {
    readonly model: THREE.Group;
    readonly vrm: VRM;

    /** Apply blendshape data to avatar expressions */
    applyBlendShapes(data: BlendShapeData): void;

    /** Update physics simulation and internal state */
    update(deltaTime: number, camera?: THREE.Camera): void;

    /** Cleanup all GPU resources */
    dispose(): void;
}

/**
 * ARKit-compatible blendshape data from MediaPipe
 * MediaPipe provides 52 blendshapes matching ARKit face tracking
 */
export interface ARKitBlendshapes {
    // Eye
    eyeBlinkLeft: number;
    eyeBlinkRight: number;
    eyeLookDownLeft: number;
    eyeLookDownRight: number;
    eyeLookInLeft: number;
    eyeLookInRight: number;
    eyeLookOutLeft: number;
    eyeLookOutRight: number;
    eyeLookUpLeft: number;
    eyeLookUpRight: number;
    eyeSquintLeft: number;
    eyeSquintRight: number;
    eyeWideLeft: number;
    eyeWideRight: number;

    // Brow
    browDownLeft: number;
    browDownRight: number;
    browInnerUp: number;
    browOuterUpLeft: number;
    browOuterUpRight: number;

    // Nose
    noseSneerLeft: number;
    noseSneerRight: number;

    // Cheek
    cheekPuff: number;
    cheekSquintLeft: number;
    cheekSquintRight: number;

    // Mouth
    jawForward: number;
    jawLeft: number;
    jawRight: number;
    jawOpen: number;
    mouthClose: number;
    mouthFunnel: number;
    mouthPucker: number;
    mouthLeft: number;
    mouthRight: number;
    mouthSmileLeft: number;
    mouthSmileRight: number;
    mouthFrownLeft: number;
    mouthFrownRight: number;
    mouthDimpleLeft: number;
    mouthDimpleRight: number;
    mouthStretchLeft: number;
    mouthStretchRight: number;
    mouthRollLower: number;
    mouthRollUpper: number;
    mouthShrugLower: number;
    mouthShrugUpper: number;
    mouthPressLeft: number;
    mouthPressRight: number;
    mouthLowerDownLeft: number;
    mouthLowerDownRight: number;
    mouthUpperUpLeft: number;
    mouthUpperUpRight: number;

    // Tongue
    tongueOut: number;
}

/**
 * Simplified face data (legacy support)
 */
export interface SimpleFaceData {
    headRotation: { x: number; y: number; z: number };
    mouthOpen: number;
    leftEyeBlink: number;
    rightEyeBlink: number;
}

/**
 * Mapping of ARKit blendshape names to Float32Array indices
 * Based on Apple's ARKit documentation
 */
export const ARKitIndex = {
    // Eye
    eyeBlinkLeft: 0, eyeBlinkRight: 1, eyeLookDownLeft: 2, eyeLookDownRight: 3,
    eyeLookInLeft: 4, eyeLookInRight: 5, eyeLookOutLeft: 6, eyeLookOutRight: 7,
    eyeLookUpLeft: 8, eyeLookUpRight: 9, eyeSquintLeft: 10, eyeSquintRight: 11,
    eyeWideLeft: 12, eyeWideRight: 13,
    // Brow
    browDownLeft: 14, browDownRight: 15, browInnerUp: 16, browOuterUpLeft: 17, browOuterUpRight: 18,
    // Nose
    noseSneerLeft: 19, noseSneerRight: 20,
    // Cheek
    cheekPuff: 21, cheekSquintLeft: 22, cheekSquintRight: 23,
    // Mouth
    jawForward: 24, jawLeft: 25, jawRight: 26, jawOpen: 27, mouthClose: 28,
    mouthFunnel: 29, mouthPucker: 30, mouthLeft: 31, mouthRight: 32,
    mouthSmileLeft: 33, mouthSmileRight: 34, mouthFrownLeft: 35, mouthFrownRight: 36,
    mouthDimpleLeft: 37, mouthDimpleRight: 38, mouthStretchLeft: 39, mouthStretchRight: 40,
    mouthRollLower: 41, mouthRollUpper: 42, mouthShrugLower: 43, mouthShrugUpper: 44,
    mouthPressLeft: 45, mouthPressRight: 46, mouthLowerDownLeft: 47, mouthLowerDownRight: 48,
    mouthUpperUpLeft: 49, mouthUpperUpRight: 50,
    // Tongue
    tongueOut: 51
} as const;

// =============================================================================
// VRM Expression Mapping
// =============================================================================

/**
 * Maps simplified face data to VRM expressions
 * This is the basic mapping used when full ARKit blendshapes aren't available
 */
export function mapSimpleToVRM(vrm: VRM, faceData: SimpleFaceData): void {
    const exp = vrm.expressionManager;
    if (!exp) return;

    // Basic lip sync - maps mouth openness to 'aa' viseme
    exp.setValue(VRMExpressionPresetName.Aa, faceData.mouthOpen);

    // Eye blinks
    exp.setValue(VRMExpressionPresetName.BlinkLeft, faceData.leftEyeBlink);
    exp.setValue(VRMExpressionPresetName.BlinkRight, faceData.rightEyeBlink);
}

/**
 * Maps full ARKit blendshapes (as Float32Array) to VRM expressions
 * @compliance specs/vrm-integration/spec.md §3
 */
export function mapARKitToVRM(vrm: VRM, coefficients: Float32Array): void {
    const exp = vrm.expressionManager;
    if (!exp) return;

    const getVal = (idx: number) => coefficients[idx] ?? 0;

    // --- Eye Blinks ---
    exp.setValue(VRMExpressionPresetName.BlinkLeft, getVal(ARKitIndex.eyeBlinkLeft));
    exp.setValue(VRMExpressionPresetName.BlinkRight, getVal(ARKitIndex.eyeBlinkRight));

    // --- Visemes (Lip Sync) ---
    const jawOpen = getVal(ARKitIndex.jawOpen);
    const mouthFunnel = getVal(ARKitIndex.mouthFunnel);
    const mouthPucker = getVal(ARKitIndex.mouthPucker);
    const mouthSmile = (getVal(ARKitIndex.mouthSmileLeft) + getVal(ARKitIndex.mouthSmileRight)) / 2;
    const mouthStretch = (getVal(ARKitIndex.mouthStretchLeft) + getVal(ARKitIndex.mouthStretchRight)) / 2;

    // Aa - Wide open mouth (like saying "ah")
    // Derived from jaw opening with some mouth opening
    const aa = Math.min(1, jawOpen * 1.2);
    exp.setValue(VRMExpressionPresetName.Aa, aa);

    // Ih - Slightly closed teeth smile (like saying "ih" in "bit")
    // Derived from smile with closed jaw
    const ih = Math.min(1, mouthStretch * 0.8 + mouthSmile * 0.3);
    exp.setValue(VRMExpressionPresetName.Ih, ih * (1 - jawOpen * 0.5));

    // Ou - Rounded lips pushed forward (like saying "oo" in "boot")
    // Derived from mouth pucker
    const ou = Math.min(1, mouthPucker * 1.2);
    exp.setValue(VRMExpressionPresetName.Ou, ou);

    // Oh - Medium open rounded mouth (like saying "oh")
    // Derived from funnel + some jaw open
    const oh = Math.min(1, mouthFunnel * 0.8 + jawOpen * 0.3);
    exp.setValue(VRMExpressionPresetName.Oh, oh);

    // Ee - Wide smile with teeth showing (like saying "ee" in "bee")
    // Derived from strong smile
    const ee = Math.min(1, mouthSmile * 1.2);
    exp.setValue(VRMExpressionPresetName.Ee, ee * (1 - jawOpen * 0.3));

    // --- Emotions ---
    // These require blendshape combinations

    // Happy - derived from smiling
    const happy = mouthSmile;
    exp.setValue(VRMExpressionPresetName.Happy, happy);

    // Angry - derived from brow down and nose sneer
    const browDown = (getVal(ARKitIndex.browDownLeft) + getVal(ARKitIndex.browDownRight)) / 2;
    const noseSneer = (getVal(ARKitIndex.noseSneerLeft) + getVal(ARKitIndex.noseSneerRight)) / 2;
    const angry = Math.min(1, browDown * 0.7 + noseSneer * 0.5);
    exp.setValue(VRMExpressionPresetName.Angry, angry);

    // Sad - derived from frown
    const mouthFrown = (getVal(ARKitIndex.mouthFrownLeft) + getVal(ARKitIndex.mouthFrownRight)) / 2;
    const sad = mouthFrown;
    exp.setValue(VRMExpressionPresetName.Sad, sad);

    // Surprised - derived from wide eyes and brow up
    const eyeWide = (getVal(ARKitIndex.eyeWideLeft) + getVal(ARKitIndex.eyeWideRight)) / 2;
    const browUp = getVal(ARKitIndex.browInnerUp);
    const surprised = Math.min(1, eyeWide * 0.6 + browUp * 0.5);
    exp.setValue(VRMExpressionPresetName.Surprised, surprised);

    // --- Look At ---
    const lookLeft = (getVal(ARKitIndex.eyeLookInRight) + getVal(ARKitIndex.eyeLookOutLeft)) / 2;
    const lookRight = (getVal(ARKitIndex.eyeLookInLeft) + getVal(ARKitIndex.eyeLookOutRight)) / 2;
    const lookUp = (getVal(ARKitIndex.eyeLookUpLeft) + getVal(ARKitIndex.eyeLookUpRight)) / 2;
    const lookDown = (getVal(ARKitIndex.eyeLookDownLeft) + getVal(ARKitIndex.eyeLookDownRight)) / 2;

    exp.setValue(VRMExpressionPresetName.LookLeft, lookLeft);
    exp.setValue(VRMExpressionPresetName.LookRight, lookRight);
    exp.setValue(VRMExpressionPresetName.LookUp, lookUp);
    exp.setValue(VRMExpressionPresetName.LookDown, lookDown);
}

// =============================================================================
// Viseme Analysis (Audio-based)
// =============================================================================

/**
 * Viseme weights derived from audio frequency analysis
 */
export interface VisemeWeights {
    aa: number; // Open vowel (ah, a)
    ee: number; // Front close vowel (ee, i)
    ih: number; // Near-close front vowel (ih, e)
    oh: number; // Back mid vowel (oh, o)
    ou: number; // Close back vowel (oo, u)
}

/**
 * Frequency bands for viseme detection
 * Based on formant frequencies of vowels
 */
const VISEME_FORMANTS = {
    // F1 (first formant) ranges in Hz
    aa: { f1Min: 700, f1Max: 1000 },   // Open vowel
    ee: { f1Min: 250, f1Max: 400 },    // Close front
    ih: { f1Min: 400, f1Max: 600 },    // Near-close front
    oh: { f1Min: 500, f1Max: 700 },    // Mid back
    ou: { f1Min: 300, f1Max: 500 },    // Close back
};

/**
 * Normalizes frequency bin to 0-1 range
 */
function normalizeFrequency(value: number): number {
    return Math.min(1, Math.max(0, value / 255));
}

/**
 * Analyzes FFT data to extract viseme weights
 * 
 * @param frequencyData - Uint8Array from AnalyserNode.getByteFrequencyData()
 * @param sampleRate - Audio context sample rate (typically 44100 or 48000)
 * @param fftSize - FFT size used by the analyser
 */
export function analyzeVisemes(
    frequencyData: Uint8Array,
    sampleRate: number,
    fftSize: number
): VisemeWeights {
    const binCount = frequencyData.length;
    const binWidth = sampleRate / fftSize;

    // Convert frequency to bin index
    const freqToBin = (freq: number) => Math.round(freq / binWidth);

    // Get average energy in a frequency range
    const getEnergy = (minFreq: number, maxFreq: number): number => {
        const minBin = Math.max(0, freqToBin(minFreq));
        const maxBin = Math.min(binCount - 1, freqToBin(maxFreq));

        if (maxBin <= minBin) return 0;

        let sum = 0;
        for (let i = minBin; i <= maxBin; i++) {
            sum += frequencyData[i];
        }
        return normalizeFrequency(sum / (maxBin - minBin + 1));
    };

    // Analyze formant regions for each viseme
    const weights: VisemeWeights = {
        aa: getEnergy(VISEME_FORMANTS.aa.f1Min, VISEME_FORMANTS.aa.f1Max),
        ee: getEnergy(VISEME_FORMANTS.ee.f1Min, VISEME_FORMANTS.ee.f1Max),
        ih: getEnergy(VISEME_FORMANTS.ih.f1Min, VISEME_FORMANTS.ih.f1Max),
        oh: getEnergy(VISEME_FORMANTS.oh.f1Min, VISEME_FORMANTS.oh.f1Max),
        ou: getEnergy(VISEME_FORMANTS.ou.f1Min, VISEME_FORMANTS.ou.f1Max),
    };

    // Normalize to make one viseme dominant
    const total = weights.aa + weights.ee + weights.ih + weights.oh + weights.ou;
    if (total > 0.1) {
        weights.aa /= total;
        weights.ee /= total;
        weights.ih /= total;
        weights.oh /= total;
        weights.ou /= total;
    }

    return weights;
}

/**
 * Applies viseme weights to VRM model
 */
export function applyVisemesToVRM(vrm: VRM, visemes: VisemeWeights, intensity: number = 1): void {
    const exp = vrm.expressionManager;
    if (!exp) return;

    exp.setValue(VRMExpressionPresetName.Aa, visemes.aa * intensity);
    exp.setValue(VRMExpressionPresetName.Ee, visemes.ee * intensity);
    exp.setValue(VRMExpressionPresetName.Ih, visemes.ih * intensity);
    exp.setValue(VRMExpressionPresetName.Oh, visemes.oh * intensity);
    exp.setValue(VRMExpressionPresetName.Ou, visemes.ou * intensity);
}

/**
 * Applies a global expression (from hotkeys) to the VRM model
 */
export function applyExpressionToVRM(vrm: VRM, expression: string, intensity: number = 1): void {
    const exp = vrm.expressionManager;
    if (!exp) return;

    // Map string expression to VRM preset
    const mapping: Record<string, VRMExpressionPresetName> = {
        happy: VRMExpressionPresetName.Happy,
        sad: VRMExpressionPresetName.Sad,
        angry: VRMExpressionPresetName.Angry,
        surprised: VRMExpressionPresetName.Surprised,
        neutral: VRMExpressionPresetName.Neutral,
    };

    const preset = mapping[expression];
    if (preset) {
        // Set all other emotional expressions to 0 to avoid mixing weirdly 
        // unless you want additive, but for hotkeys clean swap is better.
        [
            VRMExpressionPresetName.Happy,
            VRMExpressionPresetName.Sad,
            VRMExpressionPresetName.Angry,
            VRMExpressionPresetName.Surprised,
            VRMExpressionPresetName.Neutral
        ].forEach(p => exp.setValue(p, 0));

        exp.setValue(preset, intensity);
    }
}

// =============================================================================
// SDD Class Implementation
// =============================================================================

import * as THREE from 'three';

/**
 * VRM Avatar Entity implementation
 * @compliance specs/vrm-integration/spec.md §2
 */
export class VRMAvatarEntity implements AvatarEntity {
    public readonly model: THREE.Group;
    public readonly vrm: VRM;

    constructor(vrm: VRM) {
        this.vrm = vrm;
        this.model = vrm.scene;
    }

    public applyBlendShapes(data: BlendShapeData): void {
        const exp = this.vrm.expressionManager;
        if (!exp) return;

        // Apply coefficients
        mapARKitToVRM(this.vrm, data.coefficients);

        // Apply head rotation
        const [x, y, z, w] = data.headRotation;
        this.model.quaternion.set(x, y, z, w);
    }

    public update(deltaTime: number, camera?: THREE.Camera): void {
        this.vrm.update(deltaTime);
    }

    public dispose(): void {
        // Constitution §4 - Clean up resources
        this.vrm.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.geometry.dispose();

                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });

        // Use VRMUtils if available in global context or imported
        // (Assuming deepDispose is available via VRMUtils in CustomModelAvatar)
    }
}
