import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Capsule, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

export const PillAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  
  const { avatarColor, avatarScale, faceData, audioData, audioReactiveEnabled } = useAvatarStore();
  
  useFrame(() => {
    if (groupRef.current) {
      // Smooth head rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        faceData.headRotation.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -faceData.headRotation.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        faceData.headRotation.z,
        0.1
      );
    }
    
    // Audio reactive scaling
    if (bodyRef.current && audioReactiveEnabled) {
      const audioScale = 1 + audioData.bass * 0.15;
      bodyRef.current.scale.x = THREE.MathUtils.lerp(bodyRef.current.scale.x, audioScale, 0.2);
      bodyRef.current.scale.z = THREE.MathUtils.lerp(bodyRef.current.scale.z, audioScale, 0.2);
    }
    
    // Animate mouth - combine face tracking and audio
    if (mouthRef.current) {
      const faceOpenness = faceData.mouthOpen;
      const audioOpenness = audioReactiveEnabled ? audioData.volume * 0.5 : 0;
      const mouthScale = 0.1 + Math.max(faceOpenness, audioOpenness) * 0.4;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        mouthScale,
        0.2
      );
    }
    
    // Animate eyes (blink)
    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        1 - faceData.leftEyeBlink * 0.9,
        0.3
      );
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        1 - faceData.rightEyeBlink * 0.9,
        0.3
      );
    }
  });

  return (
    <group ref={groupRef} scale={avatarScale}>
      {/* Main pill body */}
      <Capsule ref={bodyRef} args={[0.6, 1.2, 16, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={avatarColor} roughness={0.4} metalness={0.1} />
      </Capsule>
      
      {/* Left eye */}
      <Sphere ref={leftEyeRef} args={[0.15, 16, 16]} position={[-0.25, 0.3, 0.5]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[-0.25, 0.3, 0.6]}>
        <meshStandardMaterial color="#1a1a2e" />
      </Sphere>
      
      {/* Right eye */}
      <Sphere ref={rightEyeRef} args={[0.15, 16, 16]} position={[0.25, 0.3, 0.5]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.25, 0.3, 0.6]}>
        <meshStandardMaterial color="#1a1a2e" />
      </Sphere>
      
      {/* Mouth */}
      <Sphere ref={mouthRef} args={[0.15, 16, 16]} position={[0, -0.15, 0.55]} scale={[1.5, 0.1, 1]}>
        <meshStandardMaterial color="#2a1a1a" />
      </Sphere>
      
      {/* Highlights/texture spots */}
      <Sphere args={[0.12, 16, 16]} position={[-0.35, 0.6, 0.35]}>
        <meshStandardMaterial color="#e8c9a0" transparent opacity={0.5} />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.4, 0.5, 0.3]}>
        <meshStandardMaterial color="#e8c9a0" transparent opacity={0.4} />
      </Sphere>
    </group>
  );
};
