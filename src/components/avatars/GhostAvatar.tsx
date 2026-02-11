/**
 * StreamAvatar - Ghost Avatar Component
 * 
 * A floating ghost avatar with wavy tail and ethereal presence.
 * Now powered by the unified animation system for natural idle behavior.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';

export const GhostAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const tailRefs = useRef<THREE.Mesh[]>([]);

  const avatarColor = useAvatarStore((s) => s.avatarColor);
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const audioData = useAvatarStore((s) => s.audioData);
  const audioReactiveEnabled = useAvatarStore((s) => s.audioReactiveEnabled);
  const { getAnimationState } = useAvatarAnimation();

  // Timer for floating animation
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const anim = getAnimationState();
    timeRef.current += delta;

    if (groupRef.current) {
      // Floating animation with audio boost
      const audioFloat = audioReactiveEnabled ? audioData.bass * 0.15 : 0;
      groupRef.current.position.y = Math.sin(timeRef.current * 1.5) * 0.1 + audioFloat;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        anim.headRotation.x * 0.7,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -anim.headRotation.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        anim.headRotation.z * 0.5,
        0.1
      );
    }

    // Wavy tail pieces + audio reactive
    tailRefs.current.forEach((tail, i) => {
      if (tail) {
        const audioWave = audioReactiveEnabled ? audioData.volume * 0.15 : 0;
        tail.position.x = Math.sin(timeRef.current * 2 + i * 0.8) * (0.1 + audioWave);
      }
    });

    // Body wobble with breathing + audio
    if (bodyRef.current) {
      let targetScale = anim.breathScale;
      if (audioReactiveEnabled) {
        targetScale = Math.max(targetScale, 1 + audioData.bass * 0.1);
      }
      bodyRef.current.scale.x = THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScale, 0.15);
    }

    if (mouthRef.current) {
      const mouthScale = 0.1 + anim.mouthOpen * 0.5;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        mouthScale,
        0.2
      );
      mouthRef.current.scale.x = THREE.MathUtils.lerp(
        mouthRef.current.scale.x,
        0.8 + anim.mouthOpen * 0.4,
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
      {/* Main body - elongated ghost shape */}
      <Sphere ref={bodyRef} args={[0.9, 32, 32]} scale={[1, 1.3, 0.9]}>
        <meshStandardMaterial
          color={avatarColor}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Inner glow */}
      <Sphere args={[0.75, 32, 32]} scale={[1, 1.2, 0.85]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive={avatarColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </Sphere>

      {/* Wavy tail pieces */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Cone
          key={i}
          ref={(el) => { if (el) tailRefs.current[i] = el; }}
          args={[0.2, 0.5, 8]}
          position={[-0.4 + i * 0.2, -1.2, 0]}
          rotation={[0, 0, Math.PI]}
        >
          <meshStandardMaterial
            color={avatarColor}
            transparent
            opacity={0.85}
          />
        </Cone>
      ))}

      {/* Left eye */}
      <group position={[-0.3, 0.3, 0.7]}>
        <Sphere ref={leftEyeRef} args={[0.2, 16, 16]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Sphere>
        <Sphere args={[0.06, 8, 8]} position={[0.05, 0.05, 0.15]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Right eye */}
      <group position={[0.3, 0.3, 0.7]}>
        <Sphere ref={rightEyeRef} args={[0.2, 16, 16]}>
          <meshStandardMaterial color="#1a1a2e" />
        </Sphere>
        <Sphere args={[0.06, 8, 8]} position={[-0.05, 0.05, 0.15]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Mouth - "O" shape when talking */}
      <Sphere ref={mouthRef} args={[0.15, 16, 16]} position={[0, -0.1, 0.75]} scale={[0.8, 0.1, 1]}>
        <meshStandardMaterial color="#2d1f3d" />
      </Sphere>

      {/* Blush */}
      <Sphere args={[0.12, 16, 16]} position={[-0.55, 0.1, 0.6]}>
        <meshStandardMaterial color="#ffb6c1" transparent opacity={0.5} />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[0.55, 0.1, 0.6]}>
        <meshStandardMaterial color="#ffb6c1" transparent opacity={0.5} />
      </Sphere>

      {/* Small floating particles around ghost */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sphere
          key={i}
          args={[0.04, 8, 8]}
          position={[
            Math.cos(i * Math.PI / 3) * 1.2,
            Math.sin(i * Math.PI / 3) * 0.5 + 0.5,
            0.3
          ]}
        >
          <meshStandardMaterial
            color={avatarColor}
            emissive={avatarColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </Sphere>
      ))}
    </group>
  );
};
