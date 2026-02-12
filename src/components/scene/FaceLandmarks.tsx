import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { useAvatarStore } from '@/stores/avatarStore';
import * as THREE from 'three';

/**
 * FaceLandmarks Component
 * 
 * Diagnostic tool that renders red dots on detected facial landmarks.
 * Helps align the avatar with the real-world face in AR mode.
 */
export const FaceLandmarks = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();

    useFrame(() => {
        if (!groupRef.current) return;

        const { faceData, isTracking } = useAvatarStore.getState();
        if (!isTracking || !faceData.facePoints) {
            groupRef.current.visible = false;
            return;
        }

        groupRef.current.visible = true;

        // Visual multipliers to match the AR background plane coverage
        // Plane is at z=-10, visible dims are roughly viewport.width/height * scaling
        // Since we are at z=0, we use specific scene scale
        const scaleX = 8;
        const scaleY = 6;

        const points = groupRef.current.children;
        faceData.facePoints.forEach((p, i) => {
            if (points[i]) {
                points[i].position.set(p.x * scaleX, p.y * scaleY, 0.1);
            }
        });
    });

    // Create a pool of dots (24 based on the indices we picked)
    return (
        <group ref={groupRef}>
            {Array.from({ length: 24 }).map((_, i) => (
                <Sphere key={i} args={[0.04, 8, 8]}>
                    <meshBasicMaterial color="#ff0000" toneMapped={false} />
                </Sphere>
            ))}
        </group>
    );
};
