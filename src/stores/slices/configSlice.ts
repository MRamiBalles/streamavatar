/**
 * Config Slice — Export, import, and reset configuration
 * 
 * This slice needs access to the full store, so we type it
 * against the combined store interface.
 */
import { StateCreator } from 'zustand';
import type { AvatarSlice } from './avatarSlice';
import type { AudioSlice } from './audioSlice';
import type { UISlice } from './uiSlice';
import { avatarDefaults } from './avatarSlice';
import { audioDefaults } from './audioSlice';
import { trackingDefaults } from './trackingSlice';
import { uiDefaults } from './uiSlice';

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface ConfigSlice {
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  resetToDefaults: () => void;
}

type FullStore = AvatarSlice & AudioSlice & UISlice & ConfigSlice;

// =============================================================================
// Slice Creator
// =============================================================================

export const createConfigSlice: StateCreator<FullStore, [], [], ConfigSlice> = (set, get) => ({
  exportConfig: () => {
    const state = get();
    const exportData = {
      version: 2,
      selectedAvatar: state.selectedAvatar,
      avatarColor: state.avatarColor,
      avatarScale: state.avatarScale,
      background: state.background,
      audioSensitivity: state.audioSensitivity,
      language: state.language,
      graphicsQuality: state.graphicsQuality,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importConfig: (configString) => {
    try {
      const config = JSON.parse(configString);
      set({
        selectedAvatar: config.selectedAvatar || 'pill',
        avatarColor: config.avatarColor || '#c97d3d',
        avatarScale: config.avatarScale || 1,
        background: config.background || 'dark',
        audioSensitivity: config.audioSensitivity || 1.5,
        language: config.language || 'es',
        graphicsQuality: config.graphicsQuality || 'high',
      });
      return true;
    } catch {
      return false;
    }
  },

  resetToDefaults: () => set({
    ...avatarDefaults,
    ...audioDefaults,
    ...trackingDefaults,
    ...uiDefaults,
  }),
});
