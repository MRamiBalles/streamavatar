/**
 * StreamAvatar - Sphere (Slime) Avatar Component
 * 
 * A bouncy, slime-like spherical avatar with expressive features.
 * Now powered by the unified animation system for natural idle behavior.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { AvatarHalfBodyFixed } from './AvatarHalfBodyFixed';

export const SphereAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  const avatarColor = useAvatarStore((s) => s.avatarColor);
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const { getAnimationState } = useAvatarAnimation();

  useFrame(() => {
    const anim = getAnimationState();

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        anim.headRotation.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -anim.headRotation.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        anim.headRotation.z,
        0.1
      );
    }

    // Body breathing + audio reactive
    if (bodyRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      let targetScale = anim.breathScale;
      if (audioReactiveEnabled) {
        targetScale = Math.max(targetScale, 1 + audioData.bass * 0.2);
      }
      bodyRef.current.scale.set(
        THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScale, 0.15),
        THREE.MathUtils.lerp(bodyRef.current.scale.y, targetScale * 0.98, 0.15),
        THREE.MathUtils.lerp(bodyRef.current.scale.z, targetScale, 0.15)
      );
    }

    if (mouthRef.current) {
      // Boosted sensitivity for clearer AR expressions
      const mouthScale = 0.08 + anim.mouthOpen * 0.7;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        mouthScale,
        0.2
      );
    }

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        1 - anim.leftEyeBlink * 0.9,
        0.3
      );
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        1 - anim.rightEyeBlink * 0.9,
        0.3
      );
    }
  });

  return (
    <group scale={avatarScale}>
      <group ref={groupRef}>
        {/* Main slime body */}
        <Sphere ref={bodyRef} args={[1, 32, 32]}>
          <meshStandardMaterial
            color={avatarColor}
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Inner glow sphere */}
        <Sphere args={[0.85, 32, 32]}>
          <meshStandardMaterial
            color={avatarColor}
            emissive={avatarColor}
            emissiveIntensity={0.2}
            roughness={0.4}
            transparent
            opacity={0.5}
          />
        </Sphere>

        {/* Left eye white */}
        <Sphere ref={leftEyeRef} args={[0.22, 16, 16]} position={[-0.35, 0.25, 0.8]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>
        <Sphere args={[0.12, 16, 16]} position={[-0.35, 0.25, 0.95]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Sphere>
        <Sphere args={[0.04, 8, 8]} position={[-0.4, 0.32, 1.0]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>

        {/* Right eye white */}
        <Sphere ref={rightEyeRef} args={[0.22, 16, 16]} position={[0.35, 0.25, 0.8]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>
        <Sphere args={[0.12, 16, 16]} position={[0.35, 0.25, 0.95]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Sphere>
        <Sphere args={[0.04, 8, 8]} position={[0.3, 0.32, 1.0]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>

        {/* Mouth */}
        <Sphere ref={mouthRef} args={[0.18, 16, 16]} position={[0, -0.2, 0.85]} scale={[1.3, 0.2, 1]}>
          <meshStandardMaterial color="#2a1a3a" />
        </Sphere>

        {/* Cheek blush */}
        <Sphere args={[0.15, 16, 16]} position={[-0.6, 0, 0.65]}>
          <meshStandardMaterial color="#ff9999" transparent opacity={0.4} />
        </Sphere>
        <Sphere args={[0.15, 16, 16]} position={[0.6, 0, 0.65]}>
          <meshStandardMaterial color="#ff9999" transparent opacity={0.4} />
        </Sphere>

        {/* Top highlight */}
        <Sphere args={[0.2, 16, 16]} position={[-0.3, 0.7, 0.5]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
        </Sphere>
      </group>

      {/* Half body */}
      <AvatarHalfBodyFixed color={avatarColor} yOffset={-1.6} />
    </group>
  );
};
