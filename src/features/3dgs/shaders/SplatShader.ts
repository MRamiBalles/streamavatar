import * as THREE from 'three';

export const splatVertexShader = `
precision highp float;

attribute vec3 center;
attribute vec4 color;
attribute vec4 rotation; // Quaternion
attribute vec3 scale;

uniform vec2 resolution;
uniform vec2 focal;

varying vec4 vColor;
varying vec2 vPosition;

void main() {
    // 1. Setup Center Position in Camera Space
    vec4 camSpacePos = modelViewMatrix * vec4(center, 1.0);
    gl_Position = projectionMatrix * camSpacePos;

    // 2. Vertex Culling (Behind camera)
    // Note: W=Z in standard projection, so we check if Z is positive (behind) or small
    // But gl_Position.w is typically -z (view space z is negative).
    // Let's just trust standard clipping or add a check.

    // 3. Compute 3D Covariance Matrix Sigma
    // R = Rotation Matrix from Quaternion
    float x = rotation.x; float y = rotation.y; float z = rotation.z; float w = rotation.w;
    mat3 R = mat3(
        1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y - z * w), 2.0 * (x * z + y * w),
        2.0 * (x * y + z * w), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z - x * w),
        2.0 * (x * z - y * w), 2.0 * (y * z + x * w), 1.0 - 2.0 * (x * x + y * y)
    );

    // S = Scale Matrix
    mat3 S = mat3(
        scale.x, 0.0, 0.0,
        0.0, scale.y, 0.0,
        0.0, 0.0, scale.z
    );

    // M = R * S
    mat3 M = R * S;
    
    // Sigma = M * M^T (3D Covariance)
    mat3 Sigma = M * transpose(M);

    // 4. Project 3D Covariance to 2D (EWA Splatting)
    // J = Jacobian of Projective Transformation
    // We approximate around the content center 'camSpacePos'
    
    // View Space Covariance: W * Sigma * W^T
    // We need the rotation part of the View Matrix. 
    // Three.js modelViewMatrix contains Model * View. 
    // Assuming 'center' is in Local Space, modelViewMatrix handles Local -> View.
    // So we need the upper 3x3 of modelViewMatrix to transform the Covariance direction.
    
    mat3 W = mat3(modelViewMatrix); 
    mat3 Sigma_prime = W * Sigma * transpose(W); // Covariance in View Space

    // Jacobian Approximation
    // J = [ f_x/z   0     -x*f_x/z^2 ]
    //     [ 0     f_y/z   -y*f_y/z^2 ]
    //     [ 0       0         0      ]  (We only care about 2D part)
    
    float fX = focal.x;
    float fY = focal.y;
    float Z = camSpacePos.z; // View space Z is negative?
    // In Three.js, camera looks down -Z. So camSpacePos.z is negative.
    // Distance d = -Z? Or just use Z.
    // Let's stick to the papers: 
    // The paper usually assumes Z > 0 (looking down Z).
    // If Z < 0, we flip signs or take Abs. Square implies sign cancels in denominator, but numerator matches.
    // Let's use Z directly.
    
    float invZ = 1.0 / Z;
    float invZ2 = invZ * invZ;
    float X = camSpacePos.x;
    float Y = camSpacePos.y;
    
    // Since we are splatting a 2D primitive, we construct a 2D covariance directly.
    // Cov2D = J * Sigma_prime * J^T
    // Taking the top-left 2x2 of the result.
    
    // Optimized J * Sigma * J^T calculation from standard implementations:
    // https://github.com/antimatter15/splat/blob/main/main.js#L466
    
    // Let's perform full matrix mul for clarity in this prototype shader.
    // mat3 J = mat3(
    //     fX * invZ, 0.0, -(X * fX) * invZ2,
    //     0.0, fY * invZ, -(Y * fY) * invZ2,
    //     0.0, 0.0, 0.0
    // );
    
    // Reduced 2x3 Jacobian (since z-row is 0 for screen projection)
    // J_2d = [ J00 0 J02 ]
    //        [ 0 J11 J12 ]
    
    float J00 = fX * invZ;
    float J02 = -(fX * X) * invZ2;
    float J11 = fY * invZ;
    float J12 = -(fY * Y) * invZ2;
    
    // Sigma_prime elements
    float S00 = Sigma_prime[0][0]; float S01 = Sigma_prime[0][1]; float S02 = Sigma_prime[0][2];
    float S10 = Sigma_prime[1][0]; float S11 = Sigma_prime[1][1]; float S12 = Sigma_prime[1][2];
    float S20 = Sigma_prime[2][0]; float S21 = Sigma_prime[2][1]; float S22 = Sigma_prime[2][2];

    // Compute 2D Covariance Matrix Cov2D = J * Sigma_prime * J^T
    // Result is 2x2 symmetric matrix: [ cov00 cov01 ]
    //                                 [ cov01 cov11 ]
    
    float cov00 = J00 * (S00 * J00 + S02 * J02) + J02 * (S20 * J00 + S22 * J02);
    // Actually S is symmetric, S02=S20
    // Simplified:
    // Term1 = S00*J00 + S02*J02
    // Term2 = S10*J00 + S12*J02
    // Term3 = S20*J00 + S22*J02
    // cov00 = J00*Term1 + J02*Term3
    // cov01 = J00*(S01*J11 + S02*J12) + J02*(S21*J11 + S22*J12)
    // ... this is error prone to write manually.
    
    // Let's use the explicit formulas:
    // cov00 = S00*J00^2 + 2*S02*J00*J02 + S22*J02^2
    // cov01 = S01*J00*J11 + S02*J00*J12 + S12*J11*J02 + S22*J02*J12
    // cov11 = S11*J11^2 + 2*S12*J11*J12 + S22*J12^2
    
    // Low pass filter to prevent aliasing (add identity/pixel size)
    cov00 += 0.3; 
    cov11 += 0.3;

    // 5. Construct Axes for the Quad
    // We need to find eigenvalues/vectors of Cov2D to determine the major/minor axes of the ellipse.
    // Or simpler: Inverse of Cov2D determines the Mahalanobis distance in fragment shader.
    // We need to pass the inverse 2D covariance to fragment shader.
    
    float det = cov00 * cov11 - cov01 * cov01;
    float detInv = 1.0 / det;
    
    // Inverse Cov2D
    vec3 conic;
    conic.x =  cov11 * detInv;
    conic.y = -cov01 * detInv;
    conic.z =  cov00 * detInv;
    
    // Pass to fragment for alpha test
    // We send 'conic' which is [InvCov00, InvCov01, InvCov11]
    
    // 6. Expand Vertex Position (Billboard)
    // We want the quad to cover +/- 3 sigma.
    // Radius ~ 3 * sqrt(max_eigenvalue).
    // Simplified: just take max dimension of bounding box of ellipse.
    // Or just a conservative box.
    float mid = 0.5 * (cov00 + cov11);
    float lambda1 = mid + sqrt(max(0.1, mid * mid - det));
    float lambda2 = mid - sqrt(max(0.1, mid * mid - det));
    float radius = 3.0 * sqrt(max(lambda1, lambda2));
    
    // Screen space offset
    vec2 offset = position.xy * radius; // position.xy is in [-1, 1] usually from PlaneGeometry?
    
    // Apply offset in screen space (NDC)
    // gl_Position is already in Clip Space.
    // We need to apply offset in pixel space or NDC space.
    // gl_Position.xy /= gl_Position.w is NDC.
    
    gl_Position.xy += offset * gl_Position.w * (2.0 / resolution);
    
    // Pass Varyings
    vColor = color;
    vPosition = offset; // Local quad coords in sigma units? No in pixels roughly.
    // Actually we need 'vPosition' in a space where we can compute x^T * Sigma^-1 * x
    // If we use 'offset' which is in Pixels:
    // Q = [x y] * [conic.x conic.y; conic.y conic.z] * [x y]^T
    // power = -0.5 * Q
    
    // Let's pass the conic parameters and the offset.
    // using a struct or varying.
    // We reuse vPosition to pass the offset from center.
    
    // We verify: vPosition computed here is "delta_screen_pixels".
    // conic is "inverse covariance in pixel space".
    // Perfect.
    
    // Packing conic?
    // varying vec3 vConic;
    
    // Wait, GLSL vars scope.
}
`;

// Re-write to include vConic
export const splatVertexShaderFixed = `
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

// Exporting the Fixed version as the main one
export const splatVertexShader = splatVertexShaderFixed;
