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
}

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface TrackingSlice {
  faceData: FaceData;
  isCameraActive: boolean;
  isTracking: boolean;

  setFaceData: (data: FaceData) => void;
  setCameraActive: (active: boolean) => void;
  setTracking: (tracking: boolean) => void;
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
  } as FaceData,
  isCameraActive: false,
  isTracking: false,
};

// =============================================================================
// Slice Creator
// =============================================================================

export const createTrackingSlice: StateCreator<TrackingSlice, [], [], TrackingSlice> = (set) => ({
  ...trackingDefaults,

  setFaceData: (data) => set({ faceData: data }),
  setCameraActive: (active) => set({ isCameraActive: active }),
  setTracking: (tracking) => set({ isTracking: tracking }),
});
