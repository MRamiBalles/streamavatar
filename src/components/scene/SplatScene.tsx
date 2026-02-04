import { Splat } from '@react-three/drei';
import { useState } from 'react';

interface SplatSceneProps {
    url: string;
}

export const SplatScene = ({ url }: SplatSceneProps) => {
    // Center the splat and push it back slightly to act as a background
    // 3DGS often come in arbitrary scales/rotations, so we might need controls later.
    return (
        <group position={[0, -1, -2]} rotation={[0, 0, 0]}>
            <Splat
                src={url}
                scale={1}
                position={[0, 1, 0]}
            />
        </group>
    );
};
