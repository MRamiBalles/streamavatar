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

        // Diagnostic dots hidden by default for production feel
        // Set to true if you want to debug alignment
        groupRef.current.visible = false;

        // Match the background plane scaling math
        const planeZ = -9.9; // Just in front of the video plane at -10
        const cameraZ = 4;
        const distanceToCamera = Math.abs(cameraZ - planeZ);

        const fov = (useThree.getState().camera as THREE.PerspectiveCamera).fov || 50;
        const aspect = viewport.aspect;

        const activeHeight = 2 * Math.tan((fov * Math.PI) / 180 / 2) * distanceToCamera;
        const activeWidth = activeHeight * aspect;

        const points = groupRef.current.children;
        faceData.facePoints.forEach((p, i) => {
            if (points[i]) {
                // p.x/y are in [-0.5, 0.5] range. Map to unit space.
                points[i].position.set(p.x * activeWidth, p.y * activeHeight, planeZ);
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
