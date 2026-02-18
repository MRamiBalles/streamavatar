import { useLoader, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore - three examples loaders lack type declarations
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { debugLog, debugError } from '@/lib/debugLog';

interface STLAvatarProps {
    url: string;
}

export const STLAvatar = ({ url }: STLAvatarProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Store state
    const avatarColor = useAvatarStore((s) => s.avatarColor);
    const avatarScale = useAvatarStore((s) => s.avatarScale);
    const customModelRotation = useAvatarStore((s) => s.customModelRotation);
    const { getAnimationState } = useAvatarAnimation();

    // Load Geometry
    const geometry = useLoader(STLLoader, url);

    // Normalize Geometry (Center & Scale)
    const normalizedGeometry = useMemo(() => {
        if (!geometry) return null;
        const geom = geometry.clone();
        geom.center();
        geom.computeBoundingBox();
        const box = geom.boundingBox;
        if (box) {
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxSize; // Target size ~1.5 units
            geom.scale(scale, scale, scale);
            // Re-center after scaling
            geom.center();
            // Offset Y to sit on neck (approx)
            geom.translate(0, 0.2, 0);
        }
        return geom;
    }, [geometry]);

    // Animation Loop
    useFrame(() => {
        const anim = getAnimationState();
        if (groupRef.current) {
            // Head Rotation - Faster response (0.1 -> 0.25)
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, anim.headRotation.x, 0.25);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, -anim.headRotation.y, 0.25);
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, anim.headRotation.z, 0.25);
        }
    });

    return (
        <group scale={avatarScale}>
            <group ref={groupRef} rotation={customModelRotation.map(d => THREE.MathUtils.degToRad(d)) as unknown as THREE.Euler}>
                {normalizedGeometry && (
                    <mesh ref={meshRef} geometry={normalizedGeometry} castShadow receiveShadow>
                        <meshStandardMaterial
                            color={avatarColor}
                            roughness={0.5}
                            metalness={0.2}
                        />
                    </mesh>
                )}
            </group>
        </group>
    );
};
