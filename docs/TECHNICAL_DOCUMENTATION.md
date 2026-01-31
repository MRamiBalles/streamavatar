# StreamAvatar - Documentación Técnica

## 1. Visión General del Sistema

**StreamAvatar** es una aplicación web de streaming de avatares 3D con seguimiento facial en tiempo real. Permite a creadores de contenido transmitir como personajes virtuales (VTubers) sin necesidad de software de escritorio pesado.

### 1.1 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   UI Layer      │  State Layer    │      3D Rendering Layer     │
│                 │                 │                             │
│ • Components    │ • Zustand Store │ • Three.js / R3F            │
│ • Tailwind CSS  │ • Persist       │ • @react-three/drei         │
│ • shadcn/ui     │ • Translations  │ • Custom Avatars            │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                    MEDIA PROCESSING LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│ • MediaPipe Face Landmarker (Tracking Facial)                   │
│ • Web Audio API (Análisis de Audio Reactivo)                    │
│ • getUserMedia (Cámara/Micrófono)                               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Stack Tecnológico

### 2.1 Dependencias Principales

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| Framework | React | 18.3.1 | UI declarativa |
| Build Tool | Vite | - | Desarrollo rápido |
| 3D Engine | Three.js | 0.160.1 | Renderizado 3D |
| 3D React | @react-three/fiber | 8.18.0 | Integración React-Three |
| Helpers 3D | @react-three/drei | 9.122.0 | Componentes útiles 3D |
| Face Tracking | MediaPipe | 0.10.32 | Seguimiento facial AI |
| VRM Support | @pixiv/three-vrm | 2.1.3 | Avatares VRM |
| State | Zustand | 4.5.7 | Gestión de estado |
| Styling | Tailwind CSS | - | Estilos utilitarios |
| UI Kit | shadcn/ui | - | Componentes accesibles |
| Router | react-router-dom | 6.30.1 | Navegación SPA |

### 2.2 Estructura del Proyecto

```
src/
├── components/
│   ├── avatars/              # Avatares 3D
│   │   ├── AvatarRenderer.tsx
│   │   ├── PillAvatar.tsx
│   │   ├── BoxyAvatar.tsx
│   │   ├── SphereAvatar.tsx
│   │   ├── CatAvatar.tsx
│   │   ├── GhostAvatar.tsx
│   │   ├── EmojiAvatar.tsx
│   │   └── CustomModelAvatar.tsx
│   ├── studio/               # Paneles de control
│   │   ├── StudioSidebar.tsx
│   │   ├── AvatarSelector.tsx
│   │   ├── AvatarCustomizer.tsx
│   │   ├── CameraControls.tsx
│   │   ├── StreamPanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── AudioReactiveControls.tsx
│   └── ui/                   # Componentes shadcn/ui
├── hooks/
│   ├── useFaceTracker.ts     # Hook de seguimiento facial
│   ├── useAudioReactive.ts   # Hook de audio reactivo
│   └── use-toast.ts          # Notificaciones
├── stores/
│   └── avatarStore.ts        # Estado global + i18n
├── pages/
│   ├── Index.tsx             # Página principal (Studio)
│   ├── CleanView.tsx         # Vista limpia para OBS
│   └── NotFound.tsx          # Página 404
└── lib/
    └── utils.ts              # Utilidades (cn, etc.)
```

## 3. Componentes Principales

### 3.1 Sistema de Face Tracking

**Archivo:** `src/hooks/useFaceTracker.ts`

El sistema utiliza **MediaPipe Face Landmarker** para detectar 478 puntos faciales en tiempo real.

**Flujo de Datos:**
1. `startCamera()` → Solicita permisos de cámara
2. Inicializa `FaceLandmarker` con modelo GPU
3. Loop de `requestAnimationFrame` procesa cada frame
4. Extrae blendshapes: `jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`
5. Extrae rotación de cabeza desde matriz de transformación
6. Actualiza `avatarStore.faceData`

**Blendshapes Utilizados:**
- `jawOpen` → Apertura de boca (0-1)
- `eyeBlinkLeft` → Parpadeo ojo izquierdo (0-1)
- `eyeBlinkRight` → Parpadeo ojo derecho (0-1)
- Matriz 4x4 → Rotación de cabeza (pitch, yaw, roll)

### 3.2 Sistema de Audio Reactivo

**Archivo:** `src/hooks/useAudioReactive.ts`

Utiliza la **Web Audio API** para analizar frecuencias en tiempo real.

**Análisis de Frecuencias:**
```typescript
// Configuración del AnalyserNode
analyser.fftSize = 256;           // 128 bins de frecuencia
analyser.smoothingTimeConstant = 0.8;

// Rangos de frecuencia
bass   = dataArray[0...10%]   → Frecuencias bajas (20-250 Hz)
treble = dataArray[70%...100%] → Frecuencias altas (4kHz-20kHz)
volume = promedio general normalizado
```

**Aplicación en Avatares:**
- `volume` → Escala general del cuerpo
- `bass` → Apertura de boca (sincronizado con voz)
- `treble` → Efectos secundarios (antenas, partículas)

### 3.3 Renderizado de Avatares

**Archivo:** `src/components/avatars/AvatarRenderer.tsx`

Canvas 3D con React Three Fiber:
- **Cámara:** Perspectiva, FOV 50°, posición [0, 0, 4]
- **Iluminación:** Ambient + 2 Directional + 1 Point
- **Controles:** OrbitControls (rotación limitada)
- **Sombras:** ContactShadows para realismo

**Avatares Disponibles:**
| Tipo | Geometría | Características Especiales |
|------|-----------|---------------------------|
| Pill | Capsule | Clásico "cacahuete" |
| Boxy | Box | Antena luminosa reactiva |
| Sphere | Sphere | Blob elástico |
| Cat | Custom | Orejas y cola animadas |
| Ghost | Custom | Flotación suave |
| Emoji | Sphere | Expresiones de cara |
| Custom | GLB/VRM | Modelos importados |

### 3.4 Gestión de Estado

**Archivo:** `src/stores/avatarStore.ts`

Store Zustand con persistencia en localStorage:

```typescript
interface AvatarStore {
  // Avatar
  selectedAvatar: AvatarType;
  avatarColor: string;
  avatarScale: number;
  customModel: CustomModel | null;
  
  // Background
  background: 'dark' | 'chroma-green' | 'chroma-blue' | 'transparent';
  
  // Face Tracking
  faceData: FaceData;
  isCameraActive: boolean;
  isTracking: boolean;
  
  // Audio
  audioData: AudioData;
  audioSensitivity: number;
  audioReactiveEnabled: boolean;
  
  // i18n
  language: 'es' | 'en';
  
  // Streaming
  streamDestinations: StreamDestination[];
  isLive: boolean;
}
```

## 4. Flujos de Usuario

### 4.1 Configuración Inicial
1. Usuario abre la aplicación
2. Selecciona avatar del catálogo o importa modelo VRM/GLB
3. Personaliza color y escala
4. Elige fondo (oscuro/chroma)

### 4.2 Activación de Tracking
1. Click en "Iniciar Cámara"
2. Navegador solicita permiso de cámara
3. MediaPipe inicializa modelo (2-5 segundos)
4. Indicador cambia a "Tracking OK"
5. Avatar responde a movimientos faciales

### 4.3 Configuración de Stream
1. Usuario añade destino RTMP (Twitch, YouTube, etc.)
2. Ingresa Stream Key
3. Activa destino con toggle
4. Click "GO LIVE" para iniciar

### 4.4 Vista para OBS
1. Usuario copia link de "Vista Limpia"
2. En OBS: Añadir > Browser Source
3. Pegar URL, configurar resolución
4. Avatar aparece sin UI, listo para overlay

## 5. APIs del Navegador Utilizadas

| API | Uso | Permisos |
|-----|-----|----------|
| `getUserMedia` | Acceso a cámara/micrófono | Camera, Microphone |
| `AudioContext` | Análisis de audio | Autoplay policy |
| `AnalyserNode` | FFT de frecuencias | - |
| `requestAnimationFrame` | Loop de renderizado | - |
| `localStorage` | Persistencia de config | - |
| `Clipboard API` | Copiar links | - |

## 6. Consideraciones de Rendimiento

### 6.1 Optimizaciones Implementadas
- Face tracking a 30 FPS (suficiente para streaming)
- Audio FFT size 256 (balance precisión/rendimiento)
- Geometrías simples para avatares built-in
- Lazy loading de MediaPipe
- Suspense boundaries en Canvas

### 6.2 Requisitos Mínimos
- **CPU:** Intel i5 / AMD Ryzen 5 (quad-core)
- **GPU:** Integrada con WebGL 2.0
- **RAM:** 4 GB
- **Navegador:** Chrome 90+, Firefox 90+, Safari 15+
- **Conexión:** 5 Mbps para streaming HD

## 7. Seguridad

### 7.1 Datos Sensibles
- **Stream Keys:** Almacenadas en localStorage (no exportadas)
- **Cámara:** Solo procesamiento local, sin envío a servidores
- **Audio:** Análisis local, sin grabación
- **Modelos:** Cargados como blob URLs, sin persistencia

### 7.2 Políticas de Permisos
- Cámara: Solicitada explícitamente al activar tracking
- Micrófono: Solicitado al activar audio reactivo
- Sin acceso a geolocalización ni notificaciones

## 8. Extensibilidad

### 8.1 Añadir Nuevo Avatar
1. Crear componente en `src/components/avatars/`
2. Usar hook `useAvatarStore` para `faceData` y `audioData`
3. Añadir tipo a `AvatarType` en store
4. Registrar en `AvatarModel` switch
5. Añadir opción en `AvatarSelector`

### 8.2 Añadir Nuevo Idioma
1. Añadir tipo a `Language` en store
2. Añadir objeto de traducciones en `translations`
3. Añadir opción en `SettingsPanel`

## 9. Testing

### 9.1 Tests Unitarios
```bash
npm run test
```

### 9.2 Testing Manual Recomendado
- [ ] Face tracking responde a movimientos
- [ ] Audio reactivo visualiza volumen
- [ ] Cambio de avatares funciona
- [ ] Importación VRM/GLB carga correctamente
- [ ] Vista limpia muestra solo avatar
- [ ] Cambio de idioma traduce toda la UI
- [ ] Export/Import de configuración funciona
