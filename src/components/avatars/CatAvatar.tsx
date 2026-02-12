/**
 * StreamAvatar - Cat Avatar Component
 * 
 * An adorable cat-styled avatar with twitching ears and wagging tail.
 * Now powered by the unified animation system for natural idle behavior.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cone, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

export const CatAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  const avatarColor = useAvatarStore((s) => s.avatarColor);
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const { getAnimationState } = useAvatarAnimation();

  // Timer for animations
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const anim = getAnimationState();
    timeRef.current += delta;

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

    // Tail wag + audio reactive
    if (tailRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      const audioWag = audioReactiveEnabled ? audioData.volume * 0.5 : 0;
      tailRef.current.rotation.z = Math.sin(timeRef.current * 3) * (0.3 + audioWag);
    }

    // Ear twitch + audio reactive
    if (leftEarRef.current && rightEarRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      const twitch = Math.sin(timeRef.current * 5) * 0.05;
      const audioTwitch = audioReactiveEnabled ? audioData.treble * 0.15 : 0;
      leftEarRef.current.rotation.z = -0.2 + twitch + audioTwitch;
      rightEarRef.current.rotation.z = 0.2 - twitch - audioTwitch;
    }

    // Body scale with breathing + audio
    if (bodyRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      let targetScale = anim.breathScale;
      if (audioReactiveEnabled) {
        targetScale = Math.max(targetScale, 1 + audioData.bass * 0.08);
      }
      bodyRef.current.scale.setScalar(THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScale, 0.15));
    }

    if (mouthRef.current) {
      // Boosted sensitivity for clearer AR expressions
      const mouthScale = 0.05 + anim.mouthOpen * 0.7;
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
    <group ref={groupRef} scale={avatarScale}>
      {/* Head */}
      <Sphere ref={bodyRef} args={[0.9, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Sphere>

      {/* Left ear */}
      <Cone ref={leftEarRef} args={[0.3, 0.5, 4]} position={[-0.5, 0.8, 0]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Cone>
      <Cone args={[0.15, 0.3, 4]} position={[-0.5, 0.75, 0.05]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial color="#ffb6c1" roughness={0.5} />
      </Cone>

      {/* Right ear */}
      <Cone ref={rightEarRef} args={[0.3, 0.5, 4]} position={[0.5, 0.8, 0]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Cone>
      <Cone args={[0.15, 0.3, 4]} position={[0.5, 0.75, 0.05]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color="#ffb6c1" roughness={0.5} />
      </Cone>

      {/* Left eye */}
      <Sphere ref={leftEyeRef} args={[0.18, 16, 16]} position={[-0.3, 0.15, 0.75]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[-0.3, 0.15, 0.88]}>
        <meshStandardMaterial color="#2d2d2d" />
      </Sphere>
      <Sphere args={[0.04, 8, 8]} position={[-0.25, 0.2, 0.95]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </Sphere>

      {/* Right eye */}
      <Sphere ref={rightEyeRef} args={[0.18, 16, 16]} position={[0.3, 0.15, 0.75]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[0.3, 0.15, 0.88]}>
        <meshStandardMaterial color="#2d2d2d" />
      </Sphere>
      <Sphere args={[0.04, 8, 8]} position={[0.35, 0.2, 0.95]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </Sphere>

      {/* Nose */}
      <Sphere args={[0.1, 16, 16]} position={[0, -0.05, 0.85]}>
        <meshStandardMaterial color="#ff69b4" />
      </Sphere>

      {/* Mouth */}
      <Sphere ref={mouthRef} args={[0.12, 16, 16]} position={[0, -0.25, 0.8]} scale={[1.2, 0.1, 1]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Sphere>

      {/* Whiskers */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, -0.1, 0.8]}>
          <Cylinder args={[0.01, 0.01, 0.4]} rotation={[0, 0, Math.PI / 2 + side * 0.2]} position={[side * 0.2, 0.05, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.35]} rotation={[0, 0, Math.PI / 2]} position={[side * 0.18, 0, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.4]} rotation={[0, 0, Math.PI / 2 - side * 0.2]} position={[side * 0.2, -0.05, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
        </group>
      ))}

      {/* Tail */}
      <group ref={tailRef} position={[0, -0.3, -0.8]}>
        <Cylinder args={[0.08, 0.12, 0.8]} rotation={[0.5, 0, 0]} position={[0, 0.2, -0.3]}>
          <meshStandardMaterial color={avatarColor} roughness={0.6} />
        </Cylinder>
        <Sphere args={[0.1, 16, 16]} position={[0, 0.5, -0.6]}>
          <meshStandardMaterial color={avatarColor} roughness={0.6} />
        </Sphere>
      </group>
    </group>
  );
};
