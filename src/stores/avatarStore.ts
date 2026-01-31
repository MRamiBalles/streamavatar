import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AvatarType = 'pill' | 'boxy' | 'sphere' | 'cat' | 'ghost' | 'emoji' | 'custom';
export type BackgroundType = 'dark' | 'chroma-green' | 'chroma-blue' | 'transparent';
export type Language = 'es' | 'en';

interface FaceData {
  headRotation: { x: number; y: number; z: number };
  mouthOpen: number;
  leftEyeBlink: number;
  rightEyeBlink: number;
}

interface AudioData {
  volume: number;
  bass: number;
  treble: number;
}

interface StreamDestination {
  id: string;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  enabled: boolean;
}

interface CustomModel {
  url: string;
  name: string;
  type: 'glb' | 'vrm';
}

interface AvatarStore {
  // Avatar settings
  selectedAvatar: AvatarType;
  avatarColor: string;
  avatarScale: number;
  customModel: CustomModel | null;
  
  // Background
  background: BackgroundType;
  
  // Face tracking
  faceData: FaceData;
  isCameraActive: boolean;
  isTracking: boolean;
  
  // Audio reactive
  audioData: AudioData;
  audioSensitivity: number;
  audioReactiveEnabled: boolean;
  
  // Language
  language: Language;
  
  // Stream destinations
  streamDestinations: StreamDestination[];
  isLive: boolean;
  
  // Actions
  setSelectedAvatar: (avatar: AvatarType) => void;
  setAvatarColor: (color: string) => void;
  setAvatarScale: (scale: number) => void;
  setBackground: (bg: BackgroundType) => void;
  setFaceData: (data: FaceData) => void;
  setCameraActive: (active: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setCustomModel: (model: CustomModel | null) => void;
  setAudioData: (data: AudioData) => void;
  setAudioSensitivity: (sensitivity: number) => void;
  setAudioReactiveEnabled: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  addStreamDestination: (dest: Omit<StreamDestination, 'id'>) => void;
  removeStreamDestination: (id: string) => void;
  toggleStreamDestination: (id: string) => void;
  updateStreamDestination: (id: string, updates: Partial<StreamDestination>) => void;
  setLive: (live: boolean) => void;
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  resetToDefaults: () => void;
}

const defaultState = {
  selectedAvatar: 'pill' as AvatarType,
  avatarColor: '#c97d3d',
  avatarScale: 1,
  customModel: null,
  background: 'dark' as BackgroundType,
  faceData: {
    headRotation: { x: 0, y: 0, z: 0 },
    mouthOpen: 0,
    leftEyeBlink: 0,
    rightEyeBlink: 0,
  },
  isCameraActive: false,
  isTracking: false,
  audioData: { volume: 0, bass: 0, treble: 0 },
  audioSensitivity: 1.5,
  audioReactiveEnabled: false,
  language: 'es' as Language,
  streamDestinations: [
    { id: '1', name: 'Twitch', rtmpUrl: 'rtmp://live.twitch.tv/live', streamKey: '', enabled: false },
    { id: '2', name: 'YouTube', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', streamKey: '', enabled: false },
  ],
  isLive: false,
};

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Actions
      setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
      setAvatarColor: (color) => set({ avatarColor: color }),
      setAvatarScale: (scale) => set({ avatarScale: scale }),
      setBackground: (bg) => set({ background: bg }),
      setFaceData: (data) => set({ faceData: data }),
      setCameraActive: (active) => set({ isCameraActive: active }),
      setTracking: (tracking) => set({ isTracking: tracking }),
      setCustomModel: (model) => set({ customModel: model, selectedAvatar: model ? 'custom' : 'pill' }),
      setAudioData: (data) => set({ audioData: data }),
      setAudioSensitivity: (sensitivity) => set({ audioSensitivity: sensitivity }),
      setAudioReactiveEnabled: (enabled) => set({ audioReactiveEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      addStreamDestination: (dest) => set((state) => ({
        streamDestinations: [...state.streamDestinations, { ...dest, id: crypto.randomUUID() }],
      })),
      removeStreamDestination: (id) => set((state) => ({
        streamDestinations: state.streamDestinations.filter((d) => d.id !== id),
      })),
      toggleStreamDestination: (id) => set((state) => ({
        streamDestinations: state.streamDestinations.map((d) =>
          d.id === id ? { ...d, enabled: !d.enabled } : d
        ),
      })),
      updateStreamDestination: (id, updates) => set((state) => ({
        streamDestinations: state.streamDestinations.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      })),
      setLive: (live) => set({ isLive: live }),
      
      exportConfig: () => {
        const state = get();
        const exportData = {
          selectedAvatar: state.selectedAvatar,
          avatarColor: state.avatarColor,
          avatarScale: state.avatarScale,
          background: state.background,
          audioSensitivity: state.audioSensitivity,
          language: state.language,
          streamDestinations: state.streamDestinations.map(d => ({
            name: d.name,
            rtmpUrl: d.rtmpUrl,
            enabled: d.enabled,
            // Exclude streamKey for security
          })),
        };
        return JSON.stringify(exportData, null, 2);
      },
      
      importConfig: (configString) => {
        try {
          const config = JSON.parse(configString);
          set({
            selectedAvatar: config.selectedAvatar || 'pill',
            avatarColor: config.avatarColor || '#c97d3d',
            avatarScale: config.avatarScale || 1,
            background: config.background || 'dark',
            audioSensitivity: config.audioSensitivity || 1.5,
            language: config.language || 'es',
          });
          return true;
        } catch {
          return false;
        }
      },
      
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'streamavatar-config',
      partialize: (state) => ({
        selectedAvatar: state.selectedAvatar,
        avatarColor: state.avatarColor,
        avatarScale: state.avatarScale,
        background: state.background,
        audioSensitivity: state.audioSensitivity,
        language: state.language,
        streamDestinations: state.streamDestinations,
      }),
    }
  )
);

// Translations
export const translations = {
  es: {
    studio: 'Studio',
    avatar: 'Avatar',
    stream: 'Stream',
    settings: 'Ajustes',
    controlPanel: 'Panel de Control',
    configureAvatar: 'Configurar Avatar',
    streamDestinations: 'Destinos de Stream',
    startCamera: 'Iniciar Cámara',
    stopCamera: 'Detener Cámara',
    starting: 'Iniciando...',
    cameraActive: 'Cámara Activa',
    cameraInactive: 'Cámara Inactiva',
    trackingOk: 'Tracking OK',
    noFace: 'Sin Rostro',
    shareScreen: 'Compartir Pantalla (Próximamente)',
    selectAvatar: 'Seleccionar Avatar',
    importModel: 'Importar .VRM / .GLB',
    customModel: 'Modelo 3D personalizado',
    removeCustomModel: 'Eliminar modelo personalizado',
    color: 'Color',
    scale: 'Escala',
    background: 'Fondo',
    dark: 'Oscuro',
    green: 'Verde',
    blue: 'Azul',
    transparent: 'Trans',
    goLive: 'GO LIVE',
    stopStream: 'DETENER STREAM',
    cleanView: 'Vista Limpia (OBS)',
    addAsBrowserSource: 'Añadir como Browser Source',
    copyLink: 'Copiar Link',
    destinations: 'Destinos',
    add: 'Añadir',
    configured: 'Configurado',
    noStreamKey: 'Sin Stream Key',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    audioReactive: 'Reacción al Audio',
    enableAudioReactive: 'Activar reacción al audio',
    sensitivity: 'Sensibilidad',
    startListening: 'Activar Micrófono',
    stopListening: 'Desactivar Micrófono',
    listening: 'Escuchando',
    language: 'Idioma',
    exportConfig: 'Exportar Configuración',
    importConfig: 'Importar Configuración',
    resetDefaults: 'Restablecer Valores',
    exportSuccess: '¡Configuración exportada!',
    importSuccess: '¡Configuración importada!',
    importError: 'Error al importar configuración',
    resetSuccess: 'Valores restablecidos',
    comingSoon: 'Próximamente más opciones',
    dragToRotate: 'Arrastra para rotar',
    preview: 'Vista previa',
    peanut: 'Cacahuete',
    robot: 'Robot',
    slime: 'Slime',
    cat: 'Gato',
    ghost: 'Fantasma',
    emoji: 'Emoji',
  },
  en: {
    studio: 'Studio',
    avatar: 'Avatar',
    stream: 'Stream',
    settings: 'Settings',
    controlPanel: 'Control Panel',
    configureAvatar: 'Configure Avatar',
    streamDestinations: 'Stream Destinations',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    starting: 'Starting...',
    cameraActive: 'Camera Active',
    cameraInactive: 'Camera Inactive',
    trackingOk: 'Tracking OK',
    noFace: 'No Face',
    shareScreen: 'Share Screen (Coming Soon)',
    selectAvatar: 'Select Avatar',
    importModel: 'Import .VRM / .GLB',
    customModel: 'Custom 3D model',
    removeCustomModel: 'Remove custom model',
    color: 'Color',
    scale: 'Scale',
    background: 'Background',
    dark: 'Dark',
    green: 'Green',
    blue: 'Blue',
    transparent: 'Trans',
    goLive: 'GO LIVE',
    stopStream: 'STOP STREAM',
    cleanView: 'Clean View (OBS)',
    addAsBrowserSource: 'Add as Browser Source',
    copyLink: 'Copy Link',
    destinations: 'Destinations',
    add: 'Add',
    configured: 'Configured',
    noStreamKey: 'No Stream Key',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    audioReactive: 'Audio Reactive',
    enableAudioReactive: 'Enable audio reactive',
    sensitivity: 'Sensitivity',
    startListening: 'Start Microphone',
    stopListening: 'Stop Microphone',
    listening: 'Listening',
    language: 'Language',
    exportConfig: 'Export Configuration',
    importConfig: 'Import Configuration',
    resetDefaults: 'Reset to Defaults',
    exportSuccess: 'Configuration exported!',
    importSuccess: 'Configuration imported!',
    importError: 'Error importing configuration',
    resetSuccess: 'Values reset',
    comingSoon: 'More options coming soon',
    dragToRotate: 'Drag to rotate',
    preview: 'Preview',
    peanut: 'Peanut',
    robot: 'Robot',
    slime: 'Slime',
    cat: 'Cat',
    ghost: 'Ghost',
    emoji: 'Emoji',
  },
};

export const useTranslation = () => {
  const language = useAvatarStore((state) => state.language);
  return translations[language];
};
