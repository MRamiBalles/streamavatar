import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cone, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

export const CatAvatar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);
  
  const { avatarColor, avatarScale, faceData } = useAvatarStore();
  
  useFrame((state) => {
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
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        faceData.headRotation.z,
        0.1
      );
    }
    
    // Tail wag
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.3;
    }
    
    // Ear twitch
    if (leftEarRef.current && rightEarRef.current) {
      const twitch = Math.sin(state.clock.elapsedTime * 5) * 0.05;
      leftEarRef.current.rotation.z = -0.2 + twitch;
      rightEarRef.current.rotation.z = 0.2 - twitch;
    }
    
    if (mouthRef.current) {
      const mouthScale = 0.05 + faceData.mouthOpen * 0.4;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        mouthScale,
        0.2
      );
    }
    
    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        1 - faceData.leftEyeBlink * 0.9,
        0.3
      );
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        1 - faceData.rightEyeBlink * 0.9,
        0.3
      );
    }
  });

  return (
    <group ref={groupRef} scale={avatarScale}>
      {/* Head */}
      <Sphere args={[0.9, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Sphere>
      
      {/* Left ear */}
      <Cone ref={leftEarRef} args={[0.3, 0.5, 4]} position={[-0.5, 0.8, 0]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Cone>
      <Cone args={[0.15, 0.3, 4]} position={[-0.5, 0.75, 0.05]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial color="#ffb6c1" roughness={0.5} />
      </Cone>
      
      {/* Right ear */}
      <Cone ref={rightEarRef} args={[0.3, 0.5, 4]} position={[0.5, 0.8, 0]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color={avatarColor} roughness={0.6} />
      </Cone>
      <Cone args={[0.15, 0.3, 4]} position={[0.5, 0.75, 0.05]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color="#ffb6c1" roughness={0.5} />
      </Cone>
      
      {/* Left eye */}
      <Sphere ref={leftEyeRef} args={[0.18, 16, 16]} position={[-0.3, 0.15, 0.75]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[-0.3, 0.15, 0.88]}>
        <meshStandardMaterial color="#2d2d2d" />
      </Sphere>
      <Sphere args={[0.04, 8, 8]} position={[-0.25, 0.2, 0.95]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </Sphere>
      
      {/* Right eye */}
      <Sphere ref={rightEyeRef} args={[0.18, 16, 16]} position={[0.3, 0.15, 0.75]}>
        <meshStandardMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[0.3, 0.15, 0.88]}>
        <meshStandardMaterial color="#2d2d2d" />
      </Sphere>
      <Sphere args={[0.04, 8, 8]} position={[0.35, 0.2, 0.95]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </Sphere>
      
      {/* Nose */}
      <Sphere args={[0.1, 16, 16]} position={[0, -0.05, 0.85]}>
        <meshStandardMaterial color="#ff69b4" />
      </Sphere>
      
      {/* Mouth */}
      <Sphere ref={mouthRef} args={[0.12, 16, 16]} position={[0, -0.25, 0.8]} scale={[1.2, 0.1, 1]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Sphere>
      
      {/* Whiskers */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, -0.1, 0.8]}>
          <Cylinder args={[0.01, 0.01, 0.4]} rotation={[0, 0, Math.PI / 2 + side * 0.2]} position={[side * 0.2, 0.05, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.35]} rotation={[0, 0, Math.PI / 2]} position={[side * 0.18, 0, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.4]} rotation={[0, 0, Math.PI / 2 - side * 0.2]} position={[side * 0.2, -0.05, 0]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
        </group>
      ))}
      
      {/* Tail */}
      <group ref={tailRef} position={[0, -0.3, -0.8]}>
        <Cylinder args={[0.08, 0.12, 0.8]} rotation={[0.5, 0, 0]} position={[0, 0.2, -0.3]}>
          <meshStandardMaterial color={avatarColor} roughness={0.6} />
        </Cylinder>
        <Sphere args={[0.1, 16, 16]} position={[0, 0.5, -0.6]}>
          <meshStandardMaterial color={avatarColor} roughness={0.6} />
        </Sphere>
      </group>
    </group>
  );
};
