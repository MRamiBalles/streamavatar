/**
 * Audio Slice — Audio reactive, lip-sync, and microphone state
 */
import { StateCreator } from 'zustand';

// =============================================================================
// Types
// =============================================================================

interface AudioData {
  volume: number;
  bass: number;
  treble: number;
}

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface AudioSlice {
  audioData: AudioData;
  audioSensitivity: number;
  audioReactiveEnabled: boolean;
  lipSyncEnabled: boolean;

  setAudioData: (data: AudioData) => void;
  setAudioSensitivity: (sensitivity: number) => void;
  setAudioReactiveEnabled: (enabled: boolean) => void;
  setLipSyncEnabled: (enabled: boolean) => void;
}

// =============================================================================
// Default State
// =============================================================================

export const audioDefaults = {
  audioData: { volume: 0, bass: 0, treble: 0 },
  audioSensitivity: 1.5,
  audioReactiveEnabled: false,
  lipSyncEnabled: false,
};

// =============================================================================
// Slice Creator
// =============================================================================

export const createAudioSlice: StateCreator<AudioSlice, [], [], AudioSlice> = (set) => ({
  ...audioDefaults,

  setAudioData: (data) => set({ audioData: data }),
  setAudioSensitivity: (sensitivity) => set({ audioSensitivity: sensitivity }),
  setAudioReactiveEnabled: (enabled) => set({ audioReactiveEnabled: enabled }),
  setLipSyncEnabled: (enabled) => set({ lipSyncEnabled: enabled }),
});
