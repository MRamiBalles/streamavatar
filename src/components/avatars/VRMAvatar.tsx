import { useEffect, useState, useMemo } from 'react';
import { useGraph } from '@react-three/fiber'; // Correct import for useGraph
import { useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three'; // keep three import
import { useAvatarStore } from '@/stores/avatarStore';
import { useFaceRetargeting } from '@/hooks/useFaceRetargeting';

interface VRMAvatarProps {
    url: string;
}

export const VRMAvatar = ({ url }: VRMAvatarProps) => {
    const [vrm, setVrm] = useState<any>(null);
    const { faceData } = useAvatarStore();

    // Custom loader to register the VRM plugin
    const gltf = useLoader(GLTFLoader, url, (loader) => {
        loader.register((parser) => {
            return new VRMLoaderPlugin(parser);
        });
    });

    // Initialize VRM
    useEffect(() => {
        if (!gltf) return;

        const vrmData = (gltf as any).userData.vrm;

        // VRMUtils helps to rotate the model to face forward (VRM standard is +Z, Three.js is +Z but imported models often vary)
        VRMUtils.rotateVRM0(vrmData);

        setVrm(vrmData);

        console.log("VRM Model Loaded:", vrmData);
    }, [gltf]);

    // Animation Loop (Spring Bones)
    useFrame((state, delta) => {
        if (!vrm) return;

        // Update Physics (Spring Bones)
        vrm.update(delta);
    });

    // Use the Retargeting Bridge for expressions and rotation
    useFaceRetargeting(vrm);

    return <primitive object={gltf.scene} />;
};
