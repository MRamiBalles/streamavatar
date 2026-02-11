import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore, AvatarPart } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

// Eye blink timing configuration
const EYE_CONFIG = {
    blinkInterval: { min: 2000, max: 6000 }, // Random interval between blinks
    blinkDuration: 150, // How long a blink takes
};

const PartRenderer = ({ part, anim }: { part: AvatarPart; anim: any }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const blinkStateRef = useRef({
        nextBlinkTime: Date.now() + Math.random() * 3000,
        isBlinking: false,
        blinkStartTime: 0,
    });

    useFrame(() => {
        if (!meshRef.current) return;

        // Apply basic transformations from store
        meshRef.current.position.set(...part.position);
        meshRef.current.rotation.set(...part.rotation);
        meshRef.current.scale.set(...part.scale);

        const partIdLower = part.id.toLowerCase();

        // Animation Injection logic
        // If it's a 'head' type or named 'head', apply head tracking
        if (part.type === 'head' || partIdLower.includes('head')) {
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, anim.headRotation.x, 0.1);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, anim.headRotation.y, 0.1);
            meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, anim.headRotation.z, 0.1);
        }

        // Breathing effect (global scale additive)
        const breath = part.type === 'body' ? anim.breathScale : 1;
        meshRef.current.scale.multiplyScalar(breath);

        // Lip-sync for mouth parts
        if (partIdLower.includes('mouth')) {
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.2 + anim.mouthOpen * 1.5, 0.2);
        }

        // Eye blink animation for eye parts
        if (partIdLower.includes('lefteye') || partIdLower.includes('left_eye') || partIdLower.includes('eye_left')) {
            // Use tracking blink if available, otherwise procedural
            const blinkValue = anim.leftEyeBlink > 0.1 ? anim.leftEyeBlink : getProceduralBlink(blinkStateRef.current);
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1 - blinkValue * 0.9, 0.3);
        }
        if (partIdLower.includes('righteye') || partIdLower.includes('right_eye') || partIdLower.includes('eye_right')) {
            // Use tracking blink if available, otherwise procedural
            const blinkValue = anim.rightEyeBlink > 0.1 ? anim.rightEyeBlink : getProceduralBlink(blinkStateRef.current);
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1 - blinkValue * 0.9, 0.3);
        }
        // Generic 'eye' part (both eyes)
        if (partIdLower === 'eye' || partIdLower === 'eyes') {
            const avgBlink = (anim.leftEyeBlink + anim.rightEyeBlink) / 2;
            const blinkValue = avgBlink > 0.1 ? avgBlink : getProceduralBlink(blinkStateRef.current);
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1 - blinkValue * 0.9, 0.3);
        }

        // Expression effects (subtle color/rotation shift)
        if (anim.activeExpression === 'angry' && (part.type === 'head' || partIdLower.includes('head'))) {
            meshRef.current.rotation.x += Math.sin(Date.now() * 0.05) * 0.02; // Shake head slightly
        }

        // Eyebrow effects based on expression
        if (partIdLower.includes('eyebrow') || partIdLower.includes('brow')) {
            let browOffset = 0;
            switch (anim.activeExpression) {
                case 'happy':
                    browOffset = 0.1; // Raise brows
                    break;
                case 'sad':
                    browOffset = -0.15; // Inner brows down
                    meshRef.current.rotation.z = partIdLower.includes('left') ? 0.2 : -0.2;
                    break;
                case 'angry':
                    browOffset = -0.1; // Lower brows
                    meshRef.current.rotation.z = partIdLower.includes('left') ? -0.3 : 0.3;
                    break;
                case 'surprised':
                    browOffset = 0.2; // Raise high
                    break;
            }
            meshRef.current.position.y = part.position[1] + browOffset;
        }
    });

    const materialProps = {
        color: part.color,
        roughness: 0.3,
        metalness: 0.1,
    };

    switch (part.type) {
        case 'sphere':
        case 'head':
            return <Sphere ref={meshRef} args={[1, 32, 32]}><meshStandardMaterial {...materialProps} /></Sphere>;
        case 'box':
        case 'body':
            return <Box ref={meshRef} args={[1, 1, 1]}><meshStandardMaterial {...materialProps} /></Box>;
        case 'cylinder':
            return <Cylinder ref={meshRef} args={[1, 1, 2, 32]}><meshStandardMaterial {...materialProps} /></Cylinder>;
        case 'torus':
            return <Torus ref={meshRef} args={[1, 0.3, 16, 100]}><meshStandardMaterial {...materialProps} /></Torus>;
        default:
            return <Sphere ref={meshRef} args={[1, 16, 16]}><meshStandardMaterial {...materialProps} /></Sphere>;
    }
};

/**
 * Procedural blink generator for parts without face tracking
 */
function getProceduralBlink(state: { nextBlinkTime: number; isBlinking: boolean; blinkStartTime: number }): number {
    const now = Date.now();
    
    if (!state.isBlinking && now >= state.nextBlinkTime) {
        // Start a blink
        state.isBlinking = true;
        state.blinkStartTime = now;
    }
    
    if (state.isBlinking) {
        const elapsed = now - state.blinkStartTime;
        if (elapsed >= EYE_CONFIG.blinkDuration) {
            // End blink
            state.isBlinking = false;
            state.nextBlinkTime = now + EYE_CONFIG.blinkInterval.min + 
                Math.random() * (EYE_CONFIG.blinkInterval.max - EYE_CONFIG.blinkInterval.min);
            return 0;
        }
        // Blink curve: quick close, slower open
        const progress = elapsed / EYE_CONFIG.blinkDuration;
        return Math.sin(progress * Math.PI); // Smooth blink curve
    }
    
    return 0;
}

export const CompositeAvatar = () => {
    const currentParts = useAvatarStore((s) => s.currentParts);
    const avatarScale = useAvatarStore((s) => s.avatarScale);
    const { getAnimationState } = useAvatarAnimation();
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            // Small bounce/vibe animation
            const anim = getAnimationState();
            groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.05;
        }
    });

    return (
        <group ref={groupRef} scale={avatarScale}>
            {currentParts.length === 0 ? (
                // Placeholder if no parts
                <Sphere args={[0.5, 32, 32]}>
                    <meshStandardMaterial color="#666" wireframe />
                </Sphere>
            ) : (
                currentParts.map((part) => (
                    <PartRenderer key={part.id} part={part} anim={getAnimationState()} />
                ))
            )}
        </group>
    );
};
