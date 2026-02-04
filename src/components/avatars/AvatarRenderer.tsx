import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
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
  const { customModel } = useAvatarStore();

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
    <Suspense fallback={null}>
      {renderModel()}
    </Suspense>
  );
};

const LoadingFallback = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white font-bold text-xl">{progress.toFixed(0)}%</div>
    </Html>
  );
};

interface AvatarRendererProps {
  isCleanView?: boolean;
}

export const AvatarRenderer = ({ isCleanView = false }: AvatarRendererProps) => {
  const { selectedAvatar, background, graphicsQuality } = useAvatarStore();
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

          {/* AVATAR */}
          <group position={[0, -1, 0]}>
            <AvatarModel type={selectedAvatar} />
          </group>

          {/* CONTACT SHADOWS: Grounding the avatar */}
          {background !== 'splat' && (
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
            <SplatScene url={splatUrl} />
          )}

          {/* POST-PROCESSING PIPELINE (High Quality Only) */}
          {isHighQuality && background !== 'transparent' && background !== 'chroma-green' && background !== 'chroma-blue' && (
            <EffectComposer disableNormalPass>
              {/* Bloom: only very bright things glow */}
              <Bloom
                luminanceThreshold={1.1}
                mipmapBlur
                intensity={0.5}
                radius={0.4}
              />
              {/* Vignette: Cinematic focus */}
              <Vignette
                eskil={false}
                offset={0.1}
                darkness={0.5}
              />
              {/* ToneMapping: Cinematic colors */}
              <ToneMapping
                blendFunction={BlendFunction.NORMAL}
                adaptive={true}
                resolution={256}
                middleGrey={0.6}
                maxLuminance={16.0}
                averageLuminance={1.0}
                adaptationRate={1.0}
              />
            </EffectComposer>
          )}

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
