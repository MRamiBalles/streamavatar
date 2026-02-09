export const splatVertexShader = `
precision highp float;

attribute vec3 localPosition; // From InstancedMesh instanceMatrix or separate attribute? 
// Actually for InstancedMesh standard usage in Three, we might use attributes directly.
// But 3DGS usually uses a single quad geometry + instanced attributes.

// Splat Attributes
attribute vec3 center;
attribute vec4 color;
attribute vec4 rotation; // Quaternion
attribute vec3 scale;

// Per-instance skinning (Hybrid Neural Shell) idea:
// attribute vec4 skinIndex;
// attribute vec4 skinWeight;
// uniform mat4 boneMatrices[64];

varying vec4 vColor;
varying vec2 vPosition;

void main() {
    vColor = color;
    vPosition = position.xy; // Quad is typicaly (-1,-1) to (1,1)

    // 1. Compute Rotation Matrix from Quaternion
    float x = rotation.x; float y = rotation.y; float z = rotation.z; float w = rotation.w;
    mat3 R = mat3(
        1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y - z * w), 2.0 * (x * z + y * w),
        2.0 * (x * y + z * w), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z - x * w),
        2.0 * (x * z - y * w), 2.0 * (y * z + x * w), 1.0 - 2.0 * (x * x + y * y)
    );

    // 2. Compute Scale Matrix
    mat3 S = mat3(
        scale.x, 0.0, 0.0,
        0.0, scale.y, 0.0,
        0.0, 0.0, scale.z
    );

    // 3. Compute 3D Covariance Matrix Sigma = R * S * S' * R'
    mat3 M = R * S;
    mat3 Sigma = M * transpose(M);

    // 4. Project 3D Covariance to 2D Screen Space (EWA Splatting)
    // J = Jacobian of projective transformation
    vec4 camSpacePos = modelViewMatrix * vec4(center, 1.0);
    float t = length(camSpacePos.xyz); // Distance roughly
    
    // Simple approx Jacobian for perspective
    // This is a simplified version of the standard EWA projection
    // For full implementation we need the exact math from 3DGS paper
    // Keeping it simple for the prototype shader
    
    // Using standard 3DGS projection formulation (approximated for prototype)
    float focalX = projectionMatrix[0][0] * 0.5 * 1024.0; // obscure generic viewport
    float focalY = projectionMatrix[1][1] * 0.5 * 768.0; 
    
    // ... skipping complex J matrix construction for brevity in this initial file ...
    // We will assume a billboard for now to verify pipeline, 
    // real 3DGS shader math is complex to write from scratch without a library.
    
    // BILLBOARD FALLBACK FOR PROTOTYPE VERIFICATION
    vec3 cp_right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 cp_up    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    
    vec3 worldPos = center + (cp_right * position.x * scale.x + cp_up * position.y * scale.y);
    
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}
`;

export const splatFragmentShader = `
precision highp float;

varying vec4 vColor;
varying vec2 vPosition;

void main() {
    // Gaussian falloff
    float A = -dot(vPosition, vPosition);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    
    gl_FragColor = vec4(vColor.rgb, B);
}
`;
