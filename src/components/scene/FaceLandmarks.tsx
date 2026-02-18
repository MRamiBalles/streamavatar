import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAvatarStore } from '@/stores/avatarStore';
import * as THREE from 'three';

/**
 * FaceLandmarks Component
 * 
 * Diagnostic tool that renders red dots on detected facial landmarks
 * plus estimated neck/shoulder/torso body points for full upper-body coverage.
 */

/** Number of estimated body points appended after face landmarks */
const BODY_ESTIMATION_COUNT = 14;

export const FaceLandmarks = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();

  // Pre-create dot materials to avoid re-allocation
  const faceMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff0000', toneMapped: false }), []);
  const bodyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff4444', toneMapped: false }), []);

  useFrame(() => {
    if (!groupRef.current) return;

    const { faceData, isTracking, background } = useAvatarStore.getState();
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

    const facePointCount = faceData.facePoints.length;
    const points = groupRef.current.children;

    // --- Render face tracking points ---
    for (let i = 0; i < facePointCount && i < points.length; i++) {
      const p = faceData.facePoints[i];
      points[i].position.set(p.x * activeWidth, p.y * activeHeight, planeZ);
      points[i].visible = true;
    }

    // --- Estimate body points from face anchors ---
    // Use chin (index ~16 in our array = landmark 152) and jaw sides for reference
    // Our diagnosticIndices: face contour starts at 0, chin is at index 9 (landmark 152)
    // Left jaw: index 15 (landmark 172), Right jaw: index 7 (landmark 389)
    const chin = faceData.facePoints[9];   // landmark 152 — bottom of chin
    const leftJaw = faceData.facePoints[15]; // landmark 172
    const rightJaw = faceData.facePoints[7]; // landmark 389

    if (chin && leftJaw && rightJaw) {
      const faceWidth = Math.abs(rightJaw.x - leftJaw.x);
      const shoulderSpread = faceWidth * 2.8;
      const neckLen = faceWidth * 0.6;
      const torsoLen = faceWidth * 2.5;

      // Body estimation points
      const bodyPoints: [number, number][] = [
        // Neck center top/bottom (2)
        [chin.x, chin.y - neckLen * 0.3],
        [chin.x, chin.y - neckLen],
        // Left shoulder chain (3)
        [chin.x - shoulderSpread * 0.3, chin.y - neckLen * 1.1],
        [chin.x - shoulderSpread * 0.5, chin.y - neckLen * 1.05],
        [chin.x - shoulderSpread * 0.5, chin.y - neckLen * 1.3],
        // Right shoulder chain (3)
        [chin.x + shoulderSpread * 0.3, chin.y - neckLen * 1.1],
        [chin.x + shoulderSpread * 0.5, chin.y - neckLen * 1.05],
        [chin.x + shoulderSpread * 0.5, chin.y - neckLen * 1.3],
        // Torso center line (3)
        [chin.x, chin.y - neckLen * 1.5],
        [chin.x, chin.y - neckLen * 2.2],
        [chin.x, chin.y - neckLen * 3.0],
        // Torso sides (3 — left chest, right chest, waist)
        [chin.x - shoulderSpread * 0.35, chin.y - neckLen * 2.0],
        [chin.x + shoulderSpread * 0.35, chin.y - neckLen * 2.0],
        [chin.x, chin.y - neckLen * 3.5],
      ];

      const bodyStartIdx = facePointCount;
      bodyPoints.forEach((bp, j) => {
        const idx = bodyStartIdx + j;
        if (idx < points.length) {
          points[idx].position.set(bp[0] * activeWidth, bp[1] * activeHeight, planeZ);
          points[idx].visible = true;
        }
      });

      // Hide remaining unused dots
      for (let k = bodyStartIdx + bodyPoints.length; k < points.length; k++) {
        points[k].visible = false;
      }
    }
  });

  // Face dots + body estimation dots
  const FACE_DOT_COUNT = 90;
  const TOTAL_DOTS = FACE_DOT_COUNT + BODY_ESTIMATION_COUNT;

  return (
    <group ref={groupRef}>
      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[i < FACE_DOT_COUNT ? 0.025 : 0.035, 6, 6]} />
          {i < FACE_DOT_COUNT ? (
            <meshBasicMaterial color="#ff0000" toneMapped={false} />
          ) : (
            <meshBasicMaterial color="#ff6600" toneMapped={false} />
          )}
        </mesh>
      ))}
    </group>
  );
};
