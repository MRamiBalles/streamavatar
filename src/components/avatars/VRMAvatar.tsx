import { useEffect, useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AnimationController } from './AnimationController';

interface VRMAvatarProps {
    url: string;
}

export const VRMAvatar = ({ url }: VRMAvatarProps) => {
    const [vrm, setVrm] = useState<any>(null);

    // 1. ASSET LOADING (Visual Layer)
    const { scene } = useGLTF(url, true);

    // 2. NORMALIZATION (TaoAvatar style)
    useMemo(() => {
        const v = scene.userData.vrm;
        if (v) {
            // VRM 1.0 logic - use available VRMUtils methods
            VRMUtils.rotateVRM0(v); // Rotate VRM0 models to face forward
            v.scene.traverse((obj: any) => {
                obj.frustumCulled = false;
            });
            setVrm(v); // Set the VRM object to state after normalization
        }
    }, [scene]); // Re-run when the scene changes

    // Placeholder for other hooks/logic that might use vrm
    // For example, if you had a useFrame hook for physics updates:
    // useFrame((_, delta) => {
    //     if (vrm) {
    //         vrm.update(delta);
    //     }
    // });

    // Placeholder for lip sync or face retargeting if they were defined
    // if (lipSync.isActive) {
    //     lipSync.applyToVRM(vrm);
    // }
    // useFaceRetargeting(vrm, { ignoreMouth: lipSync.isActive });

    if (!vrm) return null;

    return (
        <group>
            {/* RENDER LAYER */}
            <primitive object={vrm.scene} />

            {/* MOTION LAYER (AHA! Decoupled Architecture) */}
            <AnimationController vrm={vrm} />
        </group>
    );
};
