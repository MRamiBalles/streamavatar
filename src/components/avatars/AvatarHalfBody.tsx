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
  proximalRot = 0, distalRot = 0,
}: {
  color: string; pos: [number, number, number]; rot?: [number, number, number];
  length?: number; thickness?: number;
  proximalRot?: number; distalRot?: number;
}) => {
  // Base rotation (static spread)
  const baseRot = rot || [0, 0, 0];
  const half = length / 2;

  // We use Group rotation for the animation to keep the local hierarchy clean
  // proximalRot rotates the WHOLE finger from base
  // distalRot rotates the second phalanx

  return (
    <group position={pos} rotation={[baseRot[0] + proximalRot, baseRot[1], baseRot[2]]}>
      {/* Proximal Phalanx */}
      <Limb rTop={thickness} rBot={thickness * 0.9} h={half} color={color} pos={[0, -half / 2, 0]} />

      {/* Joint (PIP) */}
      <group position={[0, -half, 0]} rotation={[distalRot, 0, 0]}>
        <Joint r={thickness * 0.85} color={color} pos={[0, 0, 0]} />

        {/* Distal Phalanx */}
        <Limb rTop={thickness * 0.9} rBot={thickness * 0.6} h={half * 0.8} color={color} pos={[0, -half * 0.4, 0]} />

        {/* Tip */}
        <Joint r={thickness * 0.55} color={color} pos={[0, -half * 0.8, 0]} />
      </group>
    </group>
  );
};

// Map MediaPipe landmarks to our finger structure
// Landmarks: 0=wrist, 1-4=thumb, 5-8=index, 9-12=middle, 13-16=ring, 17-20=pinky
const FINGER_INDICES = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20]
};

/** Hand with 5 fingers */
const Hand = ({
  color,
  mirror = false,
  landmarks = []
}: {
  color: string;
  mirror?: boolean;
  landmarks?: { x: number, y: number, z: number }[];
}) => {
  const dir = mirror ? -1 : 1;
  const skinColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.88);
    return '#' + c.getHexString();
  }, [color]);

  // Helper to calculate finger curl
  // We estimate curl by checking the angle between the proximal bone and the palm normal, 
  // or simply by the distance from tip to wrist vs extended length.
  // For simplicity and robustness in 2D/3D hybrid tracking:
  // We'll map the "bend" based on landmarks distance relative to a straight line.

  const getFingerRotations = (indices: number[]) => {
    if (!landmarks || landmarks.length === 0) return { proximal: 0, distal: 0 };

    // Safety check
    if (indices.some(idx => !landmarks[idx])) return { proximal: 0, distal: 0 };

    const p0 = landmarks[0]; // Wrist
    const p1 = landmarks[indices[0]]; // MCP
    const p2 = landmarks[indices[1]]; // PIP
    const p3 = landmarks[indices[2]]; // DIP
    const p4 = landmarks[indices[3]]; // Tip

    // Calculate vectors
    const v1 = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z); // Proximal bone
    const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z); // Middle bone
    const v3 = new THREE.Vector3(p4.x - p3.x, p4.y - p3.y, p4.z - p3.z); // Distal bone

    // In a rigorous IK, we'd solve joint angles.
    // For visual approximation:
    // 1. Proximal Curl: Angle between "up" (relative to hand) and the finger.
    // But since we are local, let's just use the relative bend between segments.
    // Actually, MediaPipe gives world coords.

    // Simplified "Curl" based on vector dot products
    // Normalize
    v1.normalize();
    v2.normalize();
    v3.normalize();

    // Dot product gives cosine of angle. 1 = straight, 0 = 90deg bent.
    // We want rotation in radians.
    // If dot is 1, angle is 0. If dot is 0, angle is PI/2.
    const dot1 = v1.dot(v2);
    const dot2 = v2.dot(v3);

    // Clamp to safe range [0, 1] before acos
    const angle1 = Math.acos(Math.min(Math.max(dot1, -1), 1));
    const angle2 = Math.acos(Math.min(Math.max(dot2, -1), 1));

    // Boost the visual bend because 3D tracking can be stiff
    return {
      proximal: angle1 * 1.5,
      distal: angle2 * 1.5
    };
  };

  // If no landmarks, use default 0
  const thumbRot = getFingerRotations(FINGER_INDICES.thumb); // Thumb is special, but this is a rough approx
  const indexRot = getFingerRotations(FINGER_INDICES.index);
  const middleRot = getFingerRotations(FINGER_INDICES.middle);
  const ringRot = getFingerRotations(FINGER_INDICES.ring);
  const pinkyRot = getFingerRotations(FINGER_INDICES.pinky);

  // Thumb special fix: Thumbs curl differently (inward). 
  // For this low-poly cylinder hand, simple curl works okay-ish.

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
        proximalRot={thumbRot.proximal}
        distalRot={thumbRot.distal}
      />

      {/* Index */}
      <Finger
        color={skinColor}
        pos={[dir * 0.045, -0.04, 0.04]}
        rot={[0.1, 0, dir * 0.05]}
        length={0.16}
        proximalRot={indexRot.proximal}
        distalRot={indexRot.distal}
      />

      {/* Middle */}
      <Finger
        color={skinColor}
        pos={[dir * 0.015, -0.04, 0.04]}
        rot={[0.05, 0, 0]}
        length={0.17}
        proximalRot={middleRot.proximal}
        distalRot={middleRot.distal}
      />

      {/* Ring */}
      <Finger
        color={skinColor}
        pos={[dir * -0.015, -0.04, 0.04]}
        rot={[0.05, 0, dir * -0.03]}
        length={0.15}
        proximalRot={ringRot.proximal}
        distalRot={ringRot.distal}
      />

      {/* Pinky */}
      <Finger
        color={skinColor}
        pos={[dir * -0.045, -0.04, 0.04]}
        rot={[0.08, 0, dir * -0.08]}
        length={0.12}
        thickness={0.02}
        proximalRot={pinkyRot.proximal}
        distalRot={pinkyRot.distal}
      />
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
        // Invert X for mirror effect if needed, but usually landmarks are already processed
        // MediaPipe coords: X right, Y down (we flipped Y in store). 
        // Arm Rotation Z: Raise/Lower arm.
        // Arm Rotation X: Forward/Back.

        // Tuning for natural feel:
        // When wrist is high (y > 0), arm rotates up (Z).
        // Scaling factors adjusted for visual match

        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z, wrist.x * 2.0 + 0.3, 0.15
        );
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x, wrist.y * -1.5, 0.15
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
          rightArmRef.current.rotation.z, wrist.x * 2.0 - 0.3, 0.15
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x, wrist.y * -1.5, 0.15
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

  // Get data for passing to Hands
  // We can't access store inside the child component efficiently if we want to avoid re-renders,
  // but for the Hand component which is pure geometry, passing props is fine or reading from reference.
  // Actually, to make Hand animate smoothly without re-rendering the whole tree, 
  // we might want Hand to use useFrame internally OR pass a refined ref.
  // But given standard React patterns, passing the data from the parent useFrame (via store state) 
  // requires state updates which cause re-renders. 
  // BETTER: Let the Hand component subscribe or simple props if we accept re-renders (might be jerky).
  // OPTIMAL: The parent (HalfBody) re-renders? No, useFrame is imperative. 

  // FIX: To keep it fast, we will read the store inside the Hand component's own useFrame?
  // No, we'll pass the *current* landmarks from global store in the render loop? 
  // Actually, React doesn't update props inside useFrame unless state changes.
  // So we'll fetch from store INSIDE the Hand component or pass a comprehensive object.
  // Let's make Hand read the store directly to avoid parent re-renders? 
  // No, let's keep it simple: The AvatarHalfBody updates 60fps? No, R3F components don't re-render 60fps.
  // We need to implement the rotation logic imperatively in useFrame or use a transient store.

  // Revised approach for Hand:
  // We will pass the `side` prop to Hand, and Hand will use `useFrame` to read the store and update itself.

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
          <ReactiveHand color={color} side="left" />
        </group>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.52, 0.38, 0]}>
        <Limb rTop={0.13} rBot={0.11} h={0.55} color={color} pos={[0, -0.3, 0]} />
        <Joint r={0.11} color={bodyColor} pos={[0, -0.58, 0]} />
        <Limb rTop={0.1} rBot={0.08} h={0.45} color={bodyColor} pos={[0, -0.83, 0]} />
        <Joint r={0.075} color={bodyColor} pos={[0, -1.06, 0]} />
        <group ref={rightHandRef} position={[0, -1.14, 0]}>
          <ReactiveHand color={color} side="right" />
        </group>
      </group>
    </group>
  );
};

// --- Reactive Hand Component ---
// Reads store directly to avoid React render cycles

const ReactiveHand = ({ color, side, dataSource }: { color: string, side: 'left' | 'right', dataSource?: 'left' | 'right' }) => {
  const isLeft = side === 'left';
  const dir = isLeft ? 1 : -1;

  // Use explicit dataSource if provided, otherwise default to side
  // But we want to SWAP them for the avatar.
  // If dataSource="right" (User Right Hand), we read state.rightHandData
  const sourceSide = dataSource || side;

  const skinColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.88);
    return '#' + c.getHexString();
  }, [color]);

  // Refs for fingers... (unchanged)
  const thumbRef = useRef<THREE.Group>(null);
  const indexRef = useRef<THREE.Group>(null);
  const middleRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const pinkyRef = useRef<THREE.Group>(null);

  // Helper... (unchanged)
  const updateFinger = (ref: THREE.Group | null, rotations: { proximal: number, distal: number }, baseRot: [number, number, number]) => {
    if (!ref) return;
    ref.rotation.set(baseRot[0] + rotations.proximal, baseRot[1], baseRot[2]);
    const pipGroup = ref.children[1] as THREE.Group;
    if (pipGroup && pipGroup.isGroup) pipGroup.rotation.x = rotations.distal;
  };

  const getFingerRotations = (landmarks: any[], indices: number[]) => {
    if (!landmarks || landmarks.length === 0) return { proximal: 0, distal: 0 };
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];

    const v1 = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z).normalize();
    const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z).normalize();
    const dot1 = v1.dot(v2);
    const angle1 = Math.acos(Math.min(Math.max(dot1, -1), 1));

    const v3 = new THREE.Vector3(p4.x - p3.x, p4.y - p3.y, p4.z - p3.z).normalize();
    const dot2 = v2.dot(v3);
    const angle2 = Math.acos(Math.min(Math.max(dot2, -1), 1));

    return { proximal: angle1 * 1.8, distal: angle2 * 1.8 };
  };

  useFrame(() => {
    const state = useAvatarStore.getState();
    const data = sourceSide === 'left' ? state.leftHandData : state.rightHandData;

    // ... (rest of logic same)

    if (data.isTracked && data.landmarks.length > 0) {
      const l = data.landmarks;
      // Animate fingers
      updateFinger(thumbRef.current, getFingerRotations(l, FINGER_INDICES.thumb), [0.3, 0, dir * 0.6]);
      updateFinger(indexRef.current, getFingerRotations(l, FINGER_INDICES.index), [0.1, 0, dir * 0.05]);
      updateFinger(middleRef.current, getFingerRotations(l, FINGER_INDICES.middle), [0.05, 0, 0]);
      updateFinger(ringRef.current, getFingerRotations(l, FINGER_INDICES.ring), [0.05, 0, dir * -0.03]);
      updateFinger(pinkyRef.current, getFingerRotations(l, FINGER_INDICES.pinky), [0.08, 0, dir * -0.08]);
    } else {
      // Reset to open hand when not tracked
      const zero = { proximal: 0, distal: 0 };
      updateFinger(thumbRef.current, zero, [0.3, 0, dir * 0.6]);
      updateFinger(indexRef.current, zero, [0.1, 0, dir * 0.05]);
      updateFinger(middleRef.current, zero, [0.05, 0, 0]);
      updateFinger(ringRef.current, zero, [0.05, 0, dir * -0.03]);
      updateFinger(pinkyRef.current, zero, [0.08, 0, dir * -0.08]);
    }
  });

  // We wrap fingers in forwardRef to attach to the Group? No, standard ref works on Group.
  // We need to modify Finger component to accept ref? 
  // Easier to just inline or make Finger accept an external ref or forwardRef.
  // Let's make Finger use forwardRef. 

  // Wait, I can't easily change Finger to forwardRef without changing its definition above.
  // Instead, I'll just render the structure directly inside ReactiveHand or use a wrapper.
  // Or, I can define RefFinger.

  return (
    <group>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[0.14, 0.08, 0.1]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} metalness={0.08} />
      </mesh>

      <RefFinger ref={thumbRef} color={skinColor} pos={[dir * 0.06, 0, 0.04]} />
      <RefFinger ref={indexRef} color={skinColor} pos={[dir * 0.045, -0.04, 0.04]} length={0.16} />
      <RefFinger ref={middleRef} color={skinColor} pos={[dir * 0.015, -0.04, 0.04]} length={0.17} />
      <RefFinger ref={ringRef} color={skinColor} pos={[dir * -0.015, -0.04, 0.04]} length={0.15} />
      <RefFinger ref={pinkyRef} color={skinColor} pos={[dir * -0.045, -0.04, 0.04]} length={0.12} thickness={0.02} />
    </group>
  );
}

// Finger component compatible with Refs for animation
import { forwardRef } from 'react';

const RefFinger = forwardRef<THREE.Group, {
  color: string; pos: [number, number, number];
  length?: number; thickness?: number;
}>(({ color, pos, length = 0.18, thickness = 0.025 }, ref) => {
  const half = length / 2;
  return (
    <group ref={ref} position={pos}>
      {/* Proximal Phalanx */}
      <Limb rTop={thickness} rBot={thickness * 0.9} h={half} color={color} pos={[0, -half / 2, 0]} />

      {/* Joint (PIP) - This is children[1] */}
      <group position={[0, -half, 0]}>
        <Joint r={thickness * 0.85} color={color} pos={[0, 0, 0]} />
        {/* Distal Phalanx */}
        <Limb rTop={thickness * 0.9} rBot={thickness * 0.6} h={half * 0.8} color={color} pos={[0, -half * 0.4, 0]} />
        {/* Tip */}
        <Joint r={thickness * 0.55} color={color} pos={[0, -half * 0.8, 0]} />
      </group>
    </group>
  );
});
