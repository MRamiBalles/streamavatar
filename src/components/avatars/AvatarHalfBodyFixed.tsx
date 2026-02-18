/**
 * AvatarHalfBody — Shared torso + arms + hands with fingers for built-in avatars
 * 
 * Arms follow hand tracking when available, otherwise procedural animation.
 * 
 * DEBUG MODE ENABLED: Visualizing tracking state above head.
 */

import { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

interface AvatarHalfBodyProps {
  color: string;
  yOffset?: number;
  bodyScale?: number;
}

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

const Joint = ({ r, color, pos }: { r: number; color: string; pos: [number, number, number] }) => (
  <mesh position={pos}>
    <sphereGeometry args={[r, 10, 10]} />
    <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
  </mesh>
);

const FINGER_INDICES = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20]
};

const RefFinger = forwardRef<THREE.Group, {
  color: string; pos: [number, number, number];
  length?: number; thickness?: number;
}>(({ color, pos, length = 0.18, thickness = 0.025 }, ref) => {
  const half = length / 2;
  return (
    <group ref={ref} position={pos}>
      <Limb rTop={thickness} rBot={thickness * 0.9} h={half} color={color} pos={[0, -half / 2, 0]} />
      <group position={[0, -half, 0]}>
        <Joint r={thickness * 0.85} color={color} pos={[0, 0, 0]} />
        <Limb rTop={thickness * 0.9} rBot={thickness * 0.6} h={half * 0.8} color={color} pos={[0, -half * 0.4, 0]} />
        <Joint r={thickness * 0.55} color={color} pos={[0, -half * 0.8, 0]} />
      </group>
    </group>
  );
});

const ReactiveHand = ({ color, side, dataSource }: {
  color: string;
  side: 'left' | 'right';
  dataSource: 'left' | 'right';
}) => {
  const isLeft = side === 'left';
  const dir = isLeft ? 1 : -1;

  const skinColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.88);
    return '#' + c.getHexString();
  }, [color]);

  const thumbRef = useRef<THREE.Group>(null);
  const indexRef = useRef<THREE.Group>(null);
  const middleRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const pinkyRef = useRef<THREE.Group>(null);

  const updateFinger = (
    ref: THREE.Group | null,
    rotations: { proximal: number; distal: number },
    baseRot: [number, number, number]
  ) => {
    if (!ref) return;
    ref.rotation.set(baseRot[0] + rotations.proximal, baseRot[1], baseRot[2]);
    const pipGroup = ref.children[1] as THREE.Group;
    if (pipGroup && pipGroup.isGroup) {
      pipGroup.rotation.x = rotations.distal;
    }
  };

  const getFingerRotations = (landmarks: { x: number; y: number; z: number }[], indices: number[]) => {
    if (!landmarks || landmarks.length === 0) return { proximal: 0, distal: 0 };
    if (indices.some(idx => !landmarks[idx])) return { proximal: 0, distal: 0 };

    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];

    const v1 = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z).normalize();
    const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z).normalize();
    const v3 = new THREE.Vector3(p4.x - p3.x, p4.y - p3.y, p4.z - p3.z).normalize();

    const dot1 = v1.dot(v2);
    const dot2 = v2.dot(v3);

    const angle1 = Math.acos(Math.min(Math.max(dot1, -1), 1));
    const angle2 = Math.acos(Math.min(Math.max(dot2, -1), 1));

    return { proximal: angle1 * 2.0, distal: angle2 * 2.0 };
  };

  useFrame(() => {
    const state = useAvatarStore.getState();
    const data = dataSource === 'left' ? state.leftHandData : state.rightHandData;

    if (data.isTracked && data.landmarks.length > 0) {
      const l = data.landmarks;
      updateFinger(thumbRef.current, getFingerRotations(l, FINGER_INDICES.thumb), [0.3, 0, dir * 0.6]);
      updateFinger(indexRef.current, getFingerRotations(l, FINGER_INDICES.index), [0.1, 0, dir * 0.05]);
      updateFinger(middleRef.current, getFingerRotations(l, FINGER_INDICES.middle), [0.05, 0, 0]);
      updateFinger(ringRef.current, getFingerRotations(l, FINGER_INDICES.ring), [0.05, 0, dir * -0.03]);
      updateFinger(pinkyRef.current, getFingerRotations(l, FINGER_INDICES.pinky), [0.08, 0, dir * -0.08]);
    } else {
      const zero = { proximal: 0, distal: 0 };
      updateFinger(thumbRef.current, zero, [0.3, 0, dir * 0.6]);
      updateFinger(indexRef.current, zero, [0.1, 0, dir * 0.05]);
      updateFinger(middleRef.current, zero, [0.05, 0, 0]);
      updateFinger(ringRef.current, zero, [0.05, 0, dir * -0.03]);
      updateFinger(pinkyRef.current, zero, [0.08, 0, dir * -0.08]);
    }
  });

  return (
    <group>
      <mesh>
        <boxGeometry args={[0.14, 0.08, 0.1]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} metalness={0.08} />
      </mesh>
      <RefFinger ref={thumbRef} color={skinColor} pos={[dir * 0.06, 0, 0.04]} length={0.12} thickness={0.028} />
      <RefFinger ref={indexRef} color={skinColor} pos={[dir * 0.045, -0.04, 0.04]} length={0.16} />
      <RefFinger ref={middleRef} color={skinColor} pos={[dir * 0.015, -0.04, 0.04]} length={0.17} />
      <RefFinger ref={ringRef} color={skinColor} pos={[dir * -0.015, -0.04, 0.04]} length={0.15} />
      <RefFinger ref={pinkyRef} color={skinColor} pos={[dir * -0.045, -0.04, 0.04]} length={0.12} thickness={0.02} />
    </group>
  );
};

// --- Main Component ---

export const AvatarHalfBodyFixed = ({ color, yOffset = -1.6, bodyScale = 1 }: AvatarHalfBodyProps) => {
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Subscribe to tracking state for debug UI
  const leftHandTracked = useAvatarStore((s) => s.leftHandData.isTracked);
  const rightHandTracked = useAvatarStore((s) => s.rightHandData.isTracked);
  const debugText = `L: ${leftHandTracked ? 'ON' : '.'} | R: ${rightHandTracked ? 'ON' : '.'}`;

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

    const proceduralSway = Math.sin(timeRef.current * 1.0) * 0.04;
    const audioSway = audioReactiveEnabled ? Math.sin(timeRef.current * 2.5) * audioData.volume * 0.06 : 0;

    // SWAPPED: user RIGHT hand (rightHandData) → screen left → leftArmRef
    //          user LEFT hand  (leftHandData)  → screen right → rightArmRef

    // LEFT ARM ← rightHandData
    if (leftArmRef.current) {
      if (rightHandData.isTracked && rightHandData.landmarks.length > 0) {
        const wrist = rightHandData.landmarks[0];
        // wrist.x < 0 for user RIGHT hand (screen left)
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z, wrist.x * 2.5 + 0.12, 0.2
        );
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x, -0.5 + wrist.y * 0.5, 0.2
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

    // RIGHT ARM ← leftHandData
    if (rightArmRef.current) {
      if (leftHandData.isTracked && leftHandData.landmarks.length > 0) {
        const wrist = leftHandData.landmarks[0];
        // wrist.x > 0 for user LEFT hand (screen right)
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, wrist.x * 2.5 - 0.12, 0.2
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x, -0.5 + wrist.y * 0.5, 0.2
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

    // Hand idle wiggle
    const handWiggle = Math.sin(timeRef.current * 2) * 0.03;
    if (leftHandRef.current && !rightHandData.isTracked) {
      leftHandRef.current.rotation.z = handWiggle;
    }
    if (rightHandRef.current && !leftHandData.isTracked) {
      rightHandRef.current.rotation.z = -handWiggle;
    }
  });

  return (
    <group position={[0, yOffset, 0]} scale={bodyScale}>
      {/* DEBUG TEXT OVERLAY */}
      <Text position={[0, 1.3, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle">
        {debugText}
      </Text>

      <Limb rTop={0.14} rBot={0.18} h={0.35} color={color} pos={[0, 0.7, 0]} />

      <group ref={torsoRef}>
        <Limb rTop={0.42} rBot={0.48} h={0.6} color={color} pos={[0, 0.2, 0]} />
        <Limb rTop={0.48} rBot={0.38} h={0.55} color={bodyColor} pos={[0, -0.35, 0]} />
        <Joint r={0.16} color={color} pos={[-0.52, 0.38, 0]} />
        <Joint r={0.16} color={color} pos={[0.52, 0.38, 0]} />
      </group>

      {/* Left arm ← rightHandData */}
      <group ref={leftArmRef} position={[-0.52, 0.38, 0]}>
        <Limb rTop={0.13} rBot={0.11} h={0.55} color={color} pos={[0, -0.3, 0]} />
        <Joint r={0.11} color={bodyColor} pos={[0, -0.58, 0]} />
        <Limb rTop={0.1} rBot={0.08} h={0.45} color={bodyColor} pos={[0, -0.83, 0]} />
        <Joint r={0.075} color={bodyColor} pos={[0, -1.06, 0]} />
        <group ref={leftHandRef} position={[0, -1.14, 0]}>
          <ReactiveHand color={color} side="left" dataSource="right" />
        </group>
      </group>

      {/* Right arm ← leftHandData */}
      <group ref={rightArmRef} position={[0.52, 0.38, 0]}>
        <Limb rTop={0.13} rBot={0.11} h={0.55} color={color} pos={[0, -0.3, 0]} />
        <Joint r={0.11} color={bodyColor} pos={[0, -0.58, 0]} />
        <Limb rTop={0.1} rBot={0.08} h={0.45} color={bodyColor} pos={[0, -0.83, 0]} />
        <Joint r={0.075} color={bodyColor} pos={[0, -1.06, 0]} />
        <group ref={rightHandRef} position={[0, -1.14, 0]}>
          <ReactiveHand color={color} side="right" dataSource="left" />
        </group>
      </group>
    </group>
  );
};
