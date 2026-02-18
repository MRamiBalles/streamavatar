/**
 * StreamAvatar - Boxy (Robot) Avatar Component
 * 
 * A retro robot-styled avatar with LED eyes and antenna.
 * Now powered by the unified animation system for natural idle behavior.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { AvatarHalfBody } from './AvatarHalfBody';

export const BoxyAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Group>(null);
  const antennaBallRef = useRef<THREE.Mesh>(null);

  const avatarColor = useAvatarStore((s) => s.avatarColor);
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const { getAnimationState } = useAvatarAnimation();

  // Timer for antenna wobble
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

    // Antenna wobble + audio reactive
    if (antennaRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      const audioWobble = audioReactiveEnabled ? audioData.treble * 0.3 : 0;
      antennaRef.current.rotation.z = Math.sin(timeRef.current * 2) * 0.1 + audioWobble;
    }

    // Antenna ball glow with audio
    if (antennaBallRef.current) {
      const { audioData, audioReactiveEnabled } = useAvatarStore.getState();
      if (audioReactiveEnabled) {
        const material = antennaBallRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.5 + audioData.volume * 1.5;
      }
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
    <group scale={avatarScale}>
      <group ref={groupRef}>
        {/* Main body */}
        <RoundedBox args={[1.4, 1.4, 1.2]} radius={0.15} smoothness={4}>
          <meshStandardMaterial color={avatarColor} roughness={0.3} metalness={0.4} />
        </RoundedBox>

        {/* Screen face area */}
        <RoundedBox args={[1.1, 0.8, 0.1]} radius={0.05} position={[0, 0.1, 0.56]}>
          <meshStandardMaterial color="#0a0a15" roughness={0.1} metalness={0.8} />
        </RoundedBox>

        {/* Left eye (LED style) */}
        <Box ref={leftEyeRef} args={[0.2, 0.25, 0.05]} position={[-0.3, 0.2, 0.62]}>
          <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={0.5} />
        </Box>

        {/* Right eye (LED style) */}
        <Box ref={rightEyeRef} args={[0.2, 0.25, 0.05]} position={[0.3, 0.2, 0.62]}>
          <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={0.5} />
        </Box>

        {/* Mouth (LED bar) */}
        <Box ref={mouthRef} args={[0.5, 0.1, 0.05]} position={[0, -0.15, 0.62]}>
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </Box>

        {/* Antenna */}
        <group ref={antennaRef} position={[0, 0.9, 0]}>
          <Box args={[0.08, 0.3, 0.08]}>
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </Box>
          <Sphere ref={antennaBallRef} args={[0.1, 16, 16]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.8} />
          </Sphere>
        </group>

        {/* Side details */}
        <Box args={[0.1, 0.4, 0.8]} position={[-0.75, 0, 0]}>
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
        </Box>
        <Box args={[0.1, 0.4, 0.8]} position={[0.75, 0, 0]}>
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
        </Box>
      </group>

      {/* Half body */}
      <AvatarHalfBody color={avatarColor} yOffset={-1.5} />
    </group>
  );
};
