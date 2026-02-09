/**
 * Feature Flags System
 * 
 * Manages experimental features without destabilizing production.
 * See: .specify/memory/feature-flags.md for documentation.
 * 
 * @compliance Constitution §3 (Architecture Decoupling)
 */

export const FEATURE_FLAGS = {
  /** 3D Gaussian Splatting experimental renderer. High VRAM usage. */
  ENABLE_3DGS: import.meta.env.VITE_ENABLE_3DGS === 'true',
  
  /** WebGPU backend for Three.js. Requires Chrome 121+. */
  ENABLE_WEBGPU: import.meta.env.VITE_ENABLE_WEBGPU === 'true',
  
  /** AI avatar generation with Stable Diffusion local/API. */
  ENABLE_AI_GENERATOR: import.meta.env.VITE_ENABLE_AI_GENERATOR === 'true',
  
  /** Limbic System: emotion detection from audio prosody. */
  ENABLE_AUDIO_EMOTION: import.meta.env.VITE_ENABLE_AUDIO_EMOTION === 'true',
  
  /** Debug HUD overlay: FPS, Draw Calls, Memory stats. */
  ENABLE_DEBUG_HUD: import.meta.env.VITE_ENABLE_DEBUG_HUD === 'true',
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Hook for checking feature flag status in components.
 * Use with Suspense for lazy-loaded experimental features.
 * 
 * @example
 * ```tsx
 * const enable3DGS = useFeatureFlag('ENABLE_3DGS');
 * if (enable3DGS) {
 *   return <Suspense><GaussianSplatRenderer /></Suspense>;
 * }
 * ```
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all active feature flags for debugging.
 */
export function getActiveFlags(): FeatureFlagKey[] {
  return (Object.entries(FEATURE_FLAGS) as [FeatureFlagKey, boolean][])
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);
}
