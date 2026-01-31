import { create } from 'zustand';

export type AvatarType = 'pill' | 'boxy' | 'sphere';
export type BackgroundType = 'dark' | 'chroma-green' | 'chroma-blue' | 'transparent';

interface FaceData {
  headRotation: { x: number; y: number; z: number };
  mouthOpen: number;
  leftEyeBlink: number;
  rightEyeBlink: number;
}

interface StreamDestination {
  id: string;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  enabled: boolean;
}

interface AvatarStore {
  // Avatar settings
  selectedAvatar: AvatarType;
  avatarColor: string;
  avatarScale: number;
  
  // Background
  background: BackgroundType;
  
  // Face tracking
  faceData: FaceData;
  isCameraActive: boolean;
  isTracking: boolean;
  
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
  addStreamDestination: (dest: Omit<StreamDestination, 'id'>) => void;
  removeStreamDestination: (id: string) => void;
  toggleStreamDestination: (id: string) => void;
  updateStreamDestination: (id: string, updates: Partial<StreamDestination>) => void;
  setLive: (live: boolean) => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  // Initial state
  selectedAvatar: 'pill',
  avatarColor: '#c97d3d',
  avatarScale: 1,
  background: 'dark',
  faceData: {
    headRotation: { x: 0, y: 0, z: 0 },
    mouthOpen: 0,
    leftEyeBlink: 0,
    rightEyeBlink: 0,
  },
  isCameraActive: false,
  isTracking: false,
  streamDestinations: [
    { id: '1', name: 'Twitch', rtmpUrl: 'rtmp://live.twitch.tv/live', streamKey: '', enabled: false },
    { id: '2', name: 'YouTube', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', streamKey: '', enabled: false },
  ],
  isLive: false,

  // Actions
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
  setAvatarColor: (color) => set({ avatarColor: color }),
  setAvatarScale: (scale) => set({ avatarScale: scale }),
  setBackground: (bg) => set({ background: bg }),
  setFaceData: (data) => set({ faceData: data }),
  setCameraActive: (active) => set({ isCameraActive: active }),
  setTracking: (tracking) => set({ isTracking: tracking }),
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
}));
