/**
 * Custom Model Avatar
 * 
 * Professional VRM/GLB loader with:
 * - Spring Bones physics simulation
 * - Automatic model normalization
 * - Full expression tracking bridge
 * - Secure URL validation
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stats, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GaussianEntity } from '@/features/3dgs/GaussianEntity';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { normalizeVRM, normalizeModel, logNormalization } from '@/lib/modelNormalizer';
import {
  VRMAvatarEntity,
  AvatarEntity,
  BlendShapeData,
  mapSimpleToVRM,
  applyVisemesToVRM,
  applyExpressionToVRM
} from '@/lib/vrmTrackingBridge';
import { useFeatureFlag } from '@/lib/featureFlags';

// =============================================================================
// Types & Configuration
// =============================================================================

interface CustomModelAvatarProps {
  modelUrl: string; // URL of the 3D model (GLB or VRM) / URL del modelo 3D
  modelType: 'glb' | 'vrm'; // Type of the model / Tipo de modelo
}

/** Trusted domains for remote model loading (SSRF prevention) */
/** Dominios de confianza para carga remota (prevención SSRF) */
const ALLOWED_MODEL_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'github.com',
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'storage.googleapis.com',
  's3.amazonaws.com',
  'blob.core.windows.net',
  'sketchfab.com',
  'models.readyplayer.me',
  'hub.vroid.com',
  'lovable.app',
];

/** Spring Bones configuration for different avatar styles */
/** Configuración de huesos dinámicos para estilos de avatar */
const SPRING_BONE_CONFIG = {
  /** Stiffness multiplier (higher = stiffer hair/clothes) */
  stiffnessMultiplier: 1.0,
  /** Gravity power (higher = more droopy) */
  gravityPower: 1.0,
  /** Drag force (higher = more dampened movement) */
  dragForce: 0.4,
};

// =============================================================================
// URL Validation (Security)
// =============================================================================

function validateModelUrl(url: string): { valid: boolean; error?: string } {
  // Blob URLs - safe, created by URL.createObjectURL()
  // URLs Blob - seguras, creadas localmente
  if (url.startsWith('blob:')) {
    return { valid: true };
  }

  // Data URLs - safe if correct MIME type
  // URLs Data - seguras si el tipo MIME es correcto
  if (url.startsWith('data:')) {
    if (url.startsWith('data:model/') || url.startsWith('data:application/octet-stream')) {
      return { valid: true };
    }
    return { valid: false, error: 'Data URL must be a valid 3D model format' };
  }

  // Remote URLs - strict validation
  // URLs remotas - validación estricta
  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    // Must be HTTPS unless localhost
    // Debe ser HTTPS a menos que sea localhost
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // SSRF prevention - block private networks
    // Prevención SSRF - bloquear redes privadas
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./,
      /^169\.254\./, /^0\./, /^fc00:/i, /^fe80:/i,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Internal network URLs are not allowed' };
      }
    }

    // Domain whitelist
    // Lista blanca de dominios
    const isAllowedDomain = ALLOWED_MODEL_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowedDomain) {
      return {
        valid: false,
        error: `Domain not in allowed list. Upload locally or use: ${ALLOWED_MODEL_DOMAINS.slice(0, 3).join(', ')}...`
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// =============================================================================
// Component
// =============================================================================

export const CustomModelAvatar = ({ modelUrl, modelType }: CustomModelAvatarProps) => {
  // Refs and State
  const groupRef = useRef<THREE.Group>(null); // Group for head rotation / Grupo para rotación de cabeza
  const [entity, setEntity] = useState<AvatarEntity | null>(null); // VRM/3DGS Entity / Entidad VRM o 3DGS
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null); // Static GLB Scene / Escena GLB estática
  const [error, setError] = useState<string | null>(null); // Error state / Estado de error
  const [isLoading, setIsLoading] = useState(true); // Loading state / Estado de carga

  // Feature Flags
  const enableDebugHud = useFeatureFlag('ENABLE_DEBUG_HUD');
  const enable3DGS = useFeatureFlag('ENABLE_3DGS');

  // Store bindings
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const activeExpression = useAvatarStore((s) => s.activeExpression);
  const { getAnimationState } = useAvatarAnimation();

  // -------------------------------------------------------------------------
  // Model Loading
  // -------------------------------------------------------------------------

  useEffect(() => {
    // 1. Validate URL before attempting load
    // 1. Validar URL antes de intentar cargar
    const validation = validateModelUrl(modelUrl);
    if (!validation.valid) {
      console.warn('[CustomModelAvatar] URL validation failed:', validation.error);
      setError(validation.error || 'Invalid model URL');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loader = new GLTFLoader();
    let mounted = true; // Cleanup flag / Bandera de limpieza

    // Timeout for slow connections (30s)
    // Tiempo de espera para conexiones lentas
    const loadTimeout = setTimeout(() => {
      if (mounted) {
        setError('Model loading timed out (30s)');
        setIsLoading(false);
      }
    }, 30000);

    // Register VRM plugin if loading VRM
    // Registrar plugin VRM si se carga VRM
    if (modelType === 'vrm') {
      loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    // Load the model
    // Cargar el modelo
    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(loadTimeout);
        if (!mounted) return;

        // Handle VRM Models
        if (modelType === 'vrm' && gltf.userData.vrm) {
          const vrmModel = gltf.userData.vrm as VRM;

          // Optimization: Remove unnecessary geometry
          // Optimización: Eliminar geometría innecesaria
          VRMUtils.removeUnnecessaryVertices(vrmModel.scene);
          VRMUtils.removeUnnecessaryJoints(vrmModel.scene);

          // Disable frustum culling to prevent avatar disappearing at angles
          // Desactivar culling para evitar que desaparezca
          vrmModel.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });

          // Normalize model (scale, position, rotation)
          // Normalizar modelo
          const normResult = normalizeVRM(vrmModel);
          logNormalization(normResult, 'VRM Model');

          let newEntity: AvatarEntity;

          // Initialize entity based on feature flags
          // Inicializar entidad según flags
          if (enable3DGS) {
            console.log('[CustomModelAvatar] initializing Neural Shell (GaussianEntity)');
            const splatUrl = modelUrl.replace('.vrm', '.splat').replace('.glb', '.splat');
            newEntity = new GaussianEntity(vrmModel, splatUrl);
          } else {
            newEntity = new VRMAvatarEntity(vrmModel);
          }

          setEntity(newEntity);

          console.log('[CustomModelAvatar] VRM loaded successfully');
        } else {
          // Handle Regular GLB Models
          // Manejar modelos GLB regulares
          const scene = gltf.scene;

          // Enable shadows on all meshes
          // Habilitar sombras
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Normalize model
          const normResult = normalizeModel(scene);
          logNormalization(normResult, 'GLB Model');

          setGltfScene(scene);
          console.log('[CustomModelAvatar] GLB loaded successfully');
        }

        setIsLoading(false);
      },
      // Progress callback
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[CustomModelAvatar] Loading: ${pct}%`);
        }
      },
      // Error callback
      (err) => {
        clearTimeout(loadTimeout);
        if (!mounted) return;
        console.error('[CustomModelAvatar] Load error:', err);
        setError('Failed to load model. Check console for details.');
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(loadTimeout);

      // Dispose entity resources (Constitution §4)
      if (entity) {
        entity.dispose();
      }
    };
  }, [modelUrl, modelType]); // IMPORTANT: removed 'entity' to prevent infinite loop / IMPORTANTE: removido 'entity' para prevenir bucle infinito

  // -------------------------------------------------------------------------
  // Animation Frame
  // -------------------------------------------------------------------------

  useFrame((state, delta) => {
    // Get unified animation state (tracking + idle)
    // Obtener estado unificado de animación
    const anim = getAnimationState();

    // Head rotation (apply to group, works for both VRM and GLB)
    // Rotación de cabeza (aplica al grupo, funciona para ambos)
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        anim.headRotation.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -anim.headRotation.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        anim.headRotation.z,
        0.1
      );
    }

    // VRM-specific updates (BlendShapes, Physics)
    // Actualizaciones específicas de VRM
    if (entity) {
      // Update entity physics
      entity.update(delta, state.camera);

      // Priority: Phonetic Visemes > Simple Tracking
      applyVisemesToVRM(entity.vrm, anim.visemes);

      // Apply SDD-compliant BlendShapeData
      const blendData: BlendShapeData = {
        coefficients: anim.rawCoefficients || new Float32Array(52), // Use raw coefficients if available
        headRotation: [0, 0, 0, 1], // Placeholder for quaternion
        timestamp: Date.now()
      };

      // If we don't have rawCoefficients yet, we fallback to legacy logic
      if (!anim.rawCoefficients) {
        // Legacy fallback mapping
        entity.vrm.expressionManager?.setValue('blinkLeft', anim.leftEyeBlink);
        entity.vrm.expressionManager?.setValue('blinkRight', anim.rightEyeBlink);
      } else {
        entity.applyBlendShapes(blendData);
      }

      // Apply hotkey expression
      applyExpressionToVRM(entity.vrm, activeExpression);
    }
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Error state - show red wireframe sphere
  if (error) {
    return (
      <group scale={avatarScale}>
        <Sphere args={[0.5, 16, 16]}>
          <meshStandardMaterial color="#ff4444" wireframe />
        </Sphere>
      </group>
    );
  }

  // Loading state - show gray wireframe sphere
  if (isLoading) {
    return (
      <group scale={avatarScale}>
        <Sphere args={[0.5, 16, 16]}>
          <meshStandardMaterial color="#666" wireframe />
        </Sphere>
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={avatarScale}>
      {entity && <primitive object={entity.model} />}
      {gltfScene && <primitive object={gltfScene} />}

      {/* Debug HUD Overlay */}
      {enableDebugHud && (
        <>
          <Stats />
          <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0,0,0,0.7)',
              color: '#0f0',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              <div>DEBUG MODE</div>
              {enable3DGS && entity instanceof GaussianEntity && (
                <div>Splats: {entity.vertexCount.toLocaleString()}</div>
              )}
            </div>
          </Html>
        </>
      )}
    </group>
  );
};
