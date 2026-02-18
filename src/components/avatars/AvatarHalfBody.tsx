/**
 * AvatarHalfBody — Shared torso + arms for built-in avatars
 * 
 * Renders a simple half-body (torso + two arms) below the head group.
 * Applies breathing animation and subtle arm sway from the animation system.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Capsule, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

interface AvatarHalfBodyProps {
  color: string;
  /** Y offset from head center to place the torso */
  yOffset?: number;
  /** Scale multiplier for the body */
  bodyScale?: number;
}

export const AvatarHalfBody = ({ color, yOffset = -1.6, bodyScale = 1 }: AvatarHalfBodyProps) => {
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const { audioData, audioReactiveEnabled } = useAvatarStore.getState();

    // Torso breathing
    if (torsoRef.current) {
      const breathe = 1 + Math.sin(timeRef.current * 1.5) * 0.015;
      const audioBoost = audioReactiveEnabled ? 1 + audioData.bass * 0.05 : 1;
      torsoRef.current.scale.x = THREE.MathUtils.lerp(torsoRef.current.scale.x, breathe * audioBoost, 0.1);
      torsoRef.current.scale.z = THREE.MathUtils.lerp(torsoRef.current.scale.z, breathe * audioBoost, 0.1);
    }

    // Arm sway
    const sway = Math.sin(timeRef.current * 1.2) * 0.06;
    const audioSway = audioReactiveEnabled ? Math.sin(timeRef.current * 3) * audioData.volume * 0.08 : 0;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        0.15 + sway + audioSway,
        0.1
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        -0.15 - sway - audioSway,
        0.1
      );
    }
  });

  return (
    <group position={[0, yOffset, 0]} scale={bodyScale}>
      {/* Torso */}
      <Capsule ref={torsoRef} args={[0.45, 1.0, 8, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </Capsule>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.65, 0.3, 0]}>
        {/* Upper arm */}
        <Capsule args={[0.12, 0.5, 6, 12]} position={[0, -0.1, 0]} rotation={[0, 0, 0.3]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Capsule>
        {/* Forearm */}
        <Capsule args={[0.1, 0.4, 6, 12]} position={[-0.15, -0.55, 0]} rotation={[0, 0, 0.15]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Capsule>
        {/* Hand */}
        <Sphere args={[0.1, 8, 8]} position={[-0.2, -0.85, 0]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Sphere>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.65, 0.3, 0]}>
        {/* Upper arm */}
        <Capsule args={[0.12, 0.5, 6, 12]} position={[0, -0.1, 0]} rotation={[0, 0, -0.3]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Capsule>
        {/* Forearm */}
        <Capsule args={[0.1, 0.4, 6, 12]} position={[0.15, -0.55, 0]} rotation={[0, 0, -0.15]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Capsule>
        {/* Hand */}
        <Sphere args={[0.1, 8, 8]} position={[0.2, -0.85, 0]}>
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </Sphere>
      </group>
    </group>
  );
};
