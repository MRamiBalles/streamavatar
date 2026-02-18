import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAvatarStore } from '@/stores/avatarStore';
import * as THREE from 'three';

/**
 * FaceLandmarks Component
 * 
 * Renders diagnostic dots for:
 * - Face landmarks (red, ~90 points)
 * - Estimated body points (orange, ~14 points)
 * - Hand landmarks (green, 21 per hand = up to 42 points)
 */

const FACE_DOT_COUNT = 90;
const BODY_DOT_COUNT = 14;
const HAND_DOT_COUNT = 21; // per hand
const TOTAL_DOTS = FACE_DOT_COUNT + BODY_DOT_COUNT + HAND_DOT_COUNT * 2;

export const FaceLandmarks = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    const { faceData, isTracking, background, leftHandData, rightHandData } = useAvatarStore.getState();
    if (!isTracking || !faceData.facePoints || faceData.facePoints.length === 0) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    const isAR = background === 'ar-camera';
    const planeZ = isAR ? -9.0 : 1.0;
    const cameraZ = 4;
    const distanceToCamera = Math.abs(cameraZ - planeZ);

    const fov = (camera as THREE.PerspectiveCamera).fov || 50;
    const aspect = viewport.aspect;
    const activeHeight = 2 * Math.tan((fov * Math.PI) / 180 / 2) * distanceToCamera;
    const activeWidth = activeHeight * aspect;

    const points = groupRef.current.children;
    let dotIdx = 0;

    // --- Face landmarks ---
    const faceCount = Math.min(faceData.facePoints.length, FACE_DOT_COUNT);
    for (let i = 0; i < faceCount; i++) {
      const p = faceData.facePoints[i];
      points[dotIdx].position.set(p.x * activeWidth, p.y * activeHeight, planeZ);
      points[dotIdx].visible = true;
      dotIdx++;
    }
    // Fill remaining face slots
    for (let i = faceCount; i < FACE_DOT_COUNT; i++) {
      points[dotIdx].visible = false;
      dotIdx++;
    }

    // --- Body estimation ---
    const chin = faceData.facePoints[9];
    const leftJaw = faceData.facePoints[15];
    const rightJaw = faceData.facePoints[7];

    if (chin && leftJaw && rightJaw) {
      const faceWidth = Math.abs(rightJaw.x - leftJaw.x);
      const shoulderSpread = faceWidth * 2.8;
      const neckLen = faceWidth * 0.6;

      const bodyPoints: [number, number][] = [
        [chin.x, chin.y - neckLen * 0.3],
        [chin.x, chin.y - neckLen],
        [chin.x - shoulderSpread * 0.3, chin.y - neckLen * 1.1],
        [chin.x - shoulderSpread * 0.5, chin.y - neckLen * 1.05],
        [chin.x - shoulderSpread * 0.5, chin.y - neckLen * 1.3],
        [chin.x + shoulderSpread * 0.3, chin.y - neckLen * 1.1],
        [chin.x + shoulderSpread * 0.5, chin.y - neckLen * 1.05],
        [chin.x + shoulderSpread * 0.5, chin.y - neckLen * 1.3],
        [chin.x, chin.y - neckLen * 1.5],
        [chin.x, chin.y - neckLen * 2.2],
        [chin.x, chin.y - neckLen * 3.0],
        [chin.x - shoulderSpread * 0.35, chin.y - neckLen * 2.0],
        [chin.x + shoulderSpread * 0.35, chin.y - neckLen * 2.0],
        [chin.x, chin.y - neckLen * 3.5],
      ];

      for (let j = 0; j < BODY_DOT_COUNT; j++) {
        if (j < bodyPoints.length) {
          points[dotIdx].position.set(bodyPoints[j][0] * activeWidth, bodyPoints[j][1] * activeHeight, planeZ);
          points[dotIdx].visible = true;
        } else {
          points[dotIdx].visible = false;
        }
        dotIdx++;
      }
    } else {
      for (let j = 0; j < BODY_DOT_COUNT; j++) {
        points[dotIdx].visible = false;
        dotIdx++;
      }
    }

    // --- Left hand landmarks (21 points) ---
    for (let i = 0; i < HAND_DOT_COUNT; i++) {
      if (leftHandData.isTracked && i < leftHandData.landmarks.length) {
        const p = leftHandData.landmarks[i];
        points[dotIdx].position.set(p.x * activeWidth, p.y * activeHeight, planeZ);
        points[dotIdx].visible = true;
      } else {
        points[dotIdx].visible = false;
      }
      dotIdx++;
    }

    // --- Right hand landmarks (21 points) ---
    for (let i = 0; i < HAND_DOT_COUNT; i++) {
      if (rightHandData.isTracked && i < rightHandData.landmarks.length) {
        const p = rightHandData.landmarks[i];
        points[dotIdx].position.set(p.x * activeWidth, p.y * activeHeight, planeZ);
        points[dotIdx].visible = true;
      } else {
        points[dotIdx].visible = false;
      }
      dotIdx++;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
        let color = '#ff0000';
        let size = 0.025;
        if (i >= FACE_DOT_COUNT && i < FACE_DOT_COUNT + BODY_DOT_COUNT) {
          color = '#ff6600'; // Body = orange
          size = 0.035;
        } else if (i >= FACE_DOT_COUNT + BODY_DOT_COUNT) {
          color = '#00ff44'; // Hands = green
          size = 0.03;
        }
        return (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[size, 6, 6]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};
