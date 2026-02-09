# Feature Flags Registry

> **Purpose:** Gestión de riesgo para funciones experimentales  
> **Compliance:** Constitution §3 (Architecture Decoupling)

---

## Active Flags

| Flag Key | Default | Risk | Description |
|----------|---------|------|-------------|
| `ENABLE_3DGS` | `false` | 🔴 High | 3D Gaussian Splatting experimental. Requiere GPU dedicada. |
| `ENABLE_WEBGPU` | `false` | 🟠 Medium | Backend WebGPU para Three.js. Chrome 121+ requerido. |
| `ENABLE_AI_GENERATOR` | `false` | 🟠 Medium | Generación de avatares con Stable Diffusion local/API. |
| `ENABLE_AUDIO_EMOTION` | `false` | 🟢 Low | Sistema Límbico: emociones desde prosodia de audio. |
| `ENABLE_DEBUG_HUD` | `false` | 🟢 Low | Overlay de stats: FPS, Draw Calls, Memory. |

---

## Implementation Pattern

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  ENABLE_3DGS: import.meta.env.VITE_ENABLE_3DGS === 'true',
  ENABLE_WEBGPU: import.meta.env.VITE_ENABLE_WEBGPU === 'true',
  ENABLE_AI_GENERATOR: import.meta.env.VITE_ENABLE_AI_GENERATOR === 'true',
  ENABLE_AUDIO_EMOTION: import.meta.env.VITE_ENABLE_AUDIO_EMOTION === 'true',
  ENABLE_DEBUG_HUD: import.meta.env.VITE_ENABLE_DEBUG_HUD === 'true',
} as const;

// Hook for conditional rendering
export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
```

---

## Usage in Components

```tsx
// Lazy load experimental features (Code Splitting)
const GaussianSplatRenderer = lazy(() => 
  import('./experimental/GaussianSplatRenderer')
);

function AvatarScene() {
  const enable3DGS = useFeatureFlag('ENABLE_3DGS');
  
  return (
    <Canvas>
      {enable3DGS ? (
        <Suspense fallback={<LoadingSpinner />}>
          <GaussianSplatRenderer />
        </Suspense>
      ) : (
        <StandardVRMRenderer />
      )}
    </Canvas>
  );
}
```

---

## Environment Configuration

```bash
# .env.development
VITE_ENABLE_DEBUG_HUD=true
VITE_ENABLE_AUDIO_EMOTION=true

# .env.production
VITE_ENABLE_DEBUG_HUD=false
VITE_ENABLE_3DGS=false
VITE_ENABLE_WEBGPU=false
```

---

## Graduation Criteria

Un flag puede graduarse a "siempre habilitado" cuando:

1. ✅ Tests de regresión pasan al 100%
2. ✅ Performance dentro de límites constitucionales (60 FPS, <5% CPU idle)
3. ✅ Sin memory leaks después de 1 hora de uso
4. ✅ Documentación de usuario completada

---

*Sistema de feature flags para desarrollo seguro de funciones experimentales.*
