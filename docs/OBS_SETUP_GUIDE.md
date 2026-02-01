# Guía: Usar StreamAvatar con OBS Studio

## Introducción

Esta guía explica cómo integrar StreamAvatar en OBS Studio para transmitir tu avatar virtual a Twitch, YouTube, TikTok u otras plataformas.

**Tiempo estimado:** 5-10 minutos

---

## Requisitos

- **OBS Studio** 29.0 o superior ([descargar](https://obsproject.com/))
- **Navegador moderno** (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- **Webcam** para face tracking
- **StreamAvatar** abierto en una pestaña

---

## Paso 1: Prepara StreamAvatar

1. Abre [StreamAvatar](https://streamavatar.app) en tu navegador
2. Selecciona y personaliza tu avatar
3. Activa la cámara para face tracking
4. Selecciona fondo **"Chroma Green"** o **"Chroma Blue"**
5. Copia el link de **"Vista Limpia"** (botón en la barra lateral)

El link será algo como:
```
https://streamavatar.app/clean
```

---

## Paso 2: Añade StreamAvatar a OBS

### Método A: Browser Source (Recomendado)

1. En OBS, haz clic en **"+"** en el panel de Fuentes
2. Selecciona **"Navegador"** (Browser)
3. Nombre: `StreamAvatar`
4. Configura:
   - **URL:** Pega el link de Vista Limpia
   - **Ancho:** 1920
   - **Alto:** 1080
   - **FPS:** 60 (o 30 si tu PC es limitado)
5. Haz clic en **OK**

### Método B: Window Capture

Si el Browser Source tiene problemas:

1. En OBS, **"+"** → **"Captura de Ventana"**
2. Selecciona la ventana del navegador donde está StreamAvatar
3. Recorta manualmente para mostrar solo el canvas

---

## Paso 3: Configura el Chroma Key

Para hacer el fondo transparente:

1. Clic derecho en la fuente "StreamAvatar"
2. **Filtros**
3. **"+"** → **"Clave cromática"** (Chroma Key)
4. Configura:
   - **Tipo de color clave:** Verde o Azul (según tu fondo)
   - **Similitud:** 400-600 (ajusta hasta que el fondo desaparezca)
   - **Suavidad:** 20-80 (para bordes menos duros)
5. **Cerrar**

**Tip:** Si hay "halo" verde alrededor del avatar, sube la Similitud. Si el avatar se vuelve transparente, bájala.

---

## Paso 4: Posiciona tu Avatar

1. Arrastra la fuente en el preview para posicionarla
2. Usa las esquinas para redimensionar
3. Típicamente, el avatar va en esquina inferior izquierda o derecha
4. Asegúrate de que esté por encima de tu gameplay/cámara en el orden de capas

### Orden de capas sugerido (de arriba a abajo)
```
- Alertas/Overlays
- StreamAvatar
- Webcam (si la usas)
- Captura de juego / Pantalla
```

---

## Paso 5: Configuración de Audio (Opcional)

Si usas el Audio Reactive de StreamAvatar:

1. Asegúrate de que tu micrófono esté activo en StreamAvatar
2. No necesitas configurar nada adicional en OBS — el audio del mic ya va por separado

---

## Multi-Streaming

Para transmitir a múltiples plataformas simultáneamente:

### Opción 1: Plugin obs-multi-rtmp (Gratis)

1. Descarga desde [github.com/sorayuki/obs-multi-rtmp](https://github.com/sorayuki/obs-multi-rtmp)
2. Instala siguiendo instrucciones del repo
3. En OBS: **Dock** → **Multi RTMP**
4. Añade cada destino (Twitch, YouTube, etc.) con su URL y Stream Key
5. Inicia cada stream individualmente

### Opción 2: Aitum Multistream

1. Instala desde [aitum.tv](https://aitum.tv/)
2. Configuración más visual y amigable
3. Soporta también streaming vertical (TikTok, Shorts)

### Opción 3: Servicios Cloud (Restream, Castr)

1. Transmite a Restream/Castr como único destino
2. Ellos redistribuyen a múltiples plataformas
3. Ventaja: Menos carga en tu PC
4. Desventaja: Requiere cuenta (freemium)

---

## Solución de Problemas

### El Browser Source muestra pantalla negra

- Verifica que la URL sea correcta
- Prueba con "Refrescar caché de la página actual" (clic derecho en la fuente)
- Actualiza OBS a la última versión
- Algunos antivirus bloquean el Browser Source — añade excepción

### El chroma key no funciona bien

- Asegúrate de usar exactamente #00FF00 (verde) o #0000FF (azul)
- Revisa que no haya reflejos de luz verde/azul en la escena
- Aumenta la iluminación de tu habitación

### El tracking no funciona en Browser Source

- El Browser Source de OBS tiene acceso limitado a cámara
- **Solución:** Usa StreamAvatar en una pestaña aparte (con tracking activo) y captura esa ventana

### Lag o bajo FPS

- Reduce la resolución del Browser Source (ej: 1280x720)
- Reduce FPS a 30
- Cierra otras pestañas del navegador

---

## Configuraciones Recomendadas

### Para PC Potente (RTX 3060+, Ryzen 5+)
```
Browser Source: 1920x1080 @ 60fps
OBS Output: 1080p60, NVENC
Bitrate: 6000 kbps
```

### Para PC Medio (GTX 1060, i5)
```
Browser Source: 1280x720 @ 30fps
OBS Output: 720p30, x264 fast
Bitrate: 4500 kbps
```

### Para PC Limitado
```
Browser Source: 854x480 @ 30fps
OBS Output: 480p30, x264 veryfast
Bitrate: 2500 kbps
```

---

## Alternativas a OBS

| Software | Notas |
|----------|-------|
| **Streamlabs** | Basado en OBS, más fácil pero más pesado |
| **Prism Live** | Ligero, buen multi-stream nativo |
| **XSplit** | Comercial, muy pulido |
| **Lightstream** | Cloud-based, cero instalación |

Todos funcionan con el mismo principio: capturar StreamAvatar como fuente de navegador o ventana.

---

## Preguntas Frecuentes

**¿Necesito tener StreamAvatar abierto para que funcione?**
Sí. El Browser Source de OBS renderiza la página, pero si cierras la pestaña donde activaste el tracking, el tracking se detiene.

**¿Puedo usar StreamAvatar sin OBS?**
Para streaming, no realmente. StreamAvatar genera el avatar; OBS (u otro software) lo transmite.

**¿Funciona en Mac?**
Sí. OBS está disponible para Mac y el Browser Source funciona igual.

**¿Puedo usar múltiples avatares?**
No actualmente. Es una feature en el roadmap (Collaborative Scenes).

---

*Última actualización: Febrero 2026*
