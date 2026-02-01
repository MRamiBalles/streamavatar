# StreamAvatar — Decisiones de Integración con Software de Streaming

## Contexto del Problema

StreamAvatar necesita definir cómo los usuarios transmitirán su avatar a plataformas como Twitch, YouTube o TikTok. Hay dos enfoques fundamentales:

1. **Integración nativa RTMP** — El navegador envía directamente el stream
2. **Integración vía OBS/captura** — El usuario captura StreamAvatar en OBS

Esta documentación evalúa ambas opciones y justifica la decisión técnica tomada.

---

## Análisis de Opciones

### Opción A: Streaming RTMP Nativo desde Navegador

**Descripción:** Implementar un cliente RTMP directamente en JavaScript que transmita el canvas WebGL codificado como video.

| Aspecto | Evaluación |
|---------|------------|
| Viabilidad técnica | Problemática. WebRTC es posible, pero RTMP puro desde navegador requiere proxies CORS o WebSocket-to-RTMP bridges |
| Latencia | Alta sin servidor intermediario |
| Codificación | Limitada a lo que el navegador soporte (básicamente H.264 via MediaRecorder) |
| Multi-destino | Requiere enviar N streams simultáneos, impacto severo en CPU/bandwidth del usuario |
| Dependencias | Necesitaría backend para relay (Nginx-RTMP, Owncast, o servicio cloud) |
| Coste operativo | Significativo si se pretende ofrecer relay como servicio |

**Veredicto:** No viable para un desarrollador individual sin presupuesto de infraestructura. Los servicios web que lo ofrecen (Restream, Castr) tienen equipos de ingeniería dedicados y costes de servidor considerables.

---

### Opción B: Integración via OBS Browser Source

**Descripción:** El usuario abre StreamAvatar en una ventana o pestaña, y lo captura con OBS Studio usando Browser Source o Window Capture. OBS maneja el encoding y streaming.

| Aspecto | Evaluación |
|---------|------------|
| Viabilidad técnica | Excelente. Es el estándar de la industria VTubing |
| Latencia | Mínima (captura local) |
| Codificación | NVENC, x264, HEVC — lo que OBS soporte |
| Multi-destino | Via plugins gratuitos de OBS (Aitum Multistream, obs-multi-rtmp) |
| Dependencias | Ninguna en nuestro lado; OBS es gratuito y ubicuo |
| Coste operativo | Cero para nosotros |

**Veredicto:** Enfoque correcto para un proyecto sin presupuesto. Es exactamente como funcionan VSeeFace, VNyan, Warudo y la mayoría de software VTuber.

---

## Decisión Técnica Adoptada

**StreamAvatar adopta la integración via OBS** como método principal de streaming.

### Justificación

1. **Consistencia con la industria** — Ningún software VTuber serio implementa RTMP nativo desde navegador. Todos asumen que el usuario tiene OBS o similar.

2. **Cero overhead de infraestructura** — No necesitamos servidores, no incurrimos en costes de bandwidth, no hay puntos de fallo externos.

3. **Flexibilidad para el usuario** — OBS permite configurar bitrate, encoder, escenas, overlays, alertas... cosas que nunca podríamos replicar.

4. **Multi-streaming real** — Con el plugin gratuito `obs-multi-rtmp` o Aitum Multistream, el usuario puede transmitir a múltiples plataformas sin coste adicional.

---

## Implementación Recomendada

### Para StreamAvatar

1. **Vista "Clean" dedicada** — URL sin interfaz (`/clean`) que muestra solo el avatar sobre fondo transparente/chroma.

2. **Fondos chroma key** — Verde (`#00FF00`) y azul (`#0000FF`) puros para filtrado en OBS.

3. **Documentación de setup** — Tutoriales claros de cómo añadir StreamAvatar a OBS.

4. **Parámetros de URL** — Permitir configurar avatar, color y background via query params para automatización.

### Para el Usuario (flujo recomendado)

```
1. Abre StreamAvatar en Chrome/Firefox
2. Configura tu avatar y activa face tracking
3. En OBS: Fuentes → Añadir → Navegador
4. URL: https://streamavatar.app/clean?bg=chroma-green
5. Dimensiones: 1920x1080 (o según tu setup)
6. Aplica filtro Chroma Key al source si usas transparencia
7. Posiciona el avatar en tu escena
8. Transmite normalmente con OBS
```

---

## Comparativa de Software de Captura

Para usuarios que no conozcan OBS, ofrecemos alternativas:

| Software | Tipo | Multi-stream | Precio | Curva de aprendizaje |
|----------|------|--------------|--------|---------------------|
| **OBS Studio** | Desktop, open source | Via plugins (gratis) | Gratis | Media |
| **Streamlabs** | Desktop | Con suscripción Ultra | Freemium | Baja |
| **Prism Live** | Desktop + móvil | Nativo | Gratis | Baja |
| **Lightstream** | Cloud/browser | Nativo | Freemium | Muy baja |
| **StreamYard** | Cloud/browser | Nativo | Freemium | Muy baja |

**Recomendación principal:** OBS Studio con plugins gratuitos. Es el estándar, tiene mejor documentación, y la comunidad VTuber lo usa masivamente.

---

## Plugins de OBS Relevantes

| Plugin | Función | URL |
|--------|---------|-----|
| **obs-multi-rtmp** | Stream a múltiples destinos RTMP | github.com/sorayuki/obs-multi-rtmp |
| **Aitum Multistream** | Multi-stream con UI amigable | aitum.tv |
| **SE.Live** | Multi-stream via StreamElements | streamelements.com |
| **Spout2** | Captura de apps con soporte de alpha | spout.zeal.co |

---

## Implicaciones para Documentación de Marketing

El claim original de "multi-streaming nativo" debe reformularse:

| Antes (misleading) | Después (honesto) |
|--------------------|-------------------|
| "Multi-stream nativo" | "Compatible con multi-streaming via OBS" |
| "Transmite a múltiples plataformas" | "Vista limpia para capturar en OBS y transmitir a cualquier plataforma" |
| "Sin configuración adicional" | "Configuración de 5 minutos con OBS" |

---

## Funcionalidad Futura (Si Hay Presupuesto)

Si en el futuro se desea ofrecer streaming nativo, las opciones serían:

1. **WebRTC to RTMP relay** — Servicio tipo Janus o Millicast. Coste: €100-500/mes dependiendo de uso.

2. **Integración con Restream API** — El usuario conecta su cuenta Restream. Restream maneja el multi-destino.

3. **OBS WebSocket API** — Controlar OBS remotamente desde StreamAvatar para iniciar/detener stream.

Ninguna de estas es prioritaria ahora mismo dado el estado del proyecto.

---

## Conclusión

La decisión de delegar el streaming a OBS es correcta, pragmática y alineada con cómo funciona el resto del ecosistema VTuber. Documenta bien cómo usar StreamAvatar con OBS y el proyecto estará a la par con competidores establecidos en este aspecto.

---

*Documento creado: Febrero 2026*  
*Autor: Manuel Ramírez Ballestas*
