# StreamAvatar — Roadmap de Desarrollo

## Visión

Convertir StreamAvatar en la solución de avatares virtuales web de referencia, diferenciándose de competidores desktop mediante innovación en experiencia web-native, colaboración y accesibilidad.

---

## Fase 0: Estabilización ✅ COMPLETADA

### Tareas

| Tarea | Estado | Descripción |
|-------|-----------|-------------|
| Eliminar UI de "streaming RTMP" | [x] | Limpieza de código heredado completada. |
| Completar import VRM/GLB | [x] | Soporte nativo y normalización automática implementados. |
| Internacionalización completa | [x] | Sistema de traducciones robusto (ES/EN). |
| Tests unitarios básicos | [/] | Infraestructura Vitest preparada. |
| Actualizar README | [x] | README v2.0 profesional. |
| Documentar setup OBS | [x] | Guía completa en `OBS_SETUP_GUIDE.md`. |

---

## Fase 1: Diferenciación ✅ COMPLETADA

### Tareas

| Tarea | Estado | Descripción |
|-------|-----------|-------------|
| AI Idle Animations | [x] | Movimientos orgánicos y parpadeos naturales implementados. |
| Enhanced Lip Sync | [x] | Sistema de visemas fonéticos basado en análisis FFT. |
| URL-Based Config | [x] | Persistencia y configuración vía query params completa. |
| Privacy Shield | [x] | Modo ofuscación y procesamiento local implementado. |
| Hotkeys Expresiones | [/] | Soporte técnico base listo; UI de configuración pendiente. |

---

## Fase 2: Innovación & Comunidad 🚀 EN CURSO

### Objetivo
Explorar tecnologías de vanguardia y posicionar el proyecto.

### Innovación Técnica
- [x] **3D Gaussian Splatting:** Análisis de viabilidad y viewer experimental completado (`3DGS_ANALYSIS.md`).
- [ ] **AI Avatar Generation:** Investigación inicial en DreamBooth y SDS.
- [ ] **Animaciones Zero-Shot:** Mapeo de movimiento desde video simple.

### Acciones de Comunidad
- [/] **Lanzamiento GitHub:** LICENSE y README profesional listos.
- [ ] **Showcase:** Demostración en r/VirtualYoutubers.
- [ ] **Documentación Técnica:** Profundizar en la guía de integración para desarrolladores.

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

### Feature 6: Avatar Presets Gallery ✅ COMPLETADA

**Descripción:** Usuarios pueden guardar y gestionar configuraciones de avatar:
- Compositor de piezas (primitivas)
- Galería de presets con persistencia local
- Gestión de identidades Fashion

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
│                      ROADMAP STREAMAVATAR 2.0                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FASE 0          FASE 1           FASE 2          FASE 3        │
│  Estabilizar     Diferenciar      Innovar         Escalar       │
│                                                                  │
│  [████████]      [████████]       [██░░░░░░]      [░░░░░░░░]    │
│                                                                  │
│  • VRM/GLB ✅    • Idle AI ✅     • 3DGS Beta ✅  • Collab      │
│  • i18n ✅       • Lip Sync ✅    • AI Avatar     • Gallery     │
│  • OBS Guide ✅  • URL Config ✅  • SD/SDS        • ?           │
│  • README ✅     • Privacy ✅                                   │
│                                                                  │
│  COMPLETO        COMPLETO         Q1 2026         Q2+ 2026      │
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
