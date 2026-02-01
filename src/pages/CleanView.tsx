/**
 * Clean View Page
 * 
 * Minimal avatar view designed for OBS Browser Source integration.
 * Supports URL-based configuration for easy scene setup.
 * 
 * URL Parameters:
 * - avatar: Avatar type (pill, sphere, boxy, cat, ghost, emoji, custom)
 * - color: Hex color without # (e.g., ff6b35)
 * - bg: Background type (transparent, chroma-green, chroma-blue)
 * - scale: Avatar scale multiplier (0.5-3.0)
 * - idle: Enable idle animations (true/false)
 * 
 * Example: /view?avatar=cat&color=ff6b35&bg=chroma-green&scale=1.2
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AvatarRenderer } from '@/components/avatars/AvatarRenderer';
import { useAvatarStore } from '@/stores/avatarStore';

// =============================================================================
// Types & Constants
// =============================================================================

type AvatarType = 'pill' | 'sphere' | 'boxy' | 'cat' | 'ghost' | 'emoji' | 'custom';
type BackgroundType = 'transparent' | 'chroma-green' | 'chroma-blue' | 'dark' | 'light';

const VALID_AVATARS: AvatarType[] = ['pill', 'sphere', 'boxy', 'cat', 'ghost', 'emoji', 'custom'];
const VALID_BACKGROUNDS: BackgroundType[] = ['transparent', 'chroma-green', 'chroma-blue', 'dark', 'light'];

const BACKGROUND_COLORS: Record<BackgroundType, string> = {
  'transparent': 'transparent',
  'chroma-green': '#00ff00',
  'chroma-blue': '#0000ff',
  'dark': '#0a0a0a',
  'light': '#f0f0f0',
};

// =============================================================================
// URL Parameter Parser
// =============================================================================

interface URLConfig {
  avatar: AvatarType;
  color: string | null;
  background: BackgroundType;
  scale: number;
  idleEnabled: boolean;
}

function parseURLConfig(searchParams: URLSearchParams): URLConfig {
  // Avatar type
  const avatarParam = searchParams.get('avatar')?.toLowerCase() as AvatarType | undefined;
  const avatar = avatarParam && VALID_AVATARS.includes(avatarParam) ? avatarParam : 'pill';

  // Color (hex without #)
  const colorParam = searchParams.get('color');
  let color: string | null = null;
  if (colorParam && /^[0-9a-fA-F]{6}$/.test(colorParam)) {
    color = `#${colorParam}`;
  }

  // Background
  const bgParam = searchParams.get('bg')?.toLowerCase() as BackgroundType | undefined;
  const background = bgParam && VALID_BACKGROUNDS.includes(bgParam) ? bgParam : 'transparent';

  // Scale (0.5 - 3.0)
  const scaleParam = parseFloat(searchParams.get('scale') || '1');
  const scale = isNaN(scaleParam) ? 1 : Math.max(0.5, Math.min(3.0, scaleParam));

  // Idle animations
  const idleParam = searchParams.get('idle')?.toLowerCase();
  const idleEnabled = idleParam !== 'false';

  return { avatar, color, background, scale, idleEnabled };
}

// =============================================================================
// Component
// =============================================================================

const CleanView = () => {
  const [searchParams] = useSearchParams();
  const { setSelectedAvatar, setAvatarColor, setAvatarScale, setBackground } = useAvatarStore();

  // Parse URL config (memoized to avoid recalculation)
  const config = useMemo(() => parseURLConfig(searchParams), [searchParams]);

  // Apply URL config to store on mount
  useEffect(() => {
    console.log('[CleanView] Applying URL configuration:', config);

    // Apply avatar type
    setSelectedAvatar(config.avatar);

    // Apply color if specified
    if (config.color) {
      setAvatarColor(config.color);
    }

    // Apply scale
    setAvatarScale(config.scale);

    // Apply background
    setBackground(BACKGROUND_COLORS[config.background]);

  }, [config, setSelectedAvatar, setAvatarColor, setAvatarScale, setBackground]);

  // Determine container styles
  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: BACKGROUND_COLORS[config.background],
  };

  return (
    <div style={containerStyle}>
      <AvatarRenderer isCleanView />
    </div>
  );
};

export default CleanView;
