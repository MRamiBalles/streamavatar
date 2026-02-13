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
    const { viewport, camera } = useThree();

    useFrame(() => {
        if (!groupRef.current) return;

        const { faceData, isTracking, background } = useAvatarStore.getState();
        if (!isTracking || !faceData.facePoints || faceData.facePoints.length === 0) {
            groupRef.current.visible = false;
            return;
        }

        groupRef.current.visible = true;

        // In AR mode, place dots near the video plane; otherwise place near camera
        const isAR = background === 'ar-camera';
        const planeZ = isAR ? -9.0 : 1.0; // z=1 is in front of camera at z=4
        const cameraZ = 4;
        const distanceToCamera = Math.abs(cameraZ - planeZ);

        const fov = (camera as THREE.PerspectiveCamera).fov || 50;
        const aspect = viewport.aspect;

        const activeHeight = 2 * Math.tan((fov * Math.PI) / 180 / 2) * distanceToCamera;
        const activeWidth = activeHeight * aspect;

        const points = groupRef.current.children;
        faceData.facePoints.forEach((p, i) => {
            if (points[i]) {
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
