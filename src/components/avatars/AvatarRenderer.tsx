import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { useAvatarStore, AvatarType } from '@/stores/avatarStore';
import { PillAvatar } from './PillAvatar';
import { BoxyAvatar } from './BoxyAvatar';
import { SphereAvatar } from './SphereAvatar';
import { CatAvatar } from './CatAvatar';
import { GhostAvatar } from './GhostAvatar';
import { EmojiAvatar } from './EmojiAvatar';
import { CustomModelAvatar } from './CustomModelAvatar';
import { CompositeAvatar } from './CompositeAvatar';
import { VRMAvatar } from './VRMAvatar';
import { SplatScene } from '../scene/SplatScene';

const AvatarModel = ({ type }: { type: AvatarType }) => {
  const customModel = useAvatarStore((s) => s.customModel);

  // Unified rendering logic: 
  // Primitives are treated as separate components for now, 
  // but they all live within the same global transformation group.
  const renderModel = () => {
    switch (type) {
      case 'pill': return <PillAvatar />;
      case 'boxy': return <BoxyAvatar />;
      case 'sphere': return <SphereAvatar />;
      case 'cat': return <CatAvatar />;
      case 'ghost': return <GhostAvatar />;
      case 'emoji': return <EmojiAvatar />;
      case 'composite': return <CompositeAvatar />;
      case 'custom':
        if (customModel) {
          if (customModel.type === 'vrm' || customModel.url.endsWith('.vrm')) {
            return <VRMAvatar url={customModel.url} />;
          }
          return <CustomModelAvatar modelUrl={customModel.url} modelType={customModel.type} />;
        }
        return <PillAvatar />;
      default: return <PillAvatar />;
    }
  };

  return (
    <group>
      <Suspense fallback={null}>
        {renderModel()}
      </Suspense>
    </group>
  );
};

const LoadingFallback = () => {
  const { progress } = useProgress();
  return (
    <group>
      <Html center>
        <div className="text-white font-bold text-xl">{progress.toFixed(0)}%</div>
      </Html>
    </group>
  );
};

interface AvatarRendererProps {
  isCleanView?: boolean;
}

export const AvatarRenderer = ({ isCleanView = false }: AvatarRendererProps) => {
  const selectedAvatar = useAvatarStore((s) => s.selectedAvatar);
  const background = useAvatarStore((s) => s.background);
  const graphicsQuality = useAvatarStore((s) => s.graphicsQuality);
  const isHighQuality = graphicsQuality === 'high';

  // Experimental: Hardcoded Splat URL for demo
  // Memory optimization: Only defined when active to avoid pre-fetching in some loaders
  const splatUrl = background === 'splat' ? "https://antimatter15.com/splat/nike.splat" : null;

  const getBackgroundClass = () => {
    switch (background) {
      case 'chroma-green':
        return 'chroma-green';
      case 'chroma-blue':
        return 'chroma-blue';
      case 'transparent':
        return 'bg-transparent';
      case 'splat': // New experimental mode
        return 'bg-black';
      default:
        // Improved gradient background
        return 'bg-gradient-to-b from-gray-900 to-gray-800';
    }
  };

  return (
    <div className={`canvas-container w-full h-full ${getBackgroundClass()}`}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{
          alpha: background === 'transparent',
          antialias: !isHighQuality, // Let EffectComposer handle AA in HQ mode
          preserveDrawingBuffer: true,
          toneMappingExposure: 1.2,
        }}
        dpr={window.devicePixelRatio}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* BASE LIGHTING: Studio setup */}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[5, 10, 5]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#a855f7" />

          {/* IBL: Realistic reflections */}
          <Environment preset="city" />

          import {ARPassthrough} from '../scene/ARPassthrough';
          import {useTrackingStore} from '@/stores/slices/trackingSlice';
          import {useFrame} from '@react-three/fiber';
          import {useRef} from 'react';
          import * as THREE from 'three';

          // ... (existing imports)

          const AvatarGroup = ({children}: {children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const background = useAvatarStore((s) => s.background);
  // We need to access the store directly for per-frame updates without re-renders
  // Necesitamos acceder al store directamente para actualizaciones por frame sin re-renders

  useFrame(() => {
    if (background === 'ar-camera' && groupRef.current) {
       const {faceData} = useTrackingStore.getState();
            if (faceData.headPosition) {
              // Apply head position with smoothing
              // Aplicar posición de la cabeza con suavizado
              groupRef.current.position.lerp(new THREE.Vector3(
                faceData.headPosition.x,
                faceData.headPosition.y,
                faceData.headPosition.z
              ), 0.5);
       }
    } else if (groupRef.current) {
              // Reset position in other modes
              // Resetear posición en otros modos
              groupRef.current.position.lerp(new THREE.Vector3(0, -1, 0), 0.1);
    }
  });

            return <group ref={groupRef}>{children}</group>;
};

            // ... (existing components)

            export const AvatarRenderer = ({isCleanView = false}: AvatarRendererProps) => {
  // ... (existing state)

  const getBackgroundClass = () => {
    switch (background) {
      // ... (existing cases)
      case 'ar-camera': // New AR mode
            return 'bg-black';
            default:
            return 'bg-gradient-to-b from-gray-900 to-gray-800';
    }
  };

            return (
            <div className={`canvas-container w-full h-full ${getBackgroundClass()}`}>
              <Canvas
              // ... (existing props)
              >
                <Suspense fallback={<LoadingFallback />}>
                  {/* ... (lights and environment) */}

                  {/* AVATAR with Position Logic */}
                  <AvatarGroup>
                    <AvatarModel type={selectedAvatar} />
                  </AvatarGroup>

                  {/* CONTACT SHADOWS: Grounding the avatar (Disable in AR) */}
                  {background !== 'splat' && background !== 'ar-camera' && (
                    <ContactShadows
                    // ...
                    />
                  )}

                  {/* AR BACKGROUND */}
                  {background === 'ar-camera' && <ARPassthrough />}

                  {/* ... */}



                  {/* Controls - only in non-clean view */}
                  {!isCleanView && (
                    <OrbitControls
                      enablePan={false}
                      enableZoom={true}
                      minDistance={2}
                      maxDistance={8}
                      minPolarAngle={Math.PI / 4}
                      maxPolarAngle={Math.PI / 1.5}
                    />
                  )}
                </Suspense>
              </Canvas>
            </div>
            );
};
