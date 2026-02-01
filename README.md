# StreamAvatar

**Avatares virtuales 3D en el navegador. Sin instalación. Open source.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)

---

## ¿Qué es StreamAvatar?

StreamAvatar te permite crear y animar un avatar 3D directamente en tu navegador, usando solo tu webcam. Ideal para streamers, creadores de contenido, educadores o cualquiera que quiera aparecer online sin mostrar su rostro.

### Características Principales

- 🎭 **Soporte VRM Profesional** — Compatibilidad total con modelos `.vrm` (v0/v1).
- 🦴 **Spring Bones & Physics** — Física en tiempo real para pelo, ropa y accesorios.
- 🎤 **Audio2Face (Visemas Phonetic)** — Sincronización labial avanzada basada en análisis de formantes FFT (A/E/I/O/U).
- 📷 **Tracking Facial Dual** — MediaPipe ARKit blendshapes con respaldo fonético.
- 🔒 **Privacy Shield** — Procesamiento 100% local con Modo Ofuscación para descarte inmediato de datos biométricos.
- 🌐 **Clean View (OBS)** — URL configurable para integración directa en OBS con deep-linking.

---

## Roadmap v2.0+

### Fase Actual: Innovación & Realismo (Q1 2026)

- [x] Soporte VRM Avanzado (Spring Bones)
- [x] Motor Lip-Sync fonético (Audio2Face)
- [x] Privacy Shield & Obfuscation Mode
- [x] Normalización automática de modelos
- [ ] Renderizado experimental via **3D Gaussian Splatting** (ver `3DGS_ANALYSIS.md`)
- [ ] Generación de avatares desde texto/imagen (Stable Diffusion SDS)
- [ ] Integración de DreamBooth para personalización zero-shot


---

## Comparativa

| Feature | StreamAvatar | VSeeFace | VTube Studio | Kalidoface |
|---------|--------------|----------|--------------|------------|
| Web-based | ✅ | ❌ | ❌ | ✅ |
| 3D Avatars | ✅ | ✅ | ❌ | ✅ |
| Sin instalación | ✅ | ❌ | ❌ | ✅ |
| Open source | ✅ | Parcial | ❌ | ❌ |
| Precio | Gratis | Gratis | $25 | Gratis |

---

## Documentación

- [Decisiones de Integración](docs/INTEGRATION_DECISION.md)
- [Análisis de Mercado](docs/MARKET_ANALYSIS.md)
- [Análisis de Competidores](docs/COMPETITOR_ANALYSIS.md)
- [Documentación Técnica](docs/TECHNICAL_DOCUMENTATION.md)
- [Innovación y Oportunidades](docs/INNOVATION_ANALYSIS.md)

---

## Contribuir

¡Las contribuciones son bienvenidas! 

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Añade nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

## Licencia

[MIT](LICENSE) © 2026 Manuel Ramírez Ballesteros

---

## Contacto

- **GitHub:** [@MRamiBalles](https://github.com/MRamiBalles)
- **Issues:** [github.com/MRamiBalles/streamavatar/issues](https://github.com/MRamiBalles/streamavatar/issues)
