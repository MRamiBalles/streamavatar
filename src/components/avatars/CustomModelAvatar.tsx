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
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { normalizeVRM, normalizeModel, logNormalization } from '@/lib/modelNormalizer';
import { mapSimpleToVRM, mapARKitToVRM, applyVisemesToVRM } from '@/lib/vrmTrackingBridge';

// =============================================================================
// Types & Configuration
// =============================================================================

interface CustomModelAvatarProps {
  modelUrl: string;
  modelType: 'glb' | 'vrm';
}

/** Trusted domains for remote model loading (SSRF prevention) */
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
  if (url.startsWith('blob:')) {
    return { valid: true };
  }

  // Data URLs - safe if correct MIME type
  if (url.startsWith('data:')) {
    if (url.startsWith('data:model/') || url.startsWith('data:application/octet-stream')) {
      return { valid: true };
    }
    return { valid: false, error: 'Data URL must be a valid 3D model format' };
  }

  // Remote URLs - strict validation
  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // SSRF prevention - block private networks
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
  const groupRef = useRef<THREE.Group>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { avatarScale } = useAvatarStore();
  const { getAnimationState } = useAvatarAnimation();

  // -------------------------------------------------------------------------
  // Model Loading
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Validate URL
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
    let mounted = true;

    // Timeout for slow connections
    const loadTimeout = setTimeout(() => {
      if (mounted) {
        setError('Model loading timed out (30s)');
        setIsLoading(false);
      }
    }, 30000);

    // Register VRM plugin if loading VRM
    if (modelType === 'vrm') {
      loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(loadTimeout);
        if (!mounted) return;

        if (modelType === 'vrm' && gltf.userData.vrm) {
          const vrmModel = gltf.userData.vrm as VRM;

          // Optimize the model
          VRMUtils.removeUnnecessaryVertices(vrmModel.scene);
          VRMUtils.removeUnnecessaryJoints(vrmModel.scene);

          // Disable frustum culling for VRM (prevents disappearing)
          vrmModel.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });

          // Normalize model (center, scale, fix rotation)
          const normResult = normalizeVRM(vrmModel);
          logNormalization(normResult, 'VRM Model');

          setVrm(vrmModel);
          console.log('[CustomModelAvatar] VRM loaded successfully');
          console.log('  - Spring Bones:', vrmModel.springBoneManager ? 'Yes' : 'No');
          console.log('  - Expressions:', vrmModel.expressionManager ? Object.keys(vrmModel.expressionManager.expressionMap || {}).length : 0);
        } else {
          // Regular GLB
          const scene = gltf.scene;

          // Enable shadows
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

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(loadTimeout);

      // Dispose VRM resources
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      }
    };
  }, [modelUrl, modelType]);

  // -------------------------------------------------------------------------
  // Animation Frame
  // -------------------------------------------------------------------------

  useFrame((_, delta) => {
    // Get unified animation state (tracking + idle)
    const anim = getAnimationState();

    // Head rotation
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

    // VRM-specific updates
    if (vrm) {
      // Update VRM (internal animations, lookAt, etc.)
      vrm.update(delta);

      // Update Spring Bones (hair, clothes physics)
      // The update method handles this internally in newer versions of three-vrm
      // but we can manually call springBoneManager if needed for custom delta
      if (vrm.springBoneManager) {
        // Spring bones are updated automatically in vrm.update(delta)
        // No need for manual call unless you want custom delta
      }

      // Apply expressions via Tracking Bridge
      // Priority: Phonetic Visemes > Simple Tracking
      applyVisemesToVRM(vrm, anim.visemes);

      // Other face tracking (eyes, head)
      mapARKitToVRM(vrm, {
        eyeBlinkLeft: anim.leftEyeBlink,
        eyeBlinkRight: anim.rightEyeBlink,
        // Head rotation is already handled by groupRef.current above
      });
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
      {vrm && <primitive object={vrm.scene} />}
      {gltfScene && <primitive object={gltfScene} />}
    </group>
  );
};
