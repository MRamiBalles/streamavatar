/**
 * StreamAvatar - Pill Avatar Component
 * 
 * A capsule-shaped avatar with expressive eyes and mouth.
 * Now powered by the unified animation system for natural idle behavior.
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Capsule, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

export const PillAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  // Get static config from store
  const { avatarColor, avatarScale, audioData, audioReactiveEnabled } = useAvatarStore();

  // Get unified animation state (tracking + idle)
  const { getAnimationState } = useAvatarAnimation();

  useFrame(() => {
    // Get current animation state (blended tracking + idle)
    const anim = getAnimationState();

    if (groupRef.current) {
      // Apply head rotation with smooth interpolation
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

    // Body breathing + audio reactive scaling
    if (bodyRef.current) {
      let targetScaleX = anim.breathScale;
      let targetScaleZ = anim.breathScale;

      if (audioReactiveEnabled) {
        const audioScale = 1 + audioData.bass * 0.15;
        targetScaleX = Math.max(targetScaleX, audioScale);
        targetScaleZ = Math.max(targetScaleZ, audioScale);
      }

      bodyRef.current.scale.x = THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScaleX, 0.15);
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, anim.breathScale, 0.15);
      bodyRef.current.scale.z = THREE.MathUtils.lerp(bodyRef.current.scale.z, targetScaleZ, 0.15);
    }

    // Animate mouth
    if (mouthRef.current) {
      const mouthScale = 0.1 + anim.mouthOpen * 0.4;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        mouthScale,
        0.2
      );
    }

    // Animate eyes (blink)
    if (leftEyeRef.current) {
      const targetScale = 1 - anim.leftEyeBlink * 0.9;
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        targetScale,
        0.3
      );
    }
    if (rightEyeRef.current) {
      const targetScale = 1 - anim.rightEyeBlink * 0.9;
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        targetScale,
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
