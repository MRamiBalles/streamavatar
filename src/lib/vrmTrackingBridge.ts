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
 */

import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';

// =============================================================================
// Type Definitions
// =============================================================================

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
 * Simplified face data (what we currently extract from MediaPipe)
 */
export interface SimpleFaceData {
    headRotation: { x: number; y: number; z: number };
    mouthOpen: number;
    leftEyeBlink: number;
    rightEyeBlink: number;
}

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
 * Maps full ARKit blendshapes to VRM expressions
 * This provides much richer facial animation when available
 */
export function mapARKitToVRM(vrm: VRM, blendshapes: Partial<ARKitBlendshapes>): void {
    const exp = vrm.expressionManager;
    if (!exp) return;

    // --- Eye Blinks ---
    if (blendshapes.eyeBlinkLeft !== undefined) {
        exp.setValue(VRMExpressionPresetName.BlinkLeft, blendshapes.eyeBlinkLeft);
    }
    if (blendshapes.eyeBlinkRight !== undefined) {
        exp.setValue(VRMExpressionPresetName.BlinkRight, blendshapes.eyeBlinkRight);
    }

    // --- Visemes (Lip Sync) ---
    // VRM defines 5 vowel visemes: Aa, Ee, Ih, Oh, Ou
    // We derive these from combinations of ARKit mouth blendshapes

    const jawOpen = blendshapes.jawOpen ?? 0;
    const mouthFunnel = blendshapes.mouthFunnel ?? 0;
    const mouthPucker = blendshapes.mouthPucker ?? 0;
    const mouthSmile = ((blendshapes.mouthSmileLeft ?? 0) + (blendshapes.mouthSmileRight ?? 0)) / 2;
    const mouthStretch = ((blendshapes.mouthStretchLeft ?? 0) + (blendshapes.mouthStretchRight ?? 0)) / 2;

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
    const browDown = ((blendshapes.browDownLeft ?? 0) + (blendshapes.browDownRight ?? 0)) / 2;
    const noseSneer = ((blendshapes.noseSneerLeft ?? 0) + (blendshapes.noseSneerRight ?? 0)) / 2;
    const angry = Math.min(1, browDown * 0.7 + noseSneer * 0.5);
    exp.setValue(VRMExpressionPresetName.Angry, angry);

    // Sad - derived from frown
    const mouthFrown = ((blendshapes.mouthFrownLeft ?? 0) + (blendshapes.mouthFrownRight ?? 0)) / 2;
    const sad = mouthFrown;
    exp.setValue(VRMExpressionPresetName.Sad, sad);

    // Surprised - derived from wide eyes and brow up
    const eyeWide = ((blendshapes.eyeWideLeft ?? 0) + (blendshapes.eyeWideRight ?? 0)) / 2;
    const browUp = blendshapes.browInnerUp ?? 0;
    const surprised = Math.min(1, eyeWide * 0.6 + browUp * 0.5);
    exp.setValue(VRMExpressionPresetName.Surprised, surprised);

    // --- Look At ---
    // VRM has lookLeft, lookRight, lookUp, lookDown
    const lookLeft = ((blendshapes.eyeLookInRight ?? 0) + (blendshapes.eyeLookOutLeft ?? 0)) / 2;
    const lookRight = ((blendshapes.eyeLookInLeft ?? 0) + (blendshapes.eyeLookOutRight ?? 0)) / 2;
    const lookUp = ((blendshapes.eyeLookUpLeft ?? 0) + (blendshapes.eyeLookUpRight ?? 0)) / 2;
    const lookDown = ((blendshapes.eyeLookDownLeft ?? 0) + (blendshapes.eyeLookDownRight ?? 0)) / 2;

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
