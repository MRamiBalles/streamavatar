import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';

interface CustomModelAvatarProps {
  modelUrl: string;
  modelType: 'glb' | 'vrm';
}

// Allowed domains for custom 3D models
const ALLOWED_MODEL_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Common 3D model hosting services
  'github.com',
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  // Cloud storage
  'storage.googleapis.com',
  's3.amazonaws.com',
  'blob.core.windows.net',
  // 3D model platforms
  'sketchfab.com',
  'models.readyplayer.me',
  'hub.vroid.com',
  // Lovable preview domains
  'lovable.app',
];

// Maximum file size for models (50MB)
const MAX_MODEL_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Validates a model URL for security
 * - Checks for HTTPS (or localhost)
 * - Validates against allowed domains
 * - Prevents loading internal network resources
 */
function validateModelUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow https (or http for localhost development)
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { valid: false, error: 'Only HTTPS URLs are allowed for security' };
    }
    
    // Check for internal/private network URLs (SSRF prevention)
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^fc00:/i,
      /^fe80:/i,
    ];
    
    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Internal network URLs are not allowed' };
      }
    }
    
    // Check against allowed domains
    const isAllowedDomain = ALLOWED_MODEL_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isAllowedDomain) {
      return { 
        valid: false, 
        error: `Domain not in allowed list. Allowed: ${ALLOWED_MODEL_DOMAINS.slice(0, 5).join(', ')}...` 
      };
    }
    
    // Check file extension
    const path = parsed.pathname.toLowerCase();
    if (!path.endsWith('.glb') && !path.endsWith('.vrm') && !path.includes('.glb') && !path.includes('.vrm')) {
      return { valid: false, error: 'URL must point to a .glb or .vrm file' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export const CustomModelAvatar = ({ modelUrl, modelType }: CustomModelAvatarProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { avatarScale, faceData } = useAvatarStore();

  useEffect(() => {
    // Validate URL before loading
    const validation = validateModelUrl(modelUrl);
    if (!validation.valid) {
      console.warn('Model URL validation failed:', validation.error);
      setError(validation.error || 'Invalid model URL');
      return;
    }
    
    const loader = new GLTFLoader();
    const abortController = new AbortController();
    
    // Set a timeout for loading (30 seconds)
    const loadTimeout = setTimeout(() => {
      abortController.abort();
      setError('Model loading timed out');
    }, 30000);
    
    if (modelType === 'vrm') {
      loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(loadTimeout);
        
        if (modelType === 'vrm' && gltf.userData.vrm) {
          const vrmModel = gltf.userData.vrm as VRM;
          VRMUtils.removeUnnecessaryVertices(vrmModel.scene);
          VRMUtils.removeUnnecessaryJoints(vrmModel.scene);
          vrmModel.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });
          setVrm(vrmModel);
        } else {
          // Regular GLB
          const scene = gltf.scene;
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          scene.scale.setScalar(scale);
          scene.position.sub(center.multiplyScalar(scale));
          
          setGltfScene(scene);
        }
      },
      undefined,
      (err) => {
        clearTimeout(loadTimeout);
        console.error('Error loading model:', err);
        setError('Error loading model');
      }
    );

    return () => {
      clearTimeout(loadTimeout);
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      }
    };
  }, [modelUrl, modelType]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        faceData.headRotation.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -faceData.headRotation.y,
        0.1
      );
    }

    // VRM specific updates
    if (vrm) {
      vrm.update(delta);
      
      // Apply blendshapes if available
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('aa', faceData.mouthOpen);
        vrm.expressionManager.setValue('blinkLeft', faceData.leftEyeBlink);
        vrm.expressionManager.setValue('blinkRight', faceData.rightEyeBlink);
      }
    }
  });

  if (error) {
    return (
      <Sphere args={[0.5, 16, 16]}>
        <meshStandardMaterial color="#ff4444" wireframe />
      </Sphere>
    );
  }

  return (
    <group ref={groupRef} scale={avatarScale}>
      {vrm && <primitive object={vrm.scene} />}
      {gltfScene && <primitive object={gltfScene} />}
      {!vrm && !gltfScene && (
        <Sphere args={[0.5, 16, 16]}>
          <meshStandardMaterial color="#666" wireframe />
        </Sphere>
      )}
    </group>
  );
};
