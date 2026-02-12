/**
 * UI Slice — Language, graphics, privacy, background, onboarding
 */
import { StateCreator } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export type BackgroundType = 'dark' | 'chroma-green' | 'chroma-blue' | 'transparent' | 'splat';
export type Language = 'es' | 'en';

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface UISlice {
  background: BackgroundType;
  language: Language;
  graphicsQuality: 'low' | 'high';
  obfuscationMode: boolean;
  privacyShieldActive: boolean;
  onboardingCompleted: boolean;

  setBackground: (bg: BackgroundType) => void;
  setLanguage: (lang: Language) => void;
  setGraphicsQuality: (quality: 'low' | 'high') => void;
  setObfuscationMode: (enabled: boolean) => void;
  setPrivacyShieldActive: (active: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  publishedUrl: string | null; // URL pública personalizada para OBS / Custom public URL for OBS
  setPublishedUrl: (url: string | null) => void; // Acción para actualizar la URL / Action to update URL
}

// =============================================================================
// Default State
// =============================================================================

export const uiDefaults = {
  background: 'dark' as BackgroundType,
  language: 'es' as Language,
  graphicsQuality: 'high' as 'low' | 'high',
  obfuscationMode: false,
  privacyShieldActive: true,
  onboardingCompleted: false,
  publishedUrl: null, // Por defecto es null / Default is null
};

// =============================================================================
// Slice Creator
// =============================================================================

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  ...uiDefaults,

  setBackground: (bg) => set({ background: bg }),
  setLanguage: (lang) => set({ language: lang }),
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
  setObfuscationMode: (enabled) => set({ obfuscationMode: enabled }),
  setPrivacyShieldActive: (active) => set({ privacyShieldActive: active }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  setPublishedUrl: (url) => set({ publishedUrl: url }),
});
