import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAvatarStore } from '@/stores/avatarStore';

// Mock the avatar store
vi.mock('@/stores/avatarStore', () => ({
    useAvatarStore: vi.fn(),
}));

describe('useHotkeys', () => {
    const mockSetActiveExpression = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        (useAvatarStore as any).mockReturnValue({
            hotkeyMappings: [
                { key: '1', expression: 'happy', intensity: 1 },
                { key: '2', expression: 'sad', intensity: 1 },
                { key: 'h', expression: 'happy', intensity: 1 },
            ],
            setActiveExpression: mockSetActiveExpression,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should register keydown event listener on mount', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        
        renderHook(() => useHotkeys());
        
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove keydown event listener on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        
        const { unmount } = renderHook(() => useHotkeys());
        unmount();
        
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should trigger expression when mapped key is pressed', () => {
        renderHook(() => useHotkeys());
        
        // Simulate keydown event
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).toHaveBeenCalledWith('happy');
    });

    it('should handle case-insensitive key matching', () => {
        renderHook(() => useHotkeys());
        
        // Test uppercase key that should match lowercase mapping
        const event = new KeyboardEvent('keydown', { key: 'H' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).toHaveBeenCalledWith('happy');
    });

    it('should not trigger expression for unmapped keys', () => {
        renderHook(() => useHotkeys());
        
        const event = new KeyboardEvent('keydown', { key: 'z' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).not.toHaveBeenCalled();
    });

    it('should not trigger when typing in an input field', () => {
        // Create an input element and focus it
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        
        renderHook(() => useHotkeys());
        
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).not.toHaveBeenCalled();
        
        // Cleanup
        document.body.removeChild(input);
    });

    it('should not trigger when typing in a textarea', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.focus();
        
        renderHook(() => useHotkeys());
        
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).not.toHaveBeenCalled();
        
        document.body.removeChild(textarea);
    });

    it('should update mappings when store changes', () => {
        const { rerender } = renderHook(() => useHotkeys());
        
        // Change the mock to have different mappings
        (useAvatarStore as any).mockReturnValue({
            hotkeyMappings: [
                { key: 'x', expression: 'angry', intensity: 1 },
            ],
            setActiveExpression: mockSetActiveExpression,
        });
        
        rerender();
        
        const event = new KeyboardEvent('keydown', { key: 'x' });
        window.dispatchEvent(event);
        
        expect(mockSetActiveExpression).toHaveBeenCalledWith('angry');
    });
});
