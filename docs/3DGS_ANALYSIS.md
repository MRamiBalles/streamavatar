# 3D Gaussian Splatting — Análisis de Integración

Evaluación técnica para la incorporación de 3DGS en StreamAvatar.

---

## ¿Qué es 3D Gaussian Splatting?

Una técnica de renderizado que representa escenas 3D como nubes de "gaussianas" (elipses 3D con color y opacidad). Ventajas sobre mallas tradicionales:

- Captura de detalles finos (pelo, piel, tela) sin geometría explícita
- Renderizado ≥90 FPS en hardware moderno
- Generación automática desde fotos/video (photogrammetry)

---

## Estado del Arte (Enero-Febrero 2026)

### Papers Relevantes

| Paper | Contribución | Aplicabilidad |
|-------|--------------|---------------|
| **TaoAvatar** | Avatares 3DGS de cuerpo completo, 90 FPS en móvil | Alta |
| **AHA!** | Separación de renderizado y movimiento | Media |
| arXiv 2601.20833 | Síntesis de avatares desde texto/imagen | Experimental |

### Librerías JavaScript

| Librería | Motor | GPU Sort | Nota |
|----------|-------|----------|------|
| **GaussianSplats3D** | Three.js | CPU | Más maduro, activamente mantenido |
| WebGPU-Splat | WebGPU | GPU | Mejor rendimiento, menor compatibilidad |

---

## GaussianSplats3D — Análisis Detallado

**Repositorio:** [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)  
**Autor:** Mark Kellogg  
**Licencia:** MIT

### Formatos Soportados

| Formato | Descripción | Tamaño Típico |
|---------|-------------|---------------|
| `.ply` | Original de INRIA, sin comprimir | 50-200 MB |
| `.splat` | Formato común, compatible | 20-80 MB |
| `.ksplat` | Comprimido, propietario de la lib | 5-30 MB |

### Integración con Three.js

```javascript
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

const viewer = new GaussianSplats3D.Viewer({
  threeScene: scene, // Escena Three.js existente
  selfDrivenMode: false,
});

await viewer.addSplatScene('model.ksplat', {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
});
```

### Limitaciones

1. **CPU Sort**: El ordenamiento de splats se hace en CPU. Con cámaras rápidas pueden verse artefactos de z-fighting.
2. **Sin animación nativa**: 3DGS fue diseñado para escenas estáticas. Animar un avatar requiere técnicas híbridas.
3. **Compatibilidad**: Funciona en navegadores modernos, pero WebGPU (para GPU sort) aún no es universal.

---

## Plan de Integración

### Fase 1: Visor Experimental

Objetivo: Permitir cargar escenas `.splat` estáticas como fondos o decoración.

```
┌─────────────────────────────────────────┐
│             SplatViewer.tsx             │
│  ┌────────────┐    ┌────────────────┐  │
│  │  Three.js  │ ←→ │ GaussianSplats │  │
│  │   Scene    │    │      3D        │  │
│  └────────────┘    └────────────────┘  │
└─────────────────────────────────────────┘
```

### Fase 2: Avatares Híbridos (Futuro)

Combinar VRM (para tracking facial) con 3DGS (para renderizado de pelo/piel).

```
┌─────────────────────────────────────────┐
│         Hybrid Avatar Pipeline          │
│                                         │
│  [Tracking] → [VRM Bones] → [3DGS Render]
│                                         │
└─────────────────────────────────────────┘
```

Esto requeriría:
- Rig SMPL/SMPL-X para deformación
- Bake de expresiones a gaussianas
- Investigación activa (no production-ready)

---

## Instalación

```bash
npm install @mkkellogg/gaussian-splats-3d
```

---

## Decisión

Integrar GaussianSplats3D como **feature experimental** para:
- Escenas de fondo fotorrealistas
- Demostración de tecnología

Los avatares animados seguirán siendo VRM hasta que el ecosistema 3DGS madure para animación en tiempo real.
