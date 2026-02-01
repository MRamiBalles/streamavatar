/**
 * Model Normalizer
 * 
 * Handles automatic normalization of imported 3D models (VRM/GLB).
 * Solves common import issues like:
 * - Incorrect scale (models too big/small)
 * - Wrong rotation (Z-up vs Y-up coordinate systems)
 * - Off-center models (not at origin)
 * 
 * @author Manuel Ramírez Ballesteros
 * @license MIT
 */

import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

// =============================================================================
// Constants
// =============================================================================

/**
 * Target height for avatars (in Three.js units)
 * VRM spec recommends ~1.7 units for humanoid height
 */
const TARGET_HEIGHT = 2.0;

/**
 * Threshold for detecting Z-up coordinate system
 * If model's up axis differs significantly from Y-up, we rotate
 */
const Z_UP_THRESHOLD = 0.5;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Computes the bounding box of a 3D object including all children
 */
function computeBoundingBox(object: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3();

    object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
            child.geometry.computeBoundingBox();
            if (child.geometry.boundingBox) {
                const childBox = child.geometry.boundingBox.clone();
                childBox.applyMatrix4(child.matrixWorld);
                box.union(childBox);
            }
        }
    });

    return box;
}

/**
 * Detects if a model uses Z-up coordinate system (common in Blender exports)
 * by checking if the model extends more in Z than Y
 */
function isZUpModel(object: THREE.Object3D): boolean {
    const box = computeBoundingBox(object);
    const size = box.getSize(new THREE.Vector3());

    // If Z dimension is significantly larger than Y, likely Z-up
    return size.z > size.y * Z_UP_THRESHOLD;
}

/**
 * Gets the height of a VRM model using humanoid bones if available
 */
function getVRMHeight(vrm: VRM): number | null {
    const humanoid = vrm.humanoid;
    if (!humanoid) return null;

    // Try to get height from head bone
    const head = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
    const hips = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Hips);

    if (head && hips) {
        const headPos = new THREE.Vector3();
        const hipsPos = new THREE.Vector3();
        head.getWorldPosition(headPos);
        hips.getWorldPosition(hipsPos);

        // Approximate full height (head to feet is roughly 1.5x head-to-hips)
        return Math.abs(headPos.y - hipsPos.y) * 2;
    }

    return null;
}

// =============================================================================
// Main Normalizer
// =============================================================================

export interface NormalizationResult {
    /** Whether any changes were made */
    modified: boolean;
    /** Applied scale factor */
    scaleFactor: number;
    /** Applied rotation (if Z-up detected) */
    rotationApplied: boolean;
    /** Center offset applied */
    centerOffset: THREE.Vector3;
    /** Original model dimensions */
    originalSize: THREE.Vector3;
    /** Final model dimensions */
    finalSize: THREE.Vector3;
}

/**
 * Normalizes a generic 3D model (GLB/GLTF)
 * - Centers at origin
 * - Scales to TARGET_HEIGHT
 * - Fixes Z-up rotation if detected
 */
export function normalizeModel(model: THREE.Object3D): NormalizationResult {
    const result: NormalizationResult = {
        modified: false,
        scaleFactor: 1,
        rotationApplied: false,
        centerOffset: new THREE.Vector3(),
        originalSize: new THREE.Vector3(),
        finalSize: new THREE.Vector3(),
    };

    // Update world matrices before measuring
    model.updateWorldMatrix(true, true);

    // Get original bounding box
    const originalBox = computeBoundingBox(model);
    result.originalSize = originalBox.getSize(new THREE.Vector3());

    // Check for Z-up coordinate system
    if (isZUpModel(model)) {
        model.rotation.x = -Math.PI / 2;
        model.updateWorldMatrix(true, true);
        result.rotationApplied = true;
        result.modified = true;
    }

    // Recalculate after rotation
    const box = computeBoundingBox(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center the model at origin (moved by Y to put feet at 0)
    const bottomY = box.min.y;
    result.centerOffset.set(-center.x, -bottomY, -center.z);
    model.position.add(result.centerOffset);
    result.modified = true;

    // Scale to target height
    const currentHeight = size.y;
    if (currentHeight > 0.01) {
        result.scaleFactor = TARGET_HEIGHT / currentHeight;
        model.scale.multiplyScalar(result.scaleFactor);
        result.modified = true;
    }

    // Calculate final size
    model.updateWorldMatrix(true, true);
    const finalBox = computeBoundingBox(model);
    result.finalSize = finalBox.getSize(new THREE.Vector3());

    return result;
}

/**
 * Normalizes a VRM model using humanoid bone information
 * VRM models have standardized bone structure so we can be more precise
 */
export function normalizeVRM(vrm: VRM): NormalizationResult {
    const scene = vrm.scene;

    const result: NormalizationResult = {
        modified: false,
        scaleFactor: 1,
        rotationApplied: false,
        centerOffset: new THREE.Vector3(),
        originalSize: new THREE.Vector3(),
        finalSize: new THREE.Vector3(),
    };

    // Update matrices
    scene.updateWorldMatrix(true, true);

    // Get original bounds
    const originalBox = computeBoundingBox(scene);
    result.originalSize = originalBox.getSize(new THREE.Vector3());

    // VRM models should always be Y-up, but check anyway
    if (isZUpModel(scene)) {
        scene.rotation.x = -Math.PI / 2;
        scene.updateWorldMatrix(true, true);
        result.rotationApplied = true;
        result.modified = true;
        console.warn('[ModelNormalizer] VRM with Z-up detected, this is unusual');
    }

    // Use humanoid bone height if available
    const vrmHeight = getVRMHeight(vrm);
    const box = computeBoundingBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center horizontally, put feet at Y=0
    const bottomY = box.min.y;
    result.centerOffset.set(-center.x, -bottomY, -center.z);
    scene.position.add(result.centerOffset);
    result.modified = true;

    // Scale to target height
    const currentHeight = vrmHeight ?? size.y;
    if (currentHeight > 0.01) {
        result.scaleFactor = TARGET_HEIGHT / currentHeight;
        scene.scale.multiplyScalar(result.scaleFactor);
        result.modified = true;
    }

    // Final size
    scene.updateWorldMatrix(true, true);
    const finalBox = computeBoundingBox(scene);
    result.finalSize = finalBox.getSize(new THREE.Vector3());

    return result;
}

/**
 * Logs normalization results in a human-readable format
 */
export function logNormalization(result: NormalizationResult, modelName: string): void {
    console.group(`[ModelNormalizer] ${modelName}`);
    console.log('Modified:', result.modified);
    console.log('Scale factor:', result.scaleFactor.toFixed(3));
    console.log('Rotation fix (Z-up):', result.rotationApplied);
    console.log('Original size:',
        `${result.originalSize.x.toFixed(2)} x ${result.originalSize.y.toFixed(2)} x ${result.originalSize.z.toFixed(2)}`);
    console.log('Final size:',
        `${result.finalSize.x.toFixed(2)} x ${result.finalSize.y.toFixed(2)} x ${result.finalSize.z.toFixed(2)}`);
    console.groupEnd();
}
