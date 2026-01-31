import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useAvatarStore } from '@/stores/avatarStore';

interface CustomModelAvatarProps {
  modelUrl: string;
  modelType: 'glb' | 'vrm';
}

export const CustomModelAvatar = ({ modelUrl, modelType }: CustomModelAvatarProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { avatarScale, faceData } = useAvatarStore();

  useEffect(() => {
    const loader = new GLTFLoader();
    
    if (modelType === 'vrm') {
      loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    loader.load(
      modelUrl,
      (gltf) => {
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
        console.error('Error loading model:', err);
        setError('Error al cargar el modelo');
      }
    );

    return () => {
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
