# Changelog

Historial de cambios significativos en StreamAvatar.

---

## [2.0.0] - 2026-02-01

### Añadido

**VRM Professional Integration**
- Spring Bones para física de pelo y ropa
- Tracking Bridge: mapeo de 52 blendshapes ARKit a VRM
- Normalización automática de modelos (escala, centrado, fix Z-up)
- URL Configuration para OBS (`/view?avatar=cat&color=ff6b35`)

**Audio2Face (Lip-Sync)**
- Análisis de visemas basado en formantes FFT
- Detección de vocales A/I/U/E/O en tiempo real
- Integración con VRMExpressionManager

**3D Gaussian Splatting (Experimental)**
- SplatViewer para archivos .splat/.ply
- Documentación de integración y limitaciones

**Configuración**
- Headers COOP/COEP para WASM threading
- Code splitting para Three.js/VRM
- lipSyncEnabled toggle en store

### Mejorado

- `CustomModelAvatar.tsx` reescrito con arquitectura modular
- `CleanView.tsx` con parsing de parámetros URL
- Documentación técnica en `/docs`

### Documentación

- `TECHNICAL_DECISIONS.md` — Registro de decisiones de arquitectura
- `VRM_INTEGRATION.md` — Guía de integración VRM
- `3DGS_ANALYSIS.md` — Análisis de 3D Gaussian Splatting

---

## [1.5.0] - 2026-01-28

### Añadido

- AI Idle Animations (parpadeo, respiración, cabeza)
- Sistema de animación unificado (`useAvatarAnimation`)
- Integración en los 6 avatares base

---

## [1.0.0] - 2026-01-15

### Inicial

- Avatares básicos: Pill, Sphere, Boxy, Cat, Ghost, Emoji
- Face tracking con MediaPipe
- Audio reactive básico
- Carga de modelos VRM/GLB
- Internacionalización ES/EN
