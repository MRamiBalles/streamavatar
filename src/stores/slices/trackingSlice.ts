/**
 * Tracking Slice — Face tracking data and camera state
 */
import { StateCreator } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export interface FaceData {
  headRotation: { x: number; y: number; z: number };
  mouthOpen: number;
  leftEyeBlink: number;
  rightEyeBlink: number;
  /** SDD: Full ARKit blendshape coefficients (52 indices) */
  rawCoefficients?: Float32Array;
  /** SDD: Raw head rotation as quaternion [x, y, z, w] */
  rawRotation?: [number, number, number, number];
  /** SDD: Head position from transformation matrix (x, y, z) */
  headPosition?: { x: number; y: number; z: number };
}

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface TrackingSlice {
  faceData: FaceData;
  isCameraActive: boolean;
  isTracking: boolean;
  videoElement: HTMLVideoElement | null;

  setFaceData: (data: FaceData) => void;
  setCameraActive: (active: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;
}

// =============================================================================
// Default State
// =============================================================================

export const trackingDefaults = {
  faceData: {
    headRotation: { x: 0, y: 0, z: 0 },
    mouthOpen: 0,
    leftEyeBlink: 0,
    rightEyeBlink: 0,
    rawCoefficients: new Float32Array(52),
    rawRotation: [0, 0, 0, 1],
    headPosition: { x: 0, y: 0, z: 0 },
  } as FaceData,
  isCameraActive: false,
  isTracking: false,
  videoElement: null,
};

// =============================================================================
// Slice Creator
// =============================================================================

export const createTrackingSlice: StateCreator<TrackingSlice, [], [], TrackingSlice> = (set) => ({
  ...trackingDefaults,

  setFaceData: (data) => set({ faceData: data }),
  setCameraActive: (active) => set({ isCameraActive: active }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  setVideoElement: (element) => set({ videoElement: element }),
});
