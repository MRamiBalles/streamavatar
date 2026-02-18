/**
 * AvatarHalfBody — Shared torso + arms for built-in avatars
 * 
 * Renders a smooth half-body (neck, torso, shoulders, connected arms)
 * with breathing animation and subtle arm sway from the animation system.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

interface AvatarHalfBodyProps {
  color: string;
  /** Y offset from head center to place the torso */
  yOffset?: number;
  /** Scale multiplier for the body */
  bodyScale?: number;
}

/** Creates a smooth limb shape (tapered cylinder) */
const LimbSegment = ({
  radiusTop,
  radiusBottom,
  height,
  color,
  position,
  rotation,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  color: string;
  position: [number, number, number];
  rotation?: [number, number, number];
}) => (
  <mesh position={position} rotation={rotation || [0, 0, 0]}>
    <cylinderGeometry args={[radiusTop, radiusBottom, height, 12]} />
    <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
  </mesh>
);

/** Smooth sphere joint connecting body segments */
const Joint = ({
  radius,
  color,
  position,
}: {
  radius: number;
  color: string;
  position: [number, number, number];
}) => (
  <mesh position={position}>
    <sphereGeometry args={[radius, 12, 12]} />
    <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
  </mesh>
);

export const AvatarHalfBody = ({ color, yOffset = -1.6, bodyScale = 1 }: AvatarHalfBodyProps) => {
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Slightly darker shade for depth
  const bodyColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.92);
    return '#' + c.getHexString();
  }, [color]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const { audioData, audioReactiveEnabled } = useAvatarStore.getState();

    // Torso breathing
    if (torsoRef.current) {
      const breathe = 1 + Math.sin(timeRef.current * 1.5) * 0.012;
      const audioBoost = audioReactiveEnabled ? 1 + audioData.bass * 0.04 : 1;
      const target = breathe * audioBoost;
      torsoRef.current.scale.x = THREE.MathUtils.lerp(torsoRef.current.scale.x, target, 0.08);
      torsoRef.current.scale.z = THREE.MathUtils.lerp(torsoRef.current.scale.z, target, 0.08);
    }

    // Arm sway — gentle pendulum
    const sway = Math.sin(timeRef.current * 1.0) * 0.04;
    const audioSway = audioReactiveEnabled ? Math.sin(timeRef.current * 2.5) * audioData.volume * 0.06 : 0;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        0.12 + sway + audioSway,
        0.08
      );
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        Math.sin(timeRef.current * 0.8) * 0.02,
        0.06
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        -0.12 - sway - audioSway,
        0.08
      );
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        Math.sin(timeRef.current * 0.8 + 0.5) * 0.02,
        0.06
      );
    }
  });

  return (
    <group position={[0, yOffset, 0]} scale={bodyScale}>
      {/* Neck */}
      <LimbSegment
        radiusTop={0.14}
        radiusBottom={0.18}
        height={0.35}
        color={color}
        position={[0, 0.7, 0]}
      />

      {/* Torso group (breathing target) */}
      <group ref={torsoRef}>
        {/* Upper torso — wider, chest area */}
        <LimbSegment
          radiusTop={0.42}
          radiusBottom={0.48}
          height={0.6}
          color={color}
          position={[0, 0.2, 0]}
        />

        {/* Lower torso — tapers down */}
        <LimbSegment
          radiusTop={0.48}
          radiusBottom={0.38}
          height={0.55}
          color={bodyColor}
          position={[0, -0.35, 0]}
        />

        {/* Shoulder joints — visible spheres where arms connect */}
        <Joint radius={0.16} color={color} position={[-0.52, 0.38, 0]} />
        <Joint radius={0.16} color={color} position={[0.52, 0.38, 0]} />
      </group>

      {/* Left arm — pivot from shoulder joint */}
      <group ref={leftArmRef} position={[-0.52, 0.38, 0]}>
        {/* Upper arm */}
        <LimbSegment
          radiusTop={0.13}
          radiusBottom={0.11}
          height={0.55}
          color={color}
          position={[0, -0.3, 0]}
        />
        {/* Elbow joint */}
        <Joint radius={0.11} color={bodyColor} position={[0, -0.58, 0]} />
        {/* Forearm */}
        <LimbSegment
          radiusTop={0.1}
          radiusBottom={0.08}
          height={0.45}
          color={bodyColor}
          position={[0, -0.83, 0]}
        />
        {/* Hand */}
        <Joint radius={0.09} color={bodyColor} position={[0, -1.08, 0]} />
      </group>

      {/* Right arm — pivot from shoulder joint */}
      <group ref={rightArmRef} position={[0.52, 0.38, 0]}>
        {/* Upper arm */}
        <LimbSegment
          radiusTop={0.13}
          radiusBottom={0.11}
          height={0.55}
          color={color}
          position={[0, -0.3, 0]}
        />
        {/* Elbow joint */}
        <Joint radius={0.11} color={bodyColor} position={[0, -0.58, 0]} />
        {/* Forearm */}
        <LimbSegment
          radiusTop={0.1}
          radiusBottom={0.08}
          height={0.45}
          color={bodyColor}
          position={[0, -0.83, 0]}
        />
        {/* Hand */}
        <Joint radius={0.09} color={bodyColor} position={[0, -1.08, 0]} />
      </group>
    </group>
  );
};
