/**
 * StreamAvatar - Global State Store
 * 
 * Centralized state management using Zustand with persistence.
 * Handles avatar configuration, face tracking data, audio reactivity, and UI preferences.
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// Type Definitions
// =============================================================================

export type AvatarType = 'pill' | 'boxy' | 'sphere' | 'cat' | 'ghost' | 'emoji' | 'custom' | 'composite';
export type ExpressionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
export type BackgroundType = 'dark' | 'chroma-green' | 'chroma-blue'
  | 'transparent'
  | 'splat'; // Experimental 3DGS
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

interface CustomModel {
  url: string;
  name: string;
  type: 'glb' | 'vrm';
}

export interface AvatarPart {
  id: string;
  type: 'sphere' | 'box' | 'cylinder' | 'torus' | 'head' | 'body';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  visible: boolean;
}

export interface AvatarPreset {
  id: string;
  name: string;
  avatarType: AvatarType;
  parts: AvatarPart[];
  baseColor: string;
  baseScale: number;
  customModel?: CustomModel;
  lastModified: number;
}

export interface HotkeyMapping {
  key: string;
  expression: ExpressionType;
  intensity: number;
}

interface AvatarStore {
  // Avatar settings
  selectedAvatar: AvatarType;
  avatarColor: string;
  avatarScale: number;
  customModel: CustomModel | null;

  // Expressions & Hotkeys
  activeExpression: ExpressionType;
  hotkeyMappings: HotkeyMapping[];

  // Composite Avatar system
  currentParts: AvatarPart[];
  presets: AvatarPreset[];
  activePresetId: string | null;

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

  // Lip Sync (phonetic)
  lipSyncEnabled: boolean;

  // Privacy & Ethics
  obfuscationMode: boolean; // Immediate data disposal after render
  privacyShieldActive: boolean; // Visual indicator and status

  // Graphics Quality
  graphicsQuality: 'low' | 'high';

  // Language
  language: Language;

  // Actions - Avatar
  setSelectedAvatar: (avatar: AvatarType) => void;
  setAvatarColor: (color: string) => void;
  setAvatarScale: (scale: number) => void;
  setCustomModel: (model: CustomModel | null) => void;

  // Actions - Composite & Presets
  addPart: (type: AvatarPart['type']) => void;
  removePart: (id: string) => void;
  updatePart: (id: string, updates: Partial<AvatarPart>) => void;
  saveCurrentAsPreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  // Actions - Expressions & Hotkeys
  setActiveExpression: (expression: ExpressionType) => void;
  setHotkeyMapping: (mapping: HotkeyMapping) => void;
  removeHotkeyMapping: (key: string) => void;

  // Actions - Background
  setBackground: (bg: BackgroundType) => void;

  // Actions - Face Tracking
  setFaceData: (data: FaceData) => void;
  setCameraActive: (active: boolean) => void;
  setTracking: (tracking: boolean) => void;

  // Actions - Audio
  setAudioData: (data: AudioData) => void;
  setAudioSensitivity: (sensitivity: number) => void;
  setAudioReactiveEnabled: (enabled: boolean) => void;
  setLipSyncEnabled: (enabled: boolean) => void;

  // Actions - Privacy
  setObfuscationMode: (enabled: boolean) => void;
  setPrivacyShieldActive: (active: boolean) => void;

  // Actions - Graphics
  setGraphicsQuality: (quality: 'low' | 'high') => void;

  // Actions - Language
  setLanguage: (lang: Language) => void;

  // Actions - Config Management
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  resetToDefaults: () => void;
}

// =============================================================================
// Default State
// =============================================================================

const defaultState = {
  selectedAvatar: 'pill' as AvatarType,
  avatarColor: '#c97d3d',
  avatarScale: 1,
  customModel: null as CustomModel | null,
  activeExpression: 'neutral' as ExpressionType,
  hotkeyMappings: [
    { key: '1', expression: 'happy', intensity: 1 },
    { key: '2', expression: 'sad', intensity: 1 },
    { key: '3', expression: 'angry', intensity: 1 },
    { key: '4', expression: 'surprised', intensity: 1 },
    { key: '0', expression: 'neutral', intensity: 1 },
  ] as HotkeyMapping[],
  currentParts: [] as AvatarPart[],
  presets: [] as AvatarPreset[],
  activePresetId: null as string | null,
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
  lipSyncEnabled: false,
  obfuscationMode: false,
  privacyShieldActive: true,
  language: 'es' as Language,
  graphicsQuality: 'high' as 'low' | 'high',
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Avatar Actions
      setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
      setAvatarColor: (color) => set({ avatarColor: color }),
      setAvatarScale: (scale) => set({ avatarScale: scale }),
      setCustomModel: (model) => set({
        customModel: model,
        selectedAvatar: model ? 'custom' : get().selectedAvatar === 'custom' ? 'pill' : get().selectedAvatar
      }),

      // Composite & Preset Actions
      addPart: (type) => set((state) => ({
        currentParts: [
          ...state.currentParts,
          {
            id: Math.random().toString(36).substr(2, 9),
            type,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: state.avatarColor,
            visible: true,
          }
        ],
        selectedAvatar: 'composite'
      })),

      removePart: (id) => set((state) => ({
        currentParts: state.currentParts.filter(p => p.id !== id)
      })),

      updatePart: (id, updates) => set((state) => ({
        currentParts: state.currentParts.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      saveCurrentAsPreset: (name) => {
        const state = get();
        const newPreset: AvatarPreset = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          avatarType: state.selectedAvatar,
          parts: [...state.currentParts],
          baseColor: state.avatarColor,
          baseScale: state.avatarScale,
          customModel: state.customModel || undefined,
          lastModified: Date.now(),
        };
        set({ presets: [...state.presets, newPreset], activePresetId: newPreset.id });
      },

      loadPreset: (id) => {
        const preset = get().presets.find(p => p.id === id);
        if (preset) {
          set({
            selectedAvatar: preset.avatarType,
            currentParts: [...preset.parts],
            avatarColor: preset.baseColor,
            avatarScale: preset.baseScale,
            customModel: preset.customModel || null,
            activePresetId: preset.id
          });
        }
      },

      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id),
        activePresetId: state.activePresetId === id ? null : state.activePresetId
      })),

      // Expression & Hotkey Actions
      setActiveExpression: (expression) => set({ activeExpression: expression }),
      setHotkeyMapping: (mapping) => set((state) => ({
        hotkeyMappings: [
          ...state.hotkeyMappings.filter(m => m.key !== mapping.key),
          mapping
        ]
      })),
      removeHotkeyMapping: (key) => set((state) => ({
        hotkeyMappings: state.hotkeyMappings.filter(m => m.key !== key)
      })),

      // Background Actions
      setBackground: (bg) => set({ background: bg }),

      // Face Tracking Actions
      setFaceData: (data) => set({ faceData: data }),
      setCameraActive: (active) => set({ isCameraActive: active }),
      setTracking: (tracking) => set({ isTracking: tracking }),

      // Audio Actions
      setAudioData: (data) => set({ audioData: data }),
      setAudioSensitivity: (sensitivity) => set({ audioSensitivity: sensitivity }),
      setAudioReactiveEnabled: (enabled) => set({ audioReactiveEnabled: enabled }),
      setLipSyncEnabled: (enabled) => set({ lipSyncEnabled: enabled }),

      // Privacy Actions
      setObfuscationMode: (enabled) => set({ obfuscationMode: enabled }),
      setPrivacyShieldActive: (active) => set({ privacyShieldActive: active }),

      // Language Actions
      setLanguage: (lang) => set({ language: lang }),

      // Actions - Graphics
      setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),

      // Config Management
      exportConfig: () => {
        const state = get();
        const exportData = {
          version: 1, // For future compatibility
          selectedAvatar: state.selectedAvatar,
          avatarColor: state.avatarColor,
          avatarScale: state.avatarScale,
          background: state.background,
          audioSensitivity: state.audioSensitivity,
          language: state.language,
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
      version: 1, // Increment when state shape changes
      partialize: (state) => ({
        selectedAvatar: state.selectedAvatar,
        avatarColor: state.avatarColor,
        avatarScale: state.avatarScale,
        background: state.background,
        audioSensitivity: state.audioSensitivity,
        language: state.language,
        presets: state.presets,
        currentParts: state.currentParts,
        activePresetId: state.activePresetId,
        hotkeyMappings: state.hotkeyMappings,
        graphicsQuality: state.graphicsQuality,
      }),
    }
  )
);

// =============================================================================
// Translations
// =============================================================================

export const translations = {
  es: {
    // Navigation
    studio: 'Studio',
    avatar: 'Avatar',
    settings: 'Ajustes',
    controlPanel: 'Panel de Control',
    configureAvatar: 'Configurar Avatar',

    // Camera
    startCamera: 'Iniciar Cámara',
    stopCamera: 'Detener Cámara',
    starting: 'Iniciando...',
    cameraActive: 'Cámara Activa',
    cameraInactive: 'Cámara Inactiva',
    trackingOk: 'Tracking OK',
    noFace: 'Sin Rostro',
    shareScreen: 'Compartir Pantalla (Próximamente)',

    // Avatar Selection
    selectAvatar: 'Seleccionar Avatar',
    importModel: 'Importar .VRM / .GLB',
    customModel: 'Modelo 3D personalizado',
    removeCustomModel: 'Eliminar modelo personalizado',
    peanut: 'Cacahuete',
    robot: 'Robot',
    slime: 'Slime',
    cat: 'Gato',
    ghost: 'Fantasma',
    emoji: 'Emoji',

    // Avatar Customization
    color: 'Color',
    scale: 'Escala',
    background: 'Fondo',
    dark: 'Oscuro',
    green: 'Verde',
    blue: 'Azul',
    transparent: 'Trans',

    // OBS Setup
    obsSetup: 'Configurar OBS',
    obsInstructions: 'Copia este link y añádelo como Browser Source en OBS. Usa fondo chroma para transparencia.',
    cleanView: 'Vista Limpia (OBS)',
    addAsBrowserSource: 'Añadir como Browser Source',
    copyLink: 'Copiar Link',
    openPreview: 'Abrir vista',
    quickBackground: 'Fondo rápido',
    chromaGreen: 'Chroma Verde',
    chromaBlue: 'Chroma Azul',
    viewFullGuide: 'Ver guía completa →',
    splat: 'Fondos 3DGS (Beta)',
    linkCopied: '¡Link copiado!',
    useAsOBS: 'Usa este link como Browser Source en OBS',

    // Audio
    audioReactive: 'Reacción al Audio',
    enableAudioReactive: 'Activar reacción al audio',
    sensitivity: 'Sensibilidad',
    startListening: 'Activar Micrófono',
    stopListening: 'Desactivar Micrófono',
    listening: 'Escuchando',

    // Settings
    language: 'Idioma',
    exportConfig: 'Exportar Configuración',
    importConfig: 'Importar Configuración',
    resetDefaults: 'Restablecer Valores',
    exportSuccess: '¡Configuración exportada!',
    importSuccess: '¡Configuración importada!',
    importError: 'Error al importar configuración',
    resetSuccess: 'Valores restablecidos',

    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    add: 'Añadir',
    comingSoon: 'Próximamente más opciones',
    dragToRotate: 'Arrastra para rotar',
    preview: 'Vista previa',
    tapForOptions: 'Toca para opciones',
    experimental: 'Experimental',

    // Lip Sync
    lipSync: 'Lip-Sync Fonético',
    enableLipSync: 'Activar sincronización por voz',
    lipSyncDesc: 'Analiza tu voz para mover la boca con las vocales (A, E, I, O, U).',

    // Privacy
    privacy: 'Privacidad y Ética',
    obfuscationMode: 'Modo Ofuscación',
    obfuscationDesc: 'Descarta datos biométricos inmediatamente después del renderizado.',
    privacyShield: 'Privacy Shield Activo',
    localProcessing: 'Procesamiento 100% Local',

    // Model Import
    unsupportedFormat: 'Formato no soportado',
    onlyGLBorVRM: 'Solo se permiten archivos .GLB o .VRM',
    modelLoaded: '¡Modelo cargado!',
    modelReadyToUse: 'listo para usar',
    loadingModel: 'Cargando modelo...',

    // Composer & Hotkeys
    composer: 'Compositor de Avatar',
    addPart: 'Añadir Pieza',
    partsList: 'Lista de Piezas',
    transform: 'Transformar',
    hotkeys: 'Mapeo de Hotkeys',
    hotkeysDesc: 'Control de expresiones con teclado',
    recordKey: 'Presiona una tecla...',
    noKey: 'Sin asignar',
    expressionHappy: 'Feliz',
    expressionSad: 'Triste',
    expressionAngry: 'Enfadado',
    expressionSurprised: 'Sorprendido',
    expressionNeutral: 'Neutral',
    savePreset: 'Guardar Identidad',
    presetName: 'Nombre de la identidad...',

    // Legacy (kept for backwards compatibility if referenced elsewhere)
    stream: 'Stream',
    streamDestinations: 'Destinos de Stream',
    destinations: 'Destinos',
    configured: 'Configurado',
    noStreamKey: 'Sin Stream Key',
    goLive: 'GO LIVE',
    stopStream: 'DETENER STREAM',
    noDestinations: 'Sin destinos configurados',
    configureDestination: 'Configura al menos un destino con Stream Key',
    streamStopped: 'Stream detenido',
    streamEnded: 'Tu stream ha terminado',
    live: '¡EN VIVO!',
    streamingTo: 'Transmitiendo a',
    destinationsCount: 'destino(s)',
    namePlaceholder: 'Nombre (ej: Kick)',
    rtmpPlaceholder: 'RTMP URL',
    streamKeyPlaceholder: 'Stream Key',
    yourSecretKey: 'Tu clave secreta',
    importModelComingSoon: 'Importar .VRM / .GLB (Próximamente)',
  },
  en: {
    // Navigation
    studio: 'Studio',
    avatar: 'Avatar',
    settings: 'Settings',
    controlPanel: 'Control Panel',
    configureAvatar: 'Configure Avatar',

    // Camera
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    starting: 'Starting...',
    cameraActive: 'Camera Active',
    cameraInactive: 'Camera Inactive',
    trackingOk: 'Tracking OK',
    noFace: 'No Face',
    shareScreen: 'Share Screen (Coming Soon)',

    // Avatar Selection
    selectAvatar: 'Select Avatar',
    importModel: 'Import .VRM / .GLB',
    customModel: 'Custom 3D model',
    removeCustomModel: 'Remove custom model',
    peanut: 'Peanut',
    robot: 'Robot',
    slime: 'Slime',
    cat: 'Cat',
    ghost: 'Ghost',
    emoji: 'Emoji',

    // Avatar Customization
    color: 'Color',
    scale: 'Scale',
    background: 'Background',
    dark: 'Dark',
    green: 'Green',
    blue: 'Blue',
    transparent: 'Trans',

    // OBS Setup
    obsSetup: 'OBS Setup',
    obsInstructions: 'Copy this link and add it as a Browser Source in OBS. Use chroma background for transparency.',
    cleanView: 'Clean View (OBS)',
    addAsBrowserSource: 'Add as Browser Source',
    copyLink: 'Copy Link',
    openPreview: 'Open view',
    quickBackground: 'Quick Background',
    chromaGreen: 'Chroma Green',
    chromaBlue: 'Chroma Blue',
    viewFullGuide: 'View Full Setup Guide →',
    splat: '3DGS Background (Beta)',
    linkCopied: 'Link copied!',
    useAsOBS: 'Use this link as Browser Source in OBS',

    // Audio
    audioReactive: 'Audio Reactive',
    enableAudioReactive: 'Enable audio reactive',
    sensitivity: 'Sensitivity',
    startListening: 'Start Microphone',
    stopListening: 'Stop Microphone',
    listening: 'Listening',

    // Settings
    language: 'Language',
    exportConfig: 'Export Configuration',
    importConfig: 'Import Configuration',
    resetDefaults: 'Reset to Defaults',
    exportSuccess: 'Configuration exported!',
    importSuccess: 'Configuration imported!',
    importError: 'Error importing configuration',
    resetSuccess: 'Values reset',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    comingSoon: 'More options coming soon',
    dragToRotate: 'Drag to rotate',
    preview: 'Preview',
    tapForOptions: 'Tap for options',
    experimental: 'Experimental',

    // Lip Sync
    lipSync: 'Phonetic Lip-Sync',
    enableLipSync: 'Enable voice synchronization',
    lipSyncDesc: 'Analyzes your voice to move the mouth with vowels (A, E, I, O, U).',

    // Privacy
    privacy: 'Privacy & Ethics',
    obfuscationMode: 'Obfuscation Mode',
    obfuscationDesc: 'Discards biometric data immediately after rendering.',
    privacyShield: 'Privacy Shield Active',
    localProcessing: '100% Local Processing',

    // Model Import
    unsupportedFormat: 'Unsupported format',
    onlyGLBorVRM: 'Only .GLB or .VRM files are allowed',
    modelLoaded: 'Model loaded!',
    modelReadyToUse: 'ready to use',
    loadingModel: 'Loading model...',

    // Composer & Hotkeys
    composer: 'Avatar Composer',
    addPart: 'Add Part',
    partsList: 'Parts List',
    transform: 'Transform',
    hotkeys: 'Hotkey Mapping',
    hotkeysDesc: 'Keyboard expression control',
    recordKey: 'Press a key...',
    noKey: 'Unassigned',
    expressionHappy: 'Happy',
    expressionSad: 'Sad',
    expressionAngry: 'Angry',
    expressionSurprised: 'Surprised',
    expressionNeutral: 'Neutral',
    savePreset: 'Save Identity',
    presetName: 'Identity name...',

    // Legacy (kept for backwards compatibility if referenced elsewhere)
    stream: 'Stream',
    streamDestinations: 'Stream Destinations',
    destinations: 'Destinations',
    configured: 'Configured',
    noStreamKey: 'No Stream Key',
    goLive: 'GO LIVE',
    stopStream: 'STOP STREAM',
    noDestinations: 'No destinations configured',
    configureDestination: 'Configure at least one destination with Stream Key',
    streamStopped: 'Stream stopped',
    streamEnded: 'Your stream has ended',
    live: 'LIVE!',
    streamingTo: 'Streaming to',
    destinationsCount: 'destination(s)',
    namePlaceholder: 'Name (e.g.: Kick)',
    rtmpPlaceholder: 'RTMP URL',
    streamKeyPlaceholder: 'Stream Key',
    yourSecretKey: 'Your secret key',
    importModelComingSoon: 'Import .VRM / .GLB (Coming Soon)',
  },
};

// =============================================================================
// Translation Hook
// =============================================================================

export const useTranslation = () => {
  const language = useAvatarStore((state) => state.language);
  return translations[language];
};
