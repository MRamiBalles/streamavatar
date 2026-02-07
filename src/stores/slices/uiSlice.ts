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
});
