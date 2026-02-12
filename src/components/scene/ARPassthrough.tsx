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
        console.log('[ARPassthrough] videoElement:', videoElement);
        if (videoElement && !textureRef.current) {
            console.log('[ARPassthrough] Creating new VideoTexture');
            // Create video texture from the existing video element in FaceTracker
            const texture = new THREE.VideoTexture(videoElement);
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;

            if (meshRef.current) {
                console.log('[ARPassthrough] applying texture to mesh');
                (meshRef.current.material as THREE.MeshBasicMaterial).map = texture;
                (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
        }
    }, [videoElement]);

    // Keep the plane filling the screen
    const scale = [viewport.width, viewport.height, 1] as [number, number, number];

    return (
        <mesh ref={meshRef} position={[0, 0, -10]} scale={scale}>
            <planeGeometry />
            <meshBasicMaterial toneMapped={false} />
        </mesh>
    );
};
