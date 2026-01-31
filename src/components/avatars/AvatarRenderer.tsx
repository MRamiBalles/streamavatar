import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useAvatarStore, AvatarType } from '@/stores/avatarStore';
import { PillAvatar } from './PillAvatar';
import { BoxyAvatar } from './BoxyAvatar';
import { SphereAvatar } from './SphereAvatar';

const AvatarModel = ({ type }: { type: AvatarType }) => {
  switch (type) {
    case 'pill':
      return <PillAvatar />;
    case 'boxy':
      return <BoxyAvatar />;
    case 'sphere':
      return <SphereAvatar />;
    default:
      return <PillAvatar />;
  }
};

const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[0.5, 16, 16]} />
    <meshStandardMaterial color="#666" wireframe />
  </mesh>
);

interface AvatarRendererProps {
  isCleanView?: boolean;
}

export const AvatarRenderer = ({ isCleanView = false }: AvatarRendererProps) => {
  const { selectedAvatar, background } = useAvatarStore();
  
  const getBackgroundClass = () => {
    switch (background) {
      case 'chroma-green':
        return 'chroma-green';
      case 'chroma-blue':
        return 'chroma-blue';
      case 'transparent':
        return 'bg-transparent';
      default:
        return '';
    }
  };

  return (
    <div className={`canvas-container w-full h-full ${getBackgroundClass()}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ 
          alpha: background === 'transparent',
          antialias: true,
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#a855f7" />
          <pointLight position={[0, -2, 2]} intensity={0.5} color="#ec4899" />
          
          {/* Avatar */}
          <AvatarModel type={selectedAvatar} />
          
          {/* Environment & Shadows */}
          {background === 'dark' && (
            <>
              <Environment preset="city" />
              <ContactShadows 
                position={[0, -1.5, 0]} 
                opacity={0.5} 
                blur={2} 
                far={3}
              />
            </>
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
