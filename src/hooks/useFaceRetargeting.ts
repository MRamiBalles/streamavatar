import { useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';

/**
 * useFaceRetargeting Hook
 * 
 * Maps MediaPipe ARKit blendshapes (52 shapes) to standard VRM expressions.
 * This acts as the "Standardization Bridge" between the webcam tracking and the Avatar.
 */
export const useFaceRetargeting = (vrm: VRM | null, options?: { ignoreMouth?: boolean }) => {
    const { faceData } = useAvatarStore();

    useEffect(() => {
        if (!vrm || !vrm.expressionManager || !vrm.humanoid) return;

        // 1. BLINK MAPPING
        // ARKit 'eyeBlinkLeft' -> VRM 'blinkLeft'
        // ARKit 'eyeBlinkRight' -> VRM 'blinkRight'
        const blinkL = faceData.leftEyeBlink || 0;
        const blinkR = faceData.rightEyeBlink || 0;

        // VRM 0.0 standard usually has 'blink', 'blink_l', 'blink_r'
        vrm.expressionManager.setValue('blink_l', blinkL);
        vrm.expressionManager.setValue('blink_r', blinkR);

        // Fallback if individual blinks aren't supported well in the model
        if (blinkL > 0.5 && blinkR > 0.5) {
            vrm.expressionManager.setValue('blink', (blinkL + blinkR) / 2);
        }

        // 2. MOUTH MAPPING (Basic Vowel Approximation)
        // Only apply if not ignored (e.g., when Audio Lip Sync is active)
        if (!options?.ignoreMouth) {
            // Real Audio2Face will replace this, but for now we map openness to "Aa"
            // In a full implementation, we would map jawOpen, mouthFunnel, etc.
            const mouthOpen = faceData.mouthOpen || 0;

            // Thresholds for simple vowel approximation based on mouth shape
            // This is a heuristic until we have the Phonetic analyzer
            vrm.expressionManager.setValue('aa', mouthOpen);
        }

        // If we had more detailed ARKit data in faceData (requires updating face tracker to expose all 52 shapes)
        // we would map:
        // jawOpen -> aa
        // mouthFunnel -> ou
        // mouthPucker -> ou
        // mouthSmile -> joy

        // 3. HEAD ROTATION
        const headNode = vrm.humanoid.getNormalizedBoneNode('head');
        if (headNode) {
            // MediaPipe rotation needs to be dampened and coordinate-swapped for VRM
            // VRM looks at +Z, MediaPipe might vary.
            // Assuming faceData.headRotation is already normalized to Euler angles sensible for Three.js
            headNode.rotation.set(
                faceData.headRotation.x * 0.8, // Dampen pitch
                faceData.headRotation.y * 0.8, // Dampen yaw
                faceData.headRotation.z * 0.5  // Dampen roll
            );
        }

        vrm.expressionManager.update();

    }, [vrm, faceData, options?.ignoreMouth]);
};
