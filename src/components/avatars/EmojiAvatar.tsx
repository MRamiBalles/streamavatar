/**
 * StreamAvatar - Emoji Avatar Component
 * 
 * A flat, emoji-styled avatar with expressive features.
 * Now powered by the unified animation system for natural idle behavior.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

export const EmojiAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  const { avatarColor, avatarScale, audioData, audioReactiveEnabled } = useAvatarStore();
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

    // Audio reactive body bounce + breathing
    if (bodyRef.current) {
      let targetScale = anim.breathScale;
      if (audioReactiveEnabled) {
        targetScale = Math.max(targetScale, 1 + audioData.bass * 0.08);
      }
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, targetScale, 0.2);
    }

    // Eyebrow movement based on mouth (expressive) + audio
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = anim.mouthOpen * 0.15;
      const audioBrow = audioReactiveEnabled ? audioData.volume * 0.1 : 0;
      leftBrowRef.current.position.y = 0.55 + browRaise + audioBrow;
      rightBrowRef.current.position.y = 0.55 + browRaise + audioBrow;
    }

    if (mouthRef.current) {
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        0.3 + anim.mouthOpen * 0.7,
        0.2
      );
      mouthRef.current.scale.x = THREE.MathUtils.lerp(
        mouthRef.current.scale.x,
        1.2 - anim.mouthOpen * 0.4,
        0.2
      );
    }

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        1 - anim.leftEyeBlink * 0.85,
        0.3
      );
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        1 - anim.rightEyeBlink * 0.85,
        0.3
      );
    }
  });

  return (
    <group ref={groupRef} scale={avatarScale}>
      {/* Main face - flat circle */}
      <Cylinder ref={bodyRef} args={[1, 1, 0.3, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={avatarColor} roughness={0.3} />
      </Cylinder>

      {/* Face rim/edge */}
      <Torus args={[1, 0.08, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
        <meshStandardMaterial color="#d4a03d" roughness={0.4} metalness={0.2} />
      </Torus>

      {/* Left eye */}
      <group position={[-0.35, 0.25, 0.2]}>
        <Cylinder ref={leftEyeRef} args={[0.12, 0.12, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Cylinder>
        {/* Eye shine */}
        <Sphere args={[0.04, 8, 8]} position={[0.03, 0.03, 0.06]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Right eye */}
      <group position={[0.35, 0.25, 0.2]}>
        <Cylinder ref={rightEyeRef} args={[0.12, 0.12, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Cylinder>
        {/* Eye shine */}
        <Sphere args={[0.04, 8, 8]} position={[-0.03, 0.03, 0.06]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Left eyebrow */}
      <Cylinder
        ref={leftBrowRef}
        args={[0.02, 0.02, 0.2, 8]}
        position={[-0.35, 0.55, 0.2]}
        rotation={[0, 0, 0.2]}
      >
        <meshStandardMaterial color="#5c4a1f" />
      </Cylinder>

      {/* Right eyebrow */}
      <Cylinder
        ref={rightBrowRef}
        args={[0.02, 0.02, 0.2, 8]}
        position={[0.35, 0.55, 0.2]}
        rotation={[0, 0, -0.2]}
      >
        <meshStandardMaterial color="#5c4a1f" />
      </Cylinder>

      {/* Mouth - smile/O shape */}
      <Sphere ref={mouthRef} args={[0.2, 32, 16]} position={[0, -0.25, 0.2]} scale={[1.2, 0.3, 0.5]}>
        <meshStandardMaterial color="#1a1a2e" />
      </Sphere>

      {/* Tongue (visible when mouth open) */}
      <Sphere args={[0.1, 16, 16]} position={[0, -0.3, 0.22]} scale={[1, 0.5, 0.8]}>
        <meshStandardMaterial color="#ff6b6b" />
      </Sphere>

      {/* Cheeks/blush */}
      <Cylinder args={[0.12, 0.12, 0.05, 16]} position={[-0.6, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#ff9999" transparent opacity={0.6} />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.05, 16]} position={[0.6, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#ff9999" transparent opacity={0.6} />
      </Cylinder>

      {/* Sweat drop (for expressions) */}
      <Sphere args={[0.06, 16, 16]} position={[0.7, 0.5, 0.2]} scale={[0.8, 1.2, 0.8]}>
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
      </Sphere>
    </group>
  );
};
