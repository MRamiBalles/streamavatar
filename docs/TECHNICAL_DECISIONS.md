# StreamAvatar — Technical Decision Record

Registro de decisiones técnicas tomadas durante el desarrollo. Cada entrada justifica el "por qué" detrás de las elecciones de arquitectura.

---

## TDR-001: VRM como Estándar de Modelos 3D

**Fecha:** 2026-01-15  
**Estado:** Aprobado

### Contexto

StreamAvatar necesita un formato de modelo 3D que permita:
- Animación facial con blendshapes
- Física secundaria (pelo, ropa)
- Compatibilidad con el ecosistema VTuber

### Opciones Evaluadas

| Formato | Pros | Contras |
|---------|------|---------|
| GLB/GLTF | Universal, bien soportado | Sin estándar de expresiones faciales |
| FBX | Común en industria | Propietario, pesado para web |
| **VRM** | Estándar abierto, expresiones definidas, Spring Bones | Requiere @pixiv/three-vrm |

### Decisión

Adoptar VRM como formato primario, con soporte legacy para GLB.

### Consecuencias

- Se integró `@pixiv/three-vrm` (v2.1.3)
- Se implementó mapeo ARKit→VRM en `vrmTrackingBridge.ts`
- Se habilitó Spring Bones para física de pelo/ropa

---

## TDR-002: Análisis de Visemas Basado en Formantes

**Fecha:** 2026-02-01  
**Estado:** Aprobado

### Contexto

El lip-sync básico por volumen no es convincente. Los usuarios esperan que la boca del avatar refleje las vocales que pronuncian.

### Opciones Evaluadas

| Método | Precisión | Latencia | Complejidad |
|--------|-----------|----------|-------------|
| Volumen simple | Baja | <1ms | Mínima |
| MFCC + ML | Alta (~80%) | 20-50ms | Requiere modelo |
| **Formantes FFT** | Media (~60%) | <5ms | Moderada |

### Decisión

Análisis de formantes via Web Audio API. No requiere modelos ML, funciona en tiempo real.

### Implementación

Las vocales se detectan por su firma de frecuencia (F1):
- **Aa** (boca abierta): 700-1100 Hz
- **Ee** (sonrisa): 250-400 Hz
- **Oh** (redondeada): 450-650 Hz
- **Ou** (fruncida): 280-450 Hz

Precisión suficiente para streaming. Una implementación con MFCC queda como mejora futura.

---

## TDR-003: Headers COOP/COEP para WASM

**Fecha:** 2026-02-01  
**Estado:** Aprobado

### Contexto

MediaPipe requiere `SharedArrayBuffer` para threading en su módulo WASM. Sin los headers correctos, el tracking facial falla silenciosamente.

### Requisitos

Según la especificación web, `SharedArrayBuffer` solo es accesible en contextos "cross-origin isolated". Esto requiere:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Decisión

Añadir headers en `vite.config.ts` tanto para `server` como para `preview`.

### Impacto

- Recursos externos (imágenes, fuentes) deben incluir `crossorigin` o estar en mismo origen
- Iframes de terceros pueden romperse
- Es el comportamiento esperado para apps con WASM intensivo

---

## TDR-004: 3D Gaussian Splatting (Evaluación)

**Fecha:** 2026-02-01  
**Estado:** En Evaluación

### Contexto

Los papers recientes (TaoAvatar, AHA!) demuestran avatares fotorrealistas con 3DGS a ≥90 FPS. Esto superaría visualmente a cualquier competidor basado en mallas.

### Librerías Evaluadas

| Librería | Renderer | GPU Sort | Estado |
|----------|----------|----------|--------|
| **GaussianSplats3D** | Three.js | CPU (artifactos posibles) | Maduro, activo |
| WebGPU-Splat | WebGPU | GPU | Experimental |
| Luma Web | Propio | GPU | Cerrado |

### Limitaciones Actuales

1. **Soporte WebGPU**: Chrome soporta, Firefox experimental, Safari no
2. **Avatares animados**: 3DGS fue diseñado para escenas estáticas. Animar gaussianas requiere técnicas de "rigging" no estándar
3. **Tamaño de assets**: Archivos .splat de calidad pueden superar 50MB

### Decisión Provisional

Integrar GaussianSplats3D como visor experimental para escenas estáticas. Los avatares animables seguirán siendo VRM hasta que la tecnología madure.

### Próximos Pasos

1. Crear componente `SplatViewer.tsx` con GaussianSplats3D
2. Añadir soporte para carga de `.splat` en UI
3. Documentar limitaciones en README

---

## TDR-005: Normalización Automática de Modelos

**Fecha:** 2026-02-01  
**Estado:** Aprobado

### Contexto

Los usuarios suben modelos de diversas fuentes. Algunos vienen:
- Escalados incorrectamente (gigantes o microscópicos)
- Con sistema de coordenadas Z-up (Blender por defecto)
- Descentrados respecto al origen

### Decisión

Implementar `modelNormalizer.ts` que automáticamente:
1. Centra el modelo en el origen (pies en Y=0)
2. Escala a 2.0 unidades de altura
3. Detecta y corrige modelos Z-up

### Detección Z-up

Si la extensión en Z es significativamente mayor que en Y, el modelo probablemente usa coordenadas Z-up:

```typescript
return size.z > size.y * 0.5; // umbral 50%
```

### Beneficio

Los usuarios no necesitan preparar sus modelos. "It just works."

---

## TDR-006: URL Configuration para OBS

**Fecha:** 2026-02-01  
**Estado:** Aprobado

### Contexto

Los streamers necesitan configurar el avatar sin tocar la UI durante emisión. OBS Browser Source no permite interacción.

### Solución

Parámetros de URL en `/view`:

```
/view?avatar=cat&color=ff6b35&bg=chroma-green&scale=1.2
```

### Parámetros Soportados

| Param | Tipo | Validación |
|-------|------|------------|
| `avatar` | enum | Lista blanca de tipos |
| `color` | hex | Regex `/^[0-9a-fA-F]{6}$/` |
| `bg` | enum | transparent, chroma-green, chroma-blue |
| `scale` | float | Clamp 0.5-3.0 |

### Seguridad

No se permite pasar URLs de modelos como parámetro para evitar carga de contenido malicioso desde enlaces compartidos.
