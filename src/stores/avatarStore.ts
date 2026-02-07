/**
 * StreamAvatar - Global State Store (Composed from Slices)
 *
 * Each domain (avatar, audio, tracking, UI, config) lives in its own slice
 * under `src/stores/slices/`. This file composes them into a single store.
 *
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Slices
import { createAvatarSlice, type AvatarSlice } from './slices/avatarSlice';
import { createAudioSlice, type AudioSlice } from './slices/audioSlice';
import { createTrackingSlice, type TrackingSlice } from './slices/trackingSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createConfigSlice, type ConfigSlice } from './slices/configSlice';

// Locale files
import esLocale from '@/locales/es.json';
import enLocale from '@/locales/en.json';

// =============================================================================
// Re-export types for backward compatibility
// =============================================================================

export type {
  AvatarType,
  ExpressionType,
  CustomModel,
  AvatarPart,
  AvatarPreset,
  HotkeyMapping,
} from './slices/avatarSlice';

export type { FaceData } from './slices/trackingSlice';
export type { BackgroundType, Language } from './slices/uiSlice';

// =============================================================================
// Combined Store Type
// =============================================================================

export type AvatarStore = AvatarSlice & AudioSlice & TrackingSlice & UISlice & ConfigSlice;

// =============================================================================
// Store Implementation
// =============================================================================

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (...args) => ({
      ...createAvatarSlice(...args),
      ...createAudioSlice(...args),
      ...createTrackingSlice(...args),
      ...createUISlice(...args),
      ...createConfigSlice(...args),
    }),
    {
      name: 'streamavatar-config',
      version: 2,
      partialize: (state) => ({
        selectedAvatar: state.selectedAvatar,
        avatarColor: state.avatarColor,
        avatarScale: state.avatarScale,
        background: state.background,
        audioSensitivity: state.audioSensitivity,
        language: state.language,
        presets: state.presets,
        currentParts: state.currentParts,
        activePresetId: state.activePresetId,
        hotkeyMappings: state.hotkeyMappings,
        graphicsQuality: state.graphicsQuality,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);

// =============================================================================
// Translations
// =============================================================================

const translations = {
  es: esLocale,
  en: enLocale,
};

export const useTranslation = () => {
  const language = useAvatarStore((state) => state.language);
  return translations[language];
};
