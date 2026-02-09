/* eslint-disable no-restricted-globals */
// Worker for sorting Gaussians by depth

// Input messages
type WorkerMessage = {
    type: 'sort';
    positions: Float32Array; // Shared buffer ideally
    viewProj: Float32Array; // Matrix
    vertexCount: number;
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, positions, viewProj, vertexCount } = e.data;

    if (type === 'sort') {
        const indices = new Uint32Array(vertexCount);
        const depths = new Float32Array(vertexCount);

        // 1. Compute depths
        // Assuming viewProj is 4x4, but usually sorting is done in View Space (View Matrix only)
        // Let's assume passed matrix is View Matrix for depth calc
        // transform Z: view[2]*x + view[6]*y + view[10]*z + view[14]

        for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            // Simple dot product with forward vector of camera (extracted from view matrix)
            // Or full transform.
            // Simplified: depth = -(v[2]*x + v[6]*y + v[10]*z + v[14])
            // Note: indices 2, 6, 10 are the 3rd row (0-indexed) of column-major matrix?
            // ThreeJS matrices are column-major.
            // 3rd row (Z-row) elements are at indices 2, 6, 10, 14.

            depths[i] = -(viewProj[2] * x + viewProj[6] * y + viewProj[10] * z + viewProj[14]);
        }

        // 2. Sort indices
        // Using JS sort for simplicity in V1 - optimize later with Radix/Counting sort
        indices.sort((a, b) => {
            const depthA = depths[a];
            const depthB = depths[b];
            return depthA - depthB; // Back-to-front for transparency usually requires Farthest first?
            // Alpha blending back-to-front: Draw farthest first.
            // So higher depth (more negative? or positive distance?)
            // Camera looks down -Z. Depth usually negative in View Space.
            // If distance, we want descending sort (Largest distance first).
        });

        // 3. Post back
        self.postMessage({
            type: 'sorted',
            indices,
        }, [indices.buffer] as any); // Transferable
    }
};

export { };
