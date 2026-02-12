import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore, AvatarType } from '@/stores/avatarStore';
import { useFaceTracker } from '@/hooks/useFaceTracker';
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
import { ARPassthrough } from '../scene/ARPassthrough';

// Simple Error Boundary for SplatScene to prevent app crash
class SplatErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("SplatScene crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
        </group>
      );
    }

    return this.props.children;
  }
}

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

const AvatarGroup = ({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const background = useAvatarStore((s) => s.background);
  // We need to access the store directly for per-frame updates without re-renders
  // Necesitamos acceder al store directamente para actualizaciones por frame sin re-renders

  useFrame(() => {
    if (background === 'ar-camera' && groupRef.current) {
      const { faceData } = useAvatarStore.getState();
      if (faceData.headPosition) {

        // Apply head position with smoothing and clamping
        // Aplicar posición con suavizado y límites

        // 1. Scale: Reduced from 12 to 8 for X/Y to keep it closer to center
        //    Z depth reduced from 5 to 2 to prevent getting too close/far
        const scaleX = 8;
        const scaleY = 8;
        const scaleZ = 2;

        const x = Math.max(-2.5, Math.min(2.5, faceData.headPosition.x * scaleX));
        const y = Math.max(-1.5, Math.min(1.5, faceData.headPosition.y * scaleY));
        const z = Math.max(-1.0, Math.min(2.0, faceData.headPosition.z * scaleZ));

        const targetPos = new THREE.Vector3(x, y, z);

        // 2. Smoothing: Reduced lerp factor from 0.5 to 0.15 for smoother movement
        //    Reducción de factor lerp para movimiento más fluido
        groupRef.current.position.lerp(targetPos, 0.15);
      }
    } else if (groupRef.current) {
      // Reset position in other modes
      // Resetear posición en otros modos
      groupRef.current.position.lerp(new THREE.Vector3(0, -1, 0), 0.1);
    }
  });

  return <group ref={groupRef}>{children}</group>;
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

  // AR Camera Logic
  const { startCamera, stopCamera, videoRef } = useFaceTracker();

  useEffect(() => {
    if (background === 'ar-camera') {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => {
      // Only stop if we are unmounting, 
      // but ideally we should only stop if switching away from AR mode.
      // The dependency array handles the switch case.
    };
  }, [background, startCamera, stopCamera]);

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
      case 'ar-camera': // New AR mode
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
          alpha: true, // Always true to let CSS background show through (Chroma, Gradients)
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

          {/* AVATAR with Position Logic */}
          <AvatarGroup>
            <AvatarModel type={selectedAvatar} />
          </AvatarGroup>

          {/* CONTACT SHADOWS: Grounding the avatar (Disable in AR and Splat) */}
          {background !== 'splat' && background !== 'ar-camera' && (
            <ContactShadows
              resolution={1024}
              scale={10}
              blur={2}
              opacity={0.5}
              far={10}
              color="#000000"
            />
          )}




          {/* EXPERIMENTAL: 3D Gaussian Splatting Background */}
          {background === 'splat' && splatUrl && (
            <SplatErrorBoundary>
              <SplatScene url={splatUrl} />
            </SplatErrorBoundary>
          )}

          {/* AR BACKGROUND */}
          {background === 'ar-camera' && <ARPassthrough />}

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

      {/* Hidden video element for Face Tracking */}
      <video
        ref={videoRef}
        className="hidden absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
      />
    </div >
  );
};
