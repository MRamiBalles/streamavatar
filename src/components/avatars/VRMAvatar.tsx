import { useEffect, useState, useMemo } from 'react';
import { useGraph } from '@react-three/fiber'; // Correct import for useGraph
import { useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { useAvatarStore } from '@/stores/avatarStore';

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

    // Animation Loop (Spring Bones & Face Tracking)
    useFrame((state, delta) => {
        if (!vrm) return;

        // 1. Update Physics (Spring Bones)
        // This adds the "secondary motion" to hair and clothes
        vrm.update(delta);

        // 2. Face Retargeting (MediaPipe -> VRM Blendshapes)
        if (vrm.expressionManager) {
            // Blink
            // Map average blink to VRM Blink
            const blinkValue = (faceData.leftEyeBlink + faceData.rightEyeBlink) / 2;
            vrm.expressionManager.setValue('blink', blinkValue);

            // Mouth (Simple mapping for now - will be replaced by Audio2Face later)
            // MediaPipe mouthOpen is roughly 0-1
            vrm.expressionManager.setValue('aa', faceData.mouthOpen);

            // Update expressions
            vrm.expressionManager.update();
        }

        // 3. Head Rotation
        if (vrm.humanoid) {
            const headNode = vrm.humanoid.getNormalizedBoneNode('head');
            if (headNode) {
                // Apply rotation from faceData (which comes from MediaPipe)
                // Note: MediaPipe data needs coordinate system conversion typically
                // e.g., MediaPipe Y is inverted relative to Three.js
                headNode.rotation.set(
                    faceData.headRotation.x,
                    faceData.headRotation.y,
                    faceData.headRotation.z
                );
            }
        }
    });

    return <primitive object={gltf.scene} />;
};
