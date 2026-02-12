import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useAvatarStore } from '@/stores/avatarStore';

export const ARPassthrough = () => {
    const videoElement = useAvatarStore((state) => state.videoElement);
    const meshRef = useRef<THREE.Mesh>(null);
    const textureRef = useRef<THREE.VideoTexture | null>(null);
    const { size, viewport } = useThree();

    useEffect(() => {
        if (videoElement && !textureRef.current) {
            // Create video texture from the existing video element in FaceTracker
            const texture = new THREE.VideoTexture(videoElement);
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;

            if (meshRef.current) {
                (meshRef.current.material as THREE.MeshBasicMaterial).map = texture;
                (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
        }
    }, [videoElement]);

    // Calculate the size of the plane at depth -10 to fill the view
    // Camera is at [0, 0, 4], Plane is at [0, 0, -10]. 
    // Distance from camera to plane = 4 - (-10) = 14 units.
    const planeZ = -10;
    const cameraZ = 4;
    const distanceToCamera = Math.abs(cameraZ - planeZ);

    const fov = useThree((state) => state.camera instanceof THREE.PerspectiveCamera ? state.camera.fov : 50);
    const aspect = useThree((state) => state.viewport.aspect);

    // Physical height of the view frustum at z = planeZ
    const viewHeight = 2 * Math.tan((fov * Math.PI) / 180 / 2) * distanceToCamera;
    const viewWidth = viewHeight * aspect;

    return (
        <mesh ref={meshRef} position={[0, 0, planeZ]} scale={[viewWidth, viewHeight, 1]}>
            <planeGeometry />
            <meshBasicMaterial toneMapped={false} />
        </mesh>
    );
};
