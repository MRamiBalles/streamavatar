import { useEffect } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';

/**
 * Hook to manage global hotkeys for avatar expressions.
 * Listens for keydown events and updates the active expression in the store.
 */
export function useHotkeys() {
    const { hotkeyMappings, setActiveExpression } = useAvatarStore();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger hotkeys if the user is typing in an input, textarea, etc.
            const activeElement = document.activeElement;
            const isTyping =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                (activeElement as HTMLElement)?.isContentEditable;

            if (isTyping) return;

            // Find if the pressed key matches any mapping
            const mapping = hotkeyMappings.find(
                (m) => m.key.toLowerCase() === event.key.toLowerCase()
            );

            if (mapping) {
                setActiveExpression(mapping.expression);

                // Optional: Reset to neutral after some time if needed, 
                // but for now we'll keep it active until changed.
                console.log(`[Hotkeys] Triggered expression: ${mapping.expression}`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hotkeyMappings, setActiveExpression]);
}
