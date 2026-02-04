# StreamAvatar

**Avatares virtuales 3D en el navegador. Sin instalación. Open source.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)

---

# StreamAvatar: Real-Time Hybrid Neural Avatar System for Web-Native Virtual Production

**StreamAvatar** es un motor de avatares de alto rendimiento diseñado para la nueva era de la producción virtual. Implementa una arquitectura bimodal (Audio + Visual) que permite animar personajes 3D de grado profesional directamente en el navegador, con latencia mínima y procesamiento 100% local (*Privacy-First*).

---

## 🚀 Key Technical Features

### 1. Hybrid Neural Rendering (3DGS)
Basado en los últimos avances en **Gaussian Splatting (3DGS)**, StreamAvatar permite insertar avatares tradicionales en entornos fotorrealistas capturados del mundo real.
- *Referencia:* Arquitectura inspirada en **TaoAvatar (2025)** y **UniMGS**.

### 2. Standardized VRM Character Pipeline
Soporte completo para el estándar **VRM** (0.0/1.0).
- **SpringBone Physics**: Movimiento natural de pelo y ropa.
- **Humanoid Retargeting**: Mapeo instantáneo desde MediaPipe ARKit a visemas VRM.

### 3. Audio2Face: Phonetic Lip-Sync
A diferencia de los sistemas basados en volumen, StreamAvatar utiliza un **Analizador de Formantes** para descomponer la voz en visemas fonéticos (A, I, U, E, O).
- *Referencia:* Técnica alineada con **Audio2Face-3D** para máxima expresividad.

### 4. Enterprise-Grade Performance & Privacy
- **SharedArrayBuffer Support**: Inferencia multihilo para un rastreo fluido a >60 FPS.
- **IndexedDB Persistent Storage**: Gestión de activos de gran tamaño con política LRU.
- **Zero-Cloud Architecture**: Ningún dato de imagen o audio sale del navegador del usuario.

## 🛠️ Tech Stack & Scientific Core
- **Engine:** Three.js / React Three Fiber.
- **Tracking:** MediaPipe Face Landmarker.
- **Physics:** @pixiv/three-vrm (MKK Physics).
- **Research Foundations:** SMPL-X Topology, SDS (Score Distillation Sampling), Hybrid Mesh-Neural Rasterization.

## 📈 Deployment
```bash
npm install
npm run dev
```

---
*Proyecto desarrollado bajo los estándares de soberanía digital y excelencia técnica para entornos audiovisuales.*

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
