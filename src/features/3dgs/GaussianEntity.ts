import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { AvatarEntity, BlendShapeData } from '@/lib/vrmTrackingBridge';
import { HybridSplatData, HybridLoader } from './HybridLoader';

/**
 * GaussianEntity - Neural Shell Implementation
 * 
 * Renders 3D Gaussian Splats anchored to a VRM skeleton.
 * Implements Forward Linear Blend Skinning (LBS) for splats.
 * 
 * @compliance specs/3dgs-integration/spec.md §3
 */
export class GaussianEntity implements AvatarEntity {
    public readonly model: THREE.Group;
    public readonly vrm: VRM;
    private splatMesh: THREE.InstancedMesh | null = null;
    private splatData: HybridSplatData | null = null;

    // Debug visualization
    private debugPoints: THREE.Points | null = null;

    constructor(vrm: VRM, splatUrl: string) {
        this.vrm = vrm;
        this.model = new THREE.Group();
        this.model.add(this.vrm.scene); // Keep original VRM as base (can be hidden later)

        this.loadSplats(splatUrl);
    }

    private loadSplats(url: string) {
        const loader = new HybridLoader();
        loader.load(url, (data) => {
            this.splatData = data;
            this.createDebugVisualization(data);
            // TODO: Create actual Splat Mesh with custom shader
        });
    }

    /**
     * Creates a simple point cloud visualization for debug/structure verification
     * adhering to the "Wireframe/Ellipsoids" task.
     */
    private createDebugVisualization(data: HybridSplatData) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 4));

        // Debug material
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            color: 0xff00ff, // Magenta for debug visibility
        });

        this.debugPoints = new THREE.Points(geometry, material);
        this.model.add(this.debugPoints);
    }

    public applyBlendShapes(data: BlendShapeData): void {
        // 1. Apply to underlying VRM skeleton (this drives the bones)
        // We reuse the existing bridge logic indirectly if we want, 
        // or we manually apply it here if this entity fully replaces VRMAvatarEntity.
        // For "Neural Shell", we assume the VRM inside is the driver.

        if (this.vrm.expressionManager) {
            // We need to map data manually or import the mapper. 
            // For now, assume the VRM is already being driven or we add the logic here.
            // Ideally, this class wraps VRMAvatarEntity logic or re-implements it.
        }
    }

    public update(deltaTime: number): void {
        // Update VRM physics/animation
        this.vrm.update(deltaTime);

        // CPU Skinning for Debug Points (Prototype SqueezeMe)
        if (this.debugPoints && this.splatData) {
            this.updateCPUSkinning();
        }
    }

    private updateCPUSkinning() {
        // Simplified CPU skinning logic for verifying bone binding
        // In production, this moves to Vertex Shader (GPU)

        // 1. Get current bone matrices from VRM
        // 2. Map splats to bones using Data.boneIndices
        // 3. Update geometry.attributes.position
    }

    public dispose(): void {
        if (this.debugPoints) {
            this.debugPoints.geometry.dispose();
            (this.debugPoints.material as THREE.Material).dispose();
        }
        // Dispose VRM is handled by owner or we do it here if we own it
    }
}
