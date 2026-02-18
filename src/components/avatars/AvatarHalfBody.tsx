/**
 * AvatarHalfBody — Shared torso + arms + hands with fingers for built-in avatars
 * 
 * Renders a smooth half-body with articulated fingers.
 * Arms follow hand tracking when available, otherwise procedural animation.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

interface AvatarHalfBodyProps {
  color: string;
  yOffset?: number;
  bodyScale?: number;
}

/** Tapered cylinder segment */
const Limb = ({
  rTop, rBot, h, color, pos, rot,
}: {
  rTop: number; rBot: number; h: number; color: string;
  pos: [number, number, number]; rot?: [number, number, number];
}) => (
  <mesh position={pos} rotation={rot || [0, 0, 0]}>
    <cylinderGeometry args={[rTop, rBot, h, 10]} />
    <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
  </mesh>
);

/** Sphere joint */
const Joint = ({ r, color, pos }: { r: number; color: string; pos: [number, number, number] }) => (
  <mesh position={pos}>
    <sphereGeometry args={[r, 10, 10]} />
    <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
  </mesh>
);

/** Single finger with 2 segments + tip */
const Finger = ({
  color, pos, rot, length = 0.18, thickness = 0.025,
}: {
  color: string; pos: [number, number, number]; rot?: [number, number, number];
  length?: number; thickness?: number;
}) => {
  const half = length / 2;
  return (
    <group position={pos} rotation={rot || [0, 0, 0]}>
      {/* Proximal */}
      <Limb rTop={thickness} rBot={thickness * 0.9} h={half} color={color} pos={[0, -half / 2, 0]} />
      {/* Joint */}
      <Joint r={thickness * 0.85} color={color} pos={[0, -half, 0]} />
      {/* Distal */}
      <Limb rTop={thickness * 0.9} rBot={thickness * 0.6} h={half * 0.8} color={color} pos={[0, -half - half * 0.4, 0]} />
      {/* Tip */}
      <Joint r={thickness * 0.55} color={color} pos={[0, -half - half * 0.8, 0]} />
    </group>
  );
};

/** Hand with 5 fingers */
const Hand = ({ color, mirror = false }: { color: string; mirror?: boolean }) => {
  const dir = mirror ? -1 : 1;
  const skinColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.88);
    return '#' + c.getHexString();
  }, [color]);

  return (
    <group>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[0.14, 0.08, 0.1]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} metalness={0.08} />
      </mesh>

      {/* Thumb — angled outward */}
      <Finger
        color={skinColor}
        pos={[dir * 0.06, 0, 0.04]}
        rot={[0.3, 0, dir * 0.6]}
        length={0.12}
        thickness={0.028}
      />

      {/* Index */}
      <Finger color={skinColor} pos={[dir * 0.045, -0.04, 0.04]} rot={[0.1, 0, dir * 0.05]} length={0.16} />
      {/* Middle */}
      <Finger color={skinColor} pos={[dir * 0.015, -0.04, 0.04]} rot={[0.05, 0, 0]} length={0.17} />
      {/* Ring */}
      <Finger color={skinColor} pos={[dir * -0.015, -0.04, 0.04]} rot={[0.05, 0, dir * -0.03]} length={0.15} />
      {/* Pinky */}
      <Finger color={skinColor} pos={[dir * -0.045, -0.04, 0.04]} rot={[0.08, 0, dir * -0.08]} length={0.12} thickness={0.02} />
    </group>
  );
};

export const AvatarHalfBody = ({ color, yOffset = -1.6, bodyScale = 1 }: AvatarHalfBodyProps) => {
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const bodyColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.92);
    return '#' + c.getHexString();
  }, [color]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const { audioData, audioReactiveEnabled, leftHandData, rightHandData } = useAvatarStore.getState();

    // Torso breathing
    if (torsoRef.current) {
      const breathe = 1 + Math.sin(timeRef.current * 1.5) * 0.012;
      const audioBoost = audioReactiveEnabled ? 1 + audioData.bass * 0.04 : 1;
      const target = breathe * audioBoost;
      torsoRef.current.scale.x = THREE.MathUtils.lerp(torsoRef.current.scale.x, target, 0.08);
      torsoRef.current.scale.z = THREE.MathUtils.lerp(torsoRef.current.scale.z, target, 0.08);
    }

    // Arm sway — procedural fallback or tracking-driven
    const proceduralSway = Math.sin(timeRef.current * 1.0) * 0.04;
    const audioSway = audioReactiveEnabled ? Math.sin(timeRef.current * 2.5) * audioData.volume * 0.06 : 0;

    // Left arm
    if (leftArmRef.current) {
      if (leftHandData.isTracked && leftHandData.landmarks.length > 0) {
        // Use wrist position (landmark 0) to drive arm rotation
        const wrist = leftHandData.landmarks[0];
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z, wrist.x * 1.5 + 0.12, 0.1
        );
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x, wrist.y * -0.8, 0.1
        );
      } else {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z, 0.12 + proceduralSway + audioSway, 0.08
        );
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x, Math.sin(timeRef.current * 0.8) * 0.02, 0.06
        );
      }
    }

    // Right arm
    if (rightArmRef.current) {
      if (rightHandData.isTracked && rightHandData.landmarks.length > 0) {
        const wrist = rightHandData.landmarks[0];
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, wrist.x * 1.5 - 0.12, 0.1
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x, wrist.y * -0.8, 0.1
        );
      } else {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, -0.12 - proceduralSway - audioSway, 0.08
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x, Math.sin(timeRef.current * 0.8 + 0.5) * 0.02, 0.06
        );
      }
    }

    // Subtle hand idle wiggle when not tracked
    const handWiggle = Math.sin(timeRef.current * 2) * 0.03;
    if (leftHandRef.current && !leftHandData.isTracked) {
      leftHandRef.current.rotation.z = handWiggle;
    }
    if (rightHandRef.current && !rightHandData.isTracked) {
      rightHandRef.current.rotation.z = -handWiggle;
    }
  });

  return (
    <group position={[0, yOffset, 0]} scale={bodyScale}>
      {/* Neck */}
      <Limb rTop={0.14} rBot={0.18} h={0.35} color={color} pos={[0, 0.7, 0]} />

      {/* Torso group */}
      <group ref={torsoRef}>
        {/* Upper torso */}
        <Limb rTop={0.42} rBot={0.48} h={0.6} color={color} pos={[0, 0.2, 0]} />
        {/* Lower torso */}
        <Limb rTop={0.48} rBot={0.38} h={0.55} color={bodyColor} pos={[0, -0.35, 0]} />
        {/* Shoulder joints */}
        <Joint r={0.16} color={color} pos={[-0.52, 0.38, 0]} />
        <Joint r={0.16} color={color} pos={[0.52, 0.38, 0]} />
      </group>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.52, 0.38, 0]}>
        <Limb rTop={0.13} rBot={0.11} h={0.55} color={color} pos={[0, -0.3, 0]} />
        <Joint r={0.11} color={bodyColor} pos={[0, -0.58, 0]} />
        <Limb rTop={0.1} rBot={0.08} h={0.45} color={bodyColor} pos={[0, -0.83, 0]} />
        {/* Wrist joint */}
        <Joint r={0.075} color={bodyColor} pos={[0, -1.06, 0]} />
        {/* Hand with fingers */}
        <group ref={leftHandRef} position={[0, -1.14, 0]}>
          <Hand color={color} mirror={false} />
        </group>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.52, 0.38, 0]}>
        <Limb rTop={0.13} rBot={0.11} h={0.55} color={color} pos={[0, -0.3, 0]} />
        <Joint r={0.11} color={bodyColor} pos={[0, -0.58, 0]} />
        <Limb rTop={0.1} rBot={0.08} h={0.45} color={bodyColor} pos={[0, -0.83, 0]} />
        <Joint r={0.075} color={bodyColor} pos={[0, -1.06, 0]} />
        <group ref={rightHandRef} position={[0, -1.14, 0]}>
          <Hand color={color} mirror={true} />
        </group>
      </group>
    </group>
  );
};
