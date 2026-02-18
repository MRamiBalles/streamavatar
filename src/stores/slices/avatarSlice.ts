/**
 * Avatar Slice — Avatar selection, composite parts, and presets
 */
import { StateCreator } from 'zustand';
import { getModel, saveModel, deleteModel } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

export type AvatarType = 'pill' | 'boxy' | 'sphere' | 'cat' | 'ghost' | 'alien' | 'scream' | 'emoji' | 'custom' | 'composite';
export type ExpressionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';

export interface CustomModel {
  url: string;
  name: string;
  type: 'glb' | 'vrm' | 'stl';
  initialRotation?: [number, number, number];
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

// =============================================================================
// Slice State & Actions
// =============================================================================

export interface AvatarSlice {
  // State
  selectedAvatar: AvatarType;
  avatarColor: string;
  avatarScale: number;
  customModel: CustomModel | null;
  customModelRotation: [number, number, number];
  activeExpression: ExpressionType;
  hotkeyMappings: HotkeyMapping[];
  currentParts: AvatarPart[];
  presets: AvatarPreset[];
  activePresetId: string | null;

  // Actions - Avatar
  setSelectedAvatar: (avatar: AvatarType) => void;
  setAvatarColor: (color: string) => void;
  setAvatarScale: (scale: number) => void;
  setCustomModelRotation: (rotation: [number, number, number]) => void;
  setCustomModel: (model: CustomModel | null) => Promise<void>;
  initPersistentModels: () => Promise<void>;

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
}

// =============================================================================
// Default State
// =============================================================================

export const avatarDefaults = {
  selectedAvatar: 'pill' as AvatarType,
  avatarColor: '#c97d3d',
  avatarScale: 1,
  customModel: null as CustomModel | null,
  customModelRotation: [0, 0, 0] as [number, number, number],
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
};

// =============================================================================
// Slice Creator
// =============================================================================

export const createAvatarSlice: StateCreator<AvatarSlice, [], [], AvatarSlice> = (set, get) => ({
  ...avatarDefaults,

  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
  setAvatarColor: (color) => set({ avatarColor: color }),
  setAvatarScale: (scale) => set({ avatarScale: scale }),
  setCustomModelRotation: (rotation) => set({ customModelRotation: rotation }),

  setCustomModel: async (model) => {
    if (!model) {
      const current = get().customModel;
      if (current?.url) URL.revokeObjectURL(current.url);
      await deleteModel('custom-avatar');
      set({ customModel: null, selectedAvatar: 'pill' });
      return;
    }
    set({ customModel: model, selectedAvatar: 'custom' });
  },

  initPersistentModels: async () => {
    try {
      const saved = await getModel('custom-avatar');
      if (saved && saved.data) {
        const url = URL.createObjectURL(saved.data);
        set({
          customModel: { url, name: saved.name, type: saved.type },
          selectedAvatar: 'custom',
        });
        console.log('[Store] Restored persistent model:', saved.name);
      }
    } catch (e) {
      console.error('[Store] Failed to restore model:', e);
    }
  },

  addPart: (type) => set((state) => ({
    currentParts: [
      ...state.currentParts,
      {
        id: crypto.randomUUID(),
        type,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: state.avatarColor,
        visible: true,
      },
    ],
    selectedAvatar: 'composite',
  })),

  removePart: (id) => set((state) => ({
    currentParts: state.currentParts.filter((p) => p.id !== id),
  })),

  updatePart: (id, updates) => set((state) => ({
    currentParts: state.currentParts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),

  saveCurrentAsPreset: (name) => {
    const state = get();
    const newPreset: AvatarPreset = {
      id: crypto.randomUUID(),
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
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      set({
        selectedAvatar: preset.avatarType,
        currentParts: [...preset.parts],
        avatarColor: preset.baseColor,
        avatarScale: preset.baseScale,
        customModel: preset.customModel || null,
        activePresetId: preset.id,
      });
    }
  },

  deletePreset: (id) => set((state) => ({
    presets: state.presets.filter((p) => p.id !== id),
    activePresetId: state.activePresetId === id ? null : state.activePresetId,
  })),

  setActiveExpression: (expression) => set({ activeExpression: expression }),

  setHotkeyMapping: (mapping) => set((state) => ({
    hotkeyMappings: [...state.hotkeyMappings.filter((m) => m.key !== mapping.key), mapping],
  })),

  removeHotkeyMapping: (key) => set((state) => ({
    hotkeyMappings: state.hotkeyMappings.filter((m) => m.key !== key),
  })),
});
