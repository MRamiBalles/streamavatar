import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useFaceTracker } from '@/hooks/useFaceTracker';

export const ARPassthrough = () => {
    const { videoRef } = useFaceTracker();
    const meshRef = useRef<THREE.Mesh>(null);
    const textureRef = useRef<THREE.VideoTexture | null>(null);
    const { size, viewport } = useThree();

    useEffect(() => {
        if (videoRef.current && !textureRef.current) {
            // Create video texture from the existing video element in FaceTracker
            const texture = new THREE.VideoTexture(videoRef.current);
            texture.colorSpace = THREE.SRGBColorSpace;
            textureRef.current = texture;

            if (meshRef.current) {
                (meshRef.current.material as THREE.MeshBasicMaterial).map = texture;
                (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
        }
    }, [videoRef]);

    // Keep the plane filling the screen
    const scale = [viewport.width, viewport.height, 1] as [number, number, number];

    return (
        <mesh ref={meshRef} position={[0, 0, -10]} scale={scale}>
            <planeGeometry />
            <meshBasicMaterial toneMapped={false} />
        </mesh>
    );
};
