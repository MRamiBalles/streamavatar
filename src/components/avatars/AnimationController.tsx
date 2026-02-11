import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { VRM } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';
import { useFaceRetargeting } from '@/hooks/useFaceRetargeting';
import { useAudioLipSync } from '@/hooks/useAudioLipSync';

interface AnimationControllerProps {
    vrm: VRM | null;
}

/**
 * AnimationController Component
 * 
 * Decouples "Motion Signals" (MediaPipe, Audio) from the "Visual Asset".
 * This follows the AHA! architecture: Synthesis of motion is a separate layer.
 */
export const AnimationController = ({ vrm }: AnimationControllerProps) => {
    const lipSyncEnabled = useAvatarStore((s) => s.lipSyncEnabled);

    // 1. MOTION SIGNAL: Face Tracking (MediaPipe)
    // We pass ignoreMouth if Audio Lip Sync is active to avoid conflicts
    useFaceRetargeting(vrm, { ignoreMouth: lipSyncEnabled });

    // 2. MOTION SIGNAL: Audio Analysis (Phonetic Visemes)
    const lipSync = useAudioLipSync({ autoStart: lipSyncEnabled });

    // 3. INTERNAL ANIMATION: Physics (SpringBones) & Auto-blink
    useFrame((state, delta) => {
        if (vrm) {
            // Apply lip sync to VRM if active
            if (lipSyncEnabled) {
                lipSync.applyToVRM(vrm);
            }
            
            // Update physical components independently of external signals
            vrm.update(delta);
        }
    });

    return null; // This is a logic-only component
};
