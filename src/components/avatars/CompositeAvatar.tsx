import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore, AvatarPart } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

const PartRenderer = ({ part, anim }: { part: AvatarPart; anim: any }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!meshRef.current) return;

        // Apply basic transformations from store
        meshRef.current.position.set(...part.position);
        meshRef.current.rotation.set(...part.rotation);
        meshRef.current.scale.set(...part.scale);

        // Animation Injection logic
        // If it's a 'head' type or named 'head', apply head tracking
        if (part.type === 'head' || part.id.toLowerCase().includes('head')) {
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, anim.headRotation.x, 0.1);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, anim.headRotation.y, 0.1);
            meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, anim.headRotation.z, 0.1);
        }

        // Breathing effect (global scale additive)
        const breath = part.type === 'body' ? anim.breathScale : 1;
        meshRef.current.scale.multiplyScalar(breath);

        // Lip-sync for mouth parts
        if (part.id.toLowerCase().includes('mouth')) {
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.2 + anim.mouthOpen * 1.5, 0.2);
        }

        // Expression effects (subtle color/rotation shift)
        if (anim.activeExpression === 'angry' && (part.type === 'head' || part.id.toLowerCase().includes('head'))) {
            meshRef.current.rotation.x += Math.sin(Date.now() * 0.05) * 0.02; // Shake head slightly
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

export const CompositeAvatar = () => {
    const { currentParts, avatarScale } = useAvatarStore();
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
