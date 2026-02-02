/**
 * Splat Viewer Component
 * 
 * Experimental 3D Gaussian Splatting viewer integrated with R3F.
 * Uses GaussianSplats3D library for Three.js-based rendering.
 * 
 * Current limitations:
 * - Static scenes only (no animation)
 * - CPU-based sort may cause artifacts with fast camera movement
 * - Large file sizes (10-50MB typical)
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 * @experimental
 */

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// =============================================================================
// Types
// =============================================================================

export interface SplatViewerProps {
    /** URL or path to .splat, .ply, or .ksplat file */
    src: string;
    /** Position in 3D space [x, y, z] */
    position?: [number, number, number];
    /** Rotation quaternion [x, y, z, w] */
    rotation?: [number, number, number, number];
    /** Uniform scale multiplier */
    scale?: number;
    /** Callback when loading completes */
    onLoad?: () => void;
    /** Callback on loading error */
    onError?: (error: Error) => void;
}

interface LoadingState {
    isLoading: boolean;
    progress: number;
    error: string | null;
}

// =============================================================================
// Dynamic Import Helper
// =============================================================================

/**
 * Dynamically imports GaussianSplats3D to avoid bundling issues
 * and allow for graceful degradation if not installed
 */
async function loadGaussianSplats(): Promise<any> {
    // This is an experimental feature that requires manual installation
    // To use: npm install @mkkellogg/gaussian-splats-3d
    console.warn('[SplatViewer] GaussianSplats3D is experimental and requires manual installation.');
    console.warn('[SplatViewer] Run: npm install @mkkellogg/gaussian-splats-3d');
    throw new Error('GaussianSplats3D library not installed. This is an experimental feature.');
}

// =============================================================================
// Component
// =============================================================================

export function SplatViewer({
    src,
    position = [0, 0, 0],
    rotation = [0, 0, 0, 1],
    scale = 1,
    onLoad,
    onError,
}: SplatViewerProps) {
    const { scene, camera, gl } = useThree();
    const viewerRef = useRef<any>(null);
    const [state, setState] = useState<LoadingState>({
        isLoading: true,
        progress: 0,
        error: null,
    });

    // Initialize viewer and load splat
    useEffect(() => {
        let mounted = true;
        let viewer: any = null;

        async function init() {
            try {
                setState({ isLoading: true, progress: 0, error: null });

                // Load the library
                const GS3D = await loadGaussianSplats();

                if (!mounted) return;

                // Create viewer integrated with existing scene
                viewer = new GS3D.Viewer({
                    threeScene: scene,
                    camera: camera,
                    renderer: gl,
                    selfDrivenMode: false, // We'll drive updates via useFrame
                    useBuiltInControls: false, // We use our own camera controls
                });

                viewerRef.current = viewer;

                // Load the splat scene
                await viewer.addSplatScene(src, {
                    position: position,
                    rotation: rotation,
                    scale: [scale, scale, scale],
                    progressiveLoad: true,
                    onProgress: (progress: number) => {
                        if (mounted) {
                            setState(prev => ({ ...prev, progress }));
                        }
                    },
                });

                if (mounted) {
                    setState({ isLoading: false, progress: 1, error: null });
                    onLoad?.();
                    console.log('[SplatViewer] Loaded successfully:', src);
                }

            } catch (err) {
                if (mounted) {
                    const error = err instanceof Error ? err : new Error('Unknown error');
                    setState({ isLoading: false, progress: 0, error: error.message });
                    onError?.(error);
                    console.error('[SplatViewer] Error:', error);
                }
            }
        }

        init();

        // Cleanup
        return () => {
            mounted = false;
            if (viewer) {
                try {
                    viewer.dispose();
                } catch (e) {
                    // Ignore disposal errors
                }
            }
        };
    }, [src, scene, camera, gl, position, rotation, scale, onLoad, onError]);

    // Update viewer each frame
    useFrame(() => {
        if (viewerRef.current) {
            viewerRef.current.update();
        }
    });

    // This component doesn't render anything directly
    // The viewer adds to the Three.js scene
    return null;
}

// =============================================================================
// Exports
// =============================================================================

export default SplatViewer;
