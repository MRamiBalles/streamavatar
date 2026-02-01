# StreamAvatar

**Avatares virtuales 3D en el navegador. Sin instalación. Open source.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)

---

## ¿Qué es StreamAvatar?

StreamAvatar te permite crear y animar un avatar 3D directamente en tu navegador, usando solo tu webcam. Ideal para streamers, creadores de contenido, educadores o cualquiera que quiera aparecer online sin mostrar su rostro.

### Características

- 🎭 **6 avatares prediseñados** — Pill, Boxy, Sphere, Cat, Ghost, Emoji
- 📷 **Face tracking en tiempo real** — Via MediaPipe, procesado 100% localmente
- 🎤 **Audio reactive** — El avatar responde a tu voz
- 🎨 **Personalización** — Colores, escala, fondos chroma key
- 🌐 **100% Web** — Funciona en Chrome, Firefox, Safari, Edge
- 🔒 **Privacidad** — Ningún dato sale de tu navegador

---

## Demo Rápida

```
1. Abre https://streamavatar.app
2. Permite acceso a cámara
3. ¡Tu avatar cobra vida!
```

---

## Uso con OBS Studio

StreamAvatar está diseñado para integrarse con OBS u otro software de streaming:

1. **En StreamAvatar:** Copia el link de "Vista Limpia"
2. **En OBS:** Añadir fuente → Navegador
3. **URL:** Pega el link copiado
4. **Dimensiones:** 1920x1080 (o según tu setup)
5. **Fondo:** Usa chroma green y aplica filtro Chroma Key en OBS

Para multi-streaming, usa plugins gratuitos como [obs-multi-rtmp](https://github.com/sorayuki/obs-multi-rtmp) o [Aitum Multistream](https://aitum.tv/).

---

## Desarrollo Local

### Requisitos

- Node.js 18+
- npm o bun

### Instalación

```bash
git clone https://github.com/MRamiBalles/streamavatar.git
cd streamavatar
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Build

```bash
npm run build
npm run preview
```

---

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **React 18** | UI y gestión de componentes |
| **Vite** | Build tool y dev server |
| **Three.js / R3F** | Renderizado 3D |
| **MediaPipe** | Detección facial AI |
| **Zustand** | Estado global |
| **Tailwind CSS** | Estilos |
| **shadcn/ui** | Componentes UI accesibles |

---

## Roadmap

Ver [docs/ROADMAP.md](docs/ROADMAP.md) para el plan de desarrollo completo.

### Próximamente

- [ ] Import de modelos VRM/GLB custom
- [ ] Animaciones idle con IA
- [ ] Sistema de expresiones (hotkeys)
- [ ] Configuración via URL
- [ ] Escenas colaborativas multi-usuario

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
