import { useEffect, useState, useMemo } from 'react';
import { useGraph } from '@react-three/fiber'; // Correct import for useGraph
import { useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three'; // keep three import
import { useAvatarStore } from '@/stores/avatarStore';
import { useFaceRetargeting } from '@/hooks/useFaceRetargeting';
import { useAudioLipSync } from '@/hooks/useAudioLipSync';

interface VRMAvatarProps {
    url: string;
}

export const VRMAvatar = ({ url }: VRMAvatarProps) => {
    const [vrm, setVrm] = useState<any>(null);
    const { faceData, lipSyncEnabled, audioSensitivity } = useAvatarStore();

    // Initialize Lip Sync
    const lipSync = useAudioLipSync({
        autoStart: lipSyncEnabled,
        intensity: audioSensitivity
    });

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

        // Apply Lip Sync if enabled (overrides face tracking for mouth)
        if (lipSync.isActive) {
            lipSync.applyToVRM(vrm);
        }
    });

    // Use the Retargeting Bridge for expressions (eyes/brows) and rotation
    // Pass 'ignoreMouth: lipSync.isActive' to prevent conflict
    useFaceRetargeting(vrm, { ignoreMouth: lipSync.isActive });

    return <primitive object={gltf.scene} />;
};
