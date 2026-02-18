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
 * Security: All URL parameters are validated with length limits and 
 * whitelist validation to prevent malformed configurations.
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AvatarRenderer } from '@/components/avatars/AvatarRenderer';
import { useAvatarStore, BackgroundType } from '@/stores/avatarStore';
import { debugLog, debugWarn } from '@/lib/debugLog';

// =============================================================================
// Types & Constants
// =============================================================================

type AvatarType = 'pill' | 'sphere' | 'boxy' | 'cat' | 'ghost' | 'emoji' | 'custom';

const VALID_AVATARS: AvatarType[] = ['pill', 'sphere', 'boxy', 'cat', 'ghost', 'emoji', 'custom'];
// Note: 'splat' is excluded from CleanView as it's experimental
const VALID_BACKGROUNDS: BackgroundType[] = ['transparent', 'chroma-green', 'chroma-blue', 'dark'];

// Mapping of background IDs to CSS values
// Mapeo de IDs de fondo a valores CSS
const BACKGROUND_COLORS: Record<BackgroundType, string> = {
  'transparent': 'transparent',
  'chroma-green': '#00ff00',
  'chroma-blue': '#0000ff',
  'dark': '#0a0a0a',
  'splat': '#0a0a0a', // Fallback for splat (not used in CleanView)
  'ar-camera': '#0a0a0a', // Fallback for ar-camera (not used in CleanView)
};

// =============================================================================
// Security: Parameter Length Limits
// =============================================================================

const MAX_PARAM_LENGTH = 20; // Maximum characters for any URL parameter

/**
 * Safely get a URL parameter with length validation
 * Returns null if parameter exceeds maximum length
 * 
 * Obtiene parámetro de URL de forma segura con validación de longitud
 */
function safeGetParam(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key);
  if (value === null) return null;

  // Reject overly long parameters to prevent abuse
  // Rechaza parámetros demasiado largos para prevenir abuso
  if (value.length > MAX_PARAM_LENGTH) {
    debugWarn(`[CleanView] Parameter "${key}" exceeded max length (${MAX_PARAM_LENGTH}), ignoring`);
    return null;
  }

  return value;
}

// =============================================================================
// URL Parameter Parser with Enhanced Validation
// =============================================================================

interface URLConfig {
  avatar: AvatarType;
  color: string | null;
  background: BackgroundType;
  scale: number;
  idleEnabled: boolean;
  validationErrors: string[];
}

/**
 * Parses and validates all URL parameters
 * Enforces whitelists and numeric ranges
 */
function parseURLConfig(searchParams: URLSearchParams): URLConfig {
  const validationErrors: string[] = [];

  // Avatar type - whitelist validation
  // Tipo de avatar - validación por lista blanca
  const avatarParam = safeGetParam(searchParams, 'avatar')?.toLowerCase();
  let avatar: AvatarType = 'pill';
  if (avatarParam) {
    if (VALID_AVATARS.includes(avatarParam as AvatarType)) {
      avatar = avatarParam as AvatarType;
    } else {
      validationErrors.push(`Invalid avatar type: "${avatarParam}"`);
    }
  }

  // Color - strict hex validation (6 characters, alphanumeric only)
  // Color - validación hexagonal estricta
  const colorParam = safeGetParam(searchParams, 'color');
  let color: string | null = null;
  if (colorParam) {
    // Only allow exactly 6 hex characters
    if (/^[0-9a-fA-F]{6}$/.test(colorParam)) {
      color = `#${colorParam}`;
    } else {
      validationErrors.push(`Invalid color format: "${colorParam}"`);
    }
  }

  // Background - whitelist validation
  // Fondo - validación por lista blanca
  const bgParam = safeGetParam(searchParams, 'bg')?.toLowerCase();
  let background: BackgroundType = 'transparent';
  if (bgParam) {
    if (VALID_BACKGROUNDS.includes(bgParam as BackgroundType)) {
      background = bgParam as BackgroundType;
    } else {
      validationErrors.push(`Invalid background type: "${bgParam}"`);
    }
  }

  // Scale - numeric validation with strict range (0.5 - 3.0)
  // Escala - validación numérica con rango estricto
  const scaleParam = safeGetParam(searchParams, 'scale');
  let scale = 1;
  if (scaleParam) {
    const parsed = parseFloat(scaleParam);
    if (!isNaN(parsed) && isFinite(parsed)) {
      scale = Math.max(0.5, Math.min(3.0, parsed));
    } else {
      validationErrors.push(`Invalid scale value: "${scaleParam}"`);
    }
  }

  // Idle animations - boolean validation
  // Animaciones reposo - validación booleana
  const idleParam = safeGetParam(searchParams, 'idle')?.toLowerCase();
  const idleEnabled = idleParam !== 'false';

  // Log validation errors for monitoring
  if (validationErrors.length > 0) {
    debugWarn('[CleanView] URL parameter validation errors:', validationErrors);
  }

  return { avatar, color, background, scale, idleEnabled, validationErrors };
}

// =============================================================================
// Error Boundary Fallback UI
// =============================================================================

interface ConfigErrorProps {
  errors: string[];
}

/**
 * Displays configuration errors briefly on screen
 * Useful for debugging URL issues in OBS
 */
const ConfigErrorNotice = ({ errors }: ConfigErrorProps) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed top-2 left-2 bg-yellow-500/20 border border-yellow-500/40 rounded px-2 py-1 text-xs text-yellow-200 max-w-xs">
      <span className="font-medium">Config warnings:</span>
      <ul className="mt-1">
        {errors.slice(0, 3).map((err, i) => (
          <li key={i} className="truncate">{err}</li>
        ))}
        {errors.length > 3 && <li>...and {errors.length - 3} more</li>}
      </ul>
    </div>
  );
};

// =============================================================================
// Component
// =============================================================================

const CleanView = () => {
  const [searchParams] = useSearchParams();
  const { setSelectedAvatar, setAvatarColor, setAvatarScale, setBackground } = useAvatarStore();
  const [showErrors, setShowErrors] = useState(true);

  // Parse URL config (memoized to avoid recalculation)
  // Parsear config URL (memoizado para evitar recálculos)
  const config = useMemo(() => parseURLConfig(searchParams), [searchParams]);

  // Apply URL config to store on mount
  // Aplicar configuración al store al montar
  useEffect(() => {
    debugLog('[CleanView] Applying URL configuration:', {
      avatar: config.avatar,
      color: config.color,
      background: config.background,
      scale: config.scale,
    });

    // Apply avatar type
    setSelectedAvatar(config.avatar);

    // Apply color if specified
    if (config.color) {
      setAvatarColor(config.color);
    }

    // Apply scale
    setAvatarScale(config.scale);

    // Apply background - pass the BackgroundType directly
    setBackground(config.background);

    // Hide errors after 5 seconds in production use
    // Ocultar errores tras 5 segundos
    const timer = setTimeout(() => setShowErrors(false), 5000);
    return () => clearTimeout(timer);
  }, [config, setSelectedAvatar, setAvatarColor, setAvatarScale, setBackground]);

  // Determine container styles
  // Determinar estilos del contenedor
  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: BACKGROUND_COLORS[config.background],
  };

  return (
    <div style={containerStyle}>
      {/* Show validation errors briefly for debugging */}
      {/* Mostrar errores de validación brevemente */}
      {showErrors && <ConfigErrorNotice errors={config.validationErrors} />}

      {/* Render the avatar in clean mode (no controls) */}
      {/* Renderizar avatar en modo limpio (sin controles) */}
      <AvatarRenderer isCleanView />
    </div>
  );
};

export default CleanView;
