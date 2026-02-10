import * as THREE from 'three';

export const splatVertexShader = `
precision highp float;

attribute vec3 localPosition; // From InstancedMesh instanceMatrix or normalized geometry
attribute vec3 center;
attribute vec4 color;
attribute vec4 rotation;
attribute vec3 scale;

uniform vec2 resolution;
uniform vec2 focal;

varying vec4 vColor;
varying vec2 vPosition;
varying vec3 vConic;

void main() {
    // Standard Quad Geometry usually (-0.5, 0.5) or (-1, 1). 
    // ThreeJS PlaneGeometry(1,1) is (-0.5, -0.5) to (0.5, 0.5).
    // Let's assume standard PlaneGeometry(1,1).
    vec2 quadPos = position.xy * 2.0; // Map to [-1, 1]

    // 1. Transform Center to View Space
    vec4 camSpacePos = modelViewMatrix * vec4(center, 1.0);
    
    // 2. Compute 3D Covariance
    float x = rotation.x; float y = rotation.y; float z = rotation.z; float w = rotation.w;
    mat3 R = mat3(
        1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y - z * w), 2.0 * (x * z + y * w),
        2.0 * (x * y + z * w), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z - x * w),
        2.0 * (x * z - y * w), 2.0 * (y * z + x * w), 1.0 - 2.0 * (x * x + y * y)
    );
    mat3 S = mat3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
    mat3 M = R * S;
    mat3 Sigma = M * transpose(M); // 3D Covariance
    
    // 3. Transform Covariance to View Space
    // Sigma' = J * W * Sigma * W^T * J^T
    mat3 W = mat3(modelViewMatrix);
    mat3 Sigma_view = W * Sigma * transpose(W);
    
    // 4. Project to 2D (Cov2D = J * Sigma_view * J^T)
    // Jacobian components
    float fX = focal.x;
    float fY = focal.y;
    float Z = camSpacePos.z; // usually negative
    // We normalize Z scaling relative to focal length
    // J = [ f/z  0  x/z ]... 
    // Simplified approx often used:
    
    // Limiting Z to avoid division by zero
    float z_clamped = min(Z, -0.1); // Camera looks down -Z
    float txtz = 1.0 / z_clamped;
    float txtz2 = txtz * txtz;
    
    // Approx J (ignoring the perspective distortion of the Gaussian center itself for now)
    // A proper EWA J includes the x/z term.
    float X = camSpacePos.x;
    float Y = camSpacePos.y;
    
    float J00 = fX * txtz;
    float J02 = -(fX * X) * txtz2;
    float J11 = fY * txtz;
    float J12 = -(fY * Y) * txtz2;
    
    // Cov2D calculation
    float S00 = Sigma_view[0][0]; float S01 = Sigma_view[0][1]; float S02 = Sigma_view[0][2];
    float S11 = Sigma_view[1][1]; float S12 = Sigma_view[1][2];
    float S22 = Sigma_view[2][2];
    
    float cov00 = S00*J00*J00 + 2.0*S02*J00*J02 + S22*J02*J02;
    float cov01 = S01*J00*J11 + S02*J00*J12 + S12*J02*J11 + S22*J02*J12;
    float cov11 = S11*J11*J11 + 2.0*S12*J11*J12 + S22*J12*J12;
    
    // Low-pass filter (size limits)
    cov00 += 0.3;
    cov11 += 0.3;
    
    // 5. Compute Inverse Covariance (Conic Form) for Fragment Shader
    float det = cov00 * cov11 - cov01 * cov01;
    if (det <= 0.0) det = 0.0001; // Avoid singularities
    float detInv = 1.0 / det;
    
    vConic = vec3(cov11 * detInv, -cov01 * detInv, cov00 * detInv);
    
    // 6. Compute Screen Space Bounding Box / Radius
    float mid = 0.5 * (cov00 + cov11);
    float lambda = mid + sqrt(max(0.1, mid * mid - det));
    float radius = 3.0 * sqrt(lambda); // 3 sigma coverage
    
    // 7. Compute Final Position
    vec2 offset = quadPos * radius;
    
    // vPosition is the offset in pixels/screen-units
    vPosition = offset;
    vColor = color;
    
    // Project Center
    gl_Position = projectionMatrix * camSpacePos;
    
    // Apply Offset in NDC (Normalized Device Coordinates)
    // offset is in pixels essentially? scaling by 2/resolution converts to NDC [-1, 1]
    gl_Position.xy += offset * gl_Position.w * (2.0 / resolution);
}
`;

export const splatFragmentShader = `
precision highp float;

varying vec4 vColor;
varying vec2 vPosition;
varying vec3 vConic;

void main() {
    // 1. Calculate Mahalanobis Distance (Power)
    // P(v) = -0.5 * (trans(v) * Conic * v)
    // v = vPosition (offset from center)
    // Conic = [A B; B C]  (Packed as vConic.x, vConic.y, vConic.z)
    
    float d = -0.5 * (vConic.x * vPosition.x * vPosition.x + 
                      vConic.z * vPosition.y * vPosition.y) + 
              -1.0 * (vConic.y * vPosition.x * vPosition.y); // using 1.0 since it's 2*B*xy * 0.5
              
    if (d > 0.0) discard; // Should be negative
    
    // 2. Evaluate Gaussian
    float alpha = exp(d);
    if (alpha < 0.01) discard; // Cull low alpha
    
    // 3. Output
    // Standard Alpha Blending expects Pre-multiplied or not depending on BlendFunc.
    // ThreeJS 'NormalBlending': srcAlpha, oneMinusSrcAlpha.
    // gl_FragColor = vec4(vColor.rgb * alpha, alpha); // Premult?
    // Let's use standard RGB + Alpha and let GL blend.
    
    gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
}
`;

