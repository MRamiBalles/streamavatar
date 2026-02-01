# StreamAvatar — Roadmap de Desarrollo

## Visión

Convertir StreamAvatar en la solución de avatares virtuales web de referencia, diferenciándose de competidores desktop mediante innovación en experiencia web-native, colaboración y accesibilidad.

---

## Fase 0: Estabilización (Actual → 2 semanas)

### Objetivo
Cerrar brechas entre documentación y realidad del código.

### Tareas

| Tarea | Prioridad | Esfuerzo | Descripción |
|-------|-----------|----------|-------------|
| Eliminar UI de "streaming RTMP" | Alta | 2h | Quitar configuración de RTMP que no funciona. Evita confusión. |
| Completar import VRM/GLB | Alta | 8h | Funcionalidad marcada "coming soon" que ya tiene infraestructura. |
| Internacionalización completa | Media | 4h | Mover todos los strings hardcoded al sistema de traducciones. |
| Tests unitarios básicos | Media | 6h | Cubrir avatarStore y hooks principales. |
| Actualizar README | Alta | 2h | Reflejar estado real, quitar template de Lovable. |
| Documentar setup OBS | Alta | 3h | Tutorial paso a paso con capturas. |

### Entregables
- [ ] App sin features "fantasma"
- [ ] Import de modelos custom funcional
- [ ] README profesional
- [ ] Guía de OBS publicada

---

## Fase 1: Diferenciación (Semanas 3-8)

### Objetivo
Implementar features que nos distingan de la competencia.

### Feature 1: AI Idle Animations ⭐ BANDERA

**Descripción:** Cuando el tracking detecta rostro quieto (o sin tracking activo), el avatar no se queda congelado. En su lugar:

- Parpadeos naturales aleatorios (usando distribución normal, no uniformes)
- Micro-movimientos de cabeza (ruido Perlin sutil)
- Respiración visible (movimiento torso/hombros)
- Miradas ocasionales a puntos de interés

**Por qué diferencia:** La mayoría de software VTuber tiene idle básico o ninguno. Este nivel de pulido se nota inmediatamente.

**Esfuerzo estimado:** 15-20h

**Implementación técnica:**
```typescript
// Pseudocódigo conceptual
function useIdleAnimations() {
  const lastActivity = useRef(Date.now());
  const isIdle = !faceData.isActive || (Date.now() - lastActivity.current > 2000);
  
  if (isIdle) {
    return {
      blinkChance: calculateNaturalBlink(), // ~15-20 blinks/min
      headSway: perlinNoise2D(time * 0.001, 0) * 0.02,
      breathScale: 1 + Math.sin(time * 0.002) * 0.01
    };
  }
}
```

---

### Feature 2: Enhanced Lip Sync (Visemes)

**Descripción:** Analizar audio del micrófono para detectar fonemas aproximados y mapear a formas de boca correspondientes.

**Por qué diferencia:** El audio reactive actual solo usa volumen. Los visemes permiten lip sync más creíble.

**Esfuerzo estimado:** 25-30h (complejo)

**Simplificación viable:** Usar 5 visemes básicos (A, E, I, O, silencio) detectados por frecuencias, no speech recognition completo.

---

### Feature 3: URL-Based Configuration

**Descripción:** Permitir configurar el avatar completamente via URL:

```
https://streamavatar.app/clean?avatar=cat&color=ff6b35&bg=chroma-green&scale=1.2
```

**Por qué diferencia:** Facilita compartir setups, automatización, integración en workflows.

**Esfuerzo estimado:** 6-8h

---

### Feature 4: Expresiones Preconfiguradas (Hotkeys Web)

**Descripción:** Teclas de acceso rápido para cambiar entre expresiones:
- `1` → Neutral
- `2` → Feliz
- `3` → Sorprendido
- `4` → Enfadado
- etc.

**Por qué diferencia:** VTube Studio tiene esto. VSeeFace tiene esto. Es esperado en el espacio.

**Esfuerzo estimado:** 8-10h

---

## Fase 2: Comunidad (Semanas 9-16)

### Objetivo
Construir presencia y comunidad alrededor del proyecto.

### Acciones

| Acción | Descripción |
|--------|-------------|
| **Lanzamiento GitHub público** | LICENSE ya está. README atractivo. Tags semver. |
| **Post en r/VirtualYoutubers** | Presentar el proyecto, pedir feedback |
| **Demo en Product Hunt** | Una vez features bandera estén pulidas |
| **Discord servidor** | Canal de soporte y comunidad |
| **Video tutorial YouTube** | 5-10 min mostrando setup completo |

### Métricas objetivo
- 100 stars en GitHub
- 50 usuarios activos semanales
- 10 issues/PRs de comunidad

---

## Fase 3: Innovación Avanzada (Semanas 17-30)

### Feature 5: Collaborative Scenes 🚀 MOONSHOT

**Descripción:** Múltiples usuarios conectan sus avatares a una escena compartida para podcasts, entrevistas, o collabs.

**Arquitectura:**
```
User A (browser) ←→ Signaling Server (WebSocket) ←→ User B (browser)
     ↓                                                    ↓
  FaceData                                            FaceData
     ↓                                                    ↓
  Render A + B locally ←──── sync pose data ────→ Render A + B locally
```

**Por qué diferencia:** NADIE tiene esto en web. VSeeFace requiere VMC manual y misma red. Esta sería feature única del mercado.

**Esfuerzo estimado:** 60-80h + servidor WebSocket

**Dependencia:** Requiere hosting mínimo para signaling server (puede ser Cloudflare Workers gratis o Railway).

---

### Feature 6: Avatar Presets Gallery

**Descripción:** Usuarios pueden guardar y compartir configuraciones de avatar:
- Color schemes
- Expresiones custom
- Combinaciones de settings

**Implementación:** JSON exportable/importable. Galería pública opcional (requiere backend).

**Esfuerzo estimado:** 20h (sin backend) / 50h (con galería pública)

---

## Fase 4: Monetización Sostenible (Mes 8+)

Si el proyecto gana tracción, opciones de sostenibilidad:

| Modelo | Descripción | Viabilidad |
|--------|-------------|------------|
| **GitHub Sponsors** | Donaciones de usuarios/empresas | Alta |
| **Premium features** | Algunos avatares o efectos exclusivos | Media |
| **Hosted collaboration** | Servicio de rooms colaborativos | Media-Alta |
| **Consultoría/custom** | Desarrollo a medida para creadores | Baja escala |

**NO recomendado:** Suscripciones para funciones básicas. La comunidad VTuber rechaza esto (ejemplo: backlash a Animaze).

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROADMAP STREAMAVATAR                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FASE 0          FASE 1           FASE 2          FASE 3        │
│  Estabilizar     Diferenciar      Comunidad       Innovar       │
│                                                                  │
│  [████████]      [░░░░░░░░]       [░░░░░░░░]      [░░░░░░░░]    │
│                                                                  │
│  • Fix VRM       • AI Idle        • GitHub        • Collab      │
│  • Quitar RTMP   • Lip Sync       • Discord       • Gallery     │
│  • i18n          • URL Config     • YouTube       • ?           │
│  • Tests         • Hotkeys        • ProductHunt                 │
│  • README                                                        │
│  • OBS Guide                                                     │
│                                                                  │
│  Semana 1-2      Semana 3-8       Semana 9-16    Semana 17+     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Priorización por Impacto/Esfuerzo

| Feature | Impacto | Esfuerzo | Ratio | Prioridad |
|---------|---------|----------|-------|-----------|
| AI Idle Animations | Alto | Medio | ⭐⭐⭐ | #1 |
| URL Config | Medio | Bajo | ⭐⭐⭐ | #2 |
| VRM/GLB Import | Alto | Medio | ⭐⭐ | #3 |
| Hotkeys/Expresiones | Medio | Medio | ⭐⭐ | #4 |
| Lip Sync (Visemes) | Alto | Alto | ⭐ | #5 |
| Collaborative Scenes | Muy Alto | Muy Alto | ⭐ | Moonshot |

---

## Dependencias Externas

| Dependencia | Para | Estado |
|-------------|------|--------|
| MediaPipe | Face tracking | Ya implementado |
| Three.js | Renderizado 3D | Ya implementado |
| @pixiv/three-vrm | Carga VRM | Ya incluido |
| Cloudflare Workers | Signaling server (collab) | Futuro, gratis tier |

---

## Criterios de Éxito

### Mes 3
- [ ] Import VRM/GLB funcional
- [ ] AI Idle implementado
- [ ] 50+ stars GitHub

### Mes 6
- [ ] Todas las features Fase 1 completas
- [ ] Presencia Discord activa
- [ ] Video tutorial con 1K+ views

### Mes 12
- [ ] Collaborative Scenes en beta
- [ ] 500+ stars GitHub
- [ ] Mencionado en al menos 1 video de VTuber conocido

---

*Documento creado: Febrero 2026*  
*Autor: Manuel Ramírez Ballesteros*  
*Versión: 1.0*
