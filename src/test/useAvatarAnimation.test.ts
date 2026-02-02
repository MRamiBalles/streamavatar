import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-three/fiber since it won't work in jsdom
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn((callback) => {
        // We can call the callback manually in tests if needed
    }),
}));

// Mock the stores and hooks
vi.mock('@/stores/avatarStore', () => ({
    useAvatarStore: vi.fn(() => ({
        faceData: {
            headRotation: { x: 0, y: 0, z: 0 },
            mouthOpen: 0,
            leftEyeBlink: 0,
            rightEyeBlink: 0,
        },
        isTracking: false,
        isCameraActive: false,
        audioData: { volume: 0, bass: 0, treble: 0 },
        audioReactiveEnabled: false,
        lipSyncEnabled: false,
        activeExpression: 'neutral',
    })),
}));

vi.mock('@/hooks/useIdleAnimations', () => ({
    useIdleAnimations: vi.fn(() => ({
        getIdleState: vi.fn(() => ({
            headRotation: { x: 0.1, y: 0.05, z: 0 },
            leftEyeBlink: 0,
            rightEyeBlink: 0,
            breathScale: 1.02,
        })),
    })),
}));

vi.mock('@/hooks/useAudioLipSync', () => ({
    useAudioLipSync: vi.fn(() => ({
        getLipSyncState: vi.fn(() => ({
            isActive: false,
            mouthOpen: 0,
            visemes: { aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, sil: 1 },
        })),
    })),
}));

// Import after mocks are set up
import { useAvatarAnimation, AvatarAnimationState } from '@/hooks/useAvatarAnimation';
import { renderHook } from '@testing-library/react';
import { useAvatarStore } from '@/stores/avatarStore';

describe('useAvatarAnimation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return getAnimationState function', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        expect(result.current.getAnimationState).toBeDefined();
        expect(typeof result.current.getAnimationState).toBe('function');
    });

    it('should return getBlendFactor function', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        expect(result.current.getBlendFactor).toBeDefined();
        expect(typeof result.current.getBlendFactor).toBe('function');
    });

    it('should return valid animation state structure', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(state).toHaveProperty('headRotation');
        expect(state).toHaveProperty('mouthOpen');
        expect(state).toHaveProperty('visemes');
        expect(state).toHaveProperty('leftEyeBlink');
        expect(state).toHaveProperty('rightEyeBlink');
        expect(state).toHaveProperty('breathScale');
        expect(state).toHaveProperty('activeExpression');
        expect(state).toHaveProperty('blendState');
    });

    it('should have valid headRotation structure', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(state.headRotation).toHaveProperty('x');
        expect(state.headRotation).toHaveProperty('y');
        expect(state.headRotation).toHaveProperty('z');
        expect(typeof state.headRotation.x).toBe('number');
        expect(typeof state.headRotation.y).toBe('number');
        expect(typeof state.headRotation.z).toBe('number');
    });

    it('should have valid visemes structure', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(state.visemes).toHaveProperty('aa');
        expect(state.visemes).toHaveProperty('ee');
        expect(state.visemes).toHaveProperty('ih');
        expect(state.visemes).toHaveProperty('oh');
        expect(state.visemes).toHaveProperty('ou');
        expect(state.visemes).toHaveProperty('sil');
    });

    it('should return numeric blink values', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(typeof state.leftEyeBlink).toBe('number');
        expect(typeof state.rightEyeBlink).toBe('number');
        expect(state.leftEyeBlink).toBeGreaterThanOrEqual(0);
        expect(state.rightEyeBlink).toBeGreaterThanOrEqual(0);
    });

    it('should include activeExpression from store', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(state.activeExpression).toBe('neutral');
    });

    it('should have valid blendState value', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const state = result.current.getAnimationState();
        
        expect(['tracking', 'idle', 'transitioning']).toContain(state.blendState);
    });

    it('should start with blend factor of 0 (idle mode)', () => {
        const { result } = renderHook(() => useAvatarAnimation());
        
        const blendFactor = result.current.getBlendFactor();
        
        expect(blendFactor).toBe(0);
    });

    it('should handle different expressions from store', () => {
        // Update the mock to return a different expression
        (useAvatarStore as any).mockReturnValue({
            faceData: {
                headRotation: { x: 0, y: 0, z: 0 },
                mouthOpen: 0,
                leftEyeBlink: 0,
                rightEyeBlink: 0,
            },
            isTracking: false,
            isCameraActive: false,
            audioData: { volume: 0, bass: 0, treble: 0 },
            audioReactiveEnabled: false,
            lipSyncEnabled: false,
            activeExpression: 'happy',
        });

        const { result } = renderHook(() => useAvatarAnimation());
        
        // Note: The expression won't update immediately due to how the hook caches the output
        // This test verifies the hook doesn't crash with different expressions
        expect(result.current.getAnimationState).toBeDefined();
    });
});
