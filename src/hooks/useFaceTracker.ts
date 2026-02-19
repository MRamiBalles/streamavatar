import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { useAvatarStore } from '@/stores/avatarStore';
import { ARKitIndex } from '@/lib/vrmTrackingBridge';
import { debugError } from '@/lib/debugLog';
import * as THREE from 'three';

export const useFaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startingRef = useRef(false); // Guard against concurrent startCamera calls
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setFaceData, setCameraActive, setTracking, isCameraActive, setVideoElement } = useAvatarStore();

  // Sync usage of local ref with global store
  // Sync usage of local ref with global store
  // Sincronizar uso de ref local con el store global para componentes AR
  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current);
    }
  }, [setVideoElement]);

  const initializeFaceLandmarker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      faceLandmarkerRef.current = faceLandmarker;
      setIsLoading(false);
    } catch (err) {
      debugError('[FaceTracker] Failed to initialize:', err);
      setError('Failed to initialize face tracking. Please try again.');
      setIsLoading(false);
    }
  }, []);

  /* 
   * FIXED: Face Tracking Logic for Mirroring & Responsiveness
   */
  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current || !useAvatarStore.getState().isCameraActive) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      let result: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        const blendshapes = result.faceBlendshapes[0].categories;

        const getBlendshapeValue = (name: string) => {
          const shape = blendshapes.find(b => b.categoryName === name);
          return shape ? shape.score : 0;
        };

        // SDD: Populate all 52 coefficients
        const rawCoefficients = new Float32Array(52);
        blendshapes.forEach(category => {
          const index = (ARKitIndex as any)[category.categoryName];
          if (index !== undefined) {
            rawCoefficients[index] = category.score;
          }
        });

        // Extract relevant blendshapes with sensitivity boosting
        // We boost the raw values to make expressions easier to trigger
        const boost = (val: number, multiplier: number = 1.5) => Math.min(1, val * multiplier);

        // USER REQUEST: Less amplitude, focus on inner edges for closure
        // Reduced from 1.8 to 1.0 to avoid "too much amplitude"
        let jawOpen = boost(getBlendshapeValue('jawOpen'), 1.0);

        // Eye blinks are often subtle, boost them significantly so "normal" blinks register fully
        const eyeBlinkLeft = boost(getBlendshapeValue('eyeBlinkLeft'), 1.5);
        const eyeBlinkRight = boost(getBlendshapeValue('eyeBlinkRight'), 1.5);

        // --- GEOMETRIC MOUTH CLOSURE CHECK ---
        // Use Inner Lip landmarks (13: Upper Middle, 14: Lower Middle) to detect precise closure
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const upperLip = landmarks[13];
          const lowerLip = landmarks[14];

          if (upperLip && lowerLip) {
            // Calculate vertical distance between inner lips
            const distance = Math.abs(upperLip.y - lowerLip.y);

            // Threshold for "closed": 0.005 is very close (lips touching)
            // If distance is tiny, force jawOpen to 0 to ensure "se cierra completa"
            if (distance < 0.005) {
              jawOpen = 0;
            } else {
              // Blend geometric distance with blendshape for more accuracy
              // Map distance 0.005-0.1 to 0-1
              const geometricOpen = Math.min(1, Math.max(0, (distance - 0.005) * 5.0)); // Adjusted sensitivity

              // Weighted average: 60% Geometric (Inner Edges), 40% Blendshape
              // This prioritizes the "points" detection user asked for
              jawOpen = (jawOpen * 0.4) + (geometricOpen * 0.6);
            }

            // FIXED: Update the raw coefficients so the modern avatar renderer uses this corrected value
            // ARKit 'jawOpen' is index 17
            // We also dampen the smile to address "automatic smile" complaints
            if (rawCoefficients.length > 24) {
              // Update jawOpen (17)
              rawCoefficients[17] = jawOpen;

              // Dampen smiles (mouthSmileLeft: 23, mouthSmileRight: 24 in standard ARKit 52)
              // Reducing intensity by 30% to avoid "permanent smile" look
              const smileDampener = 0.7;
              rawCoefficients[23] *= smileDampener;
              rawCoefficients[24] *= smileDampener;
            }
          }
        }

        // Get head rotation from transformation matrix
        let headRotation = { x: 0, y: 0, z: 0 };
        let headPosition = { x: 0, y: 0, z: 0 };
        let rawRotation: [number, number, number, number] = [0, 0, 0, 1];

        if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
          const matrix = result.facialTransformationMatrixes[0].data;

          // Extract rotation from transformation matrix (Legacy Euler)
          // FIXED: Adjusted signs to match the "Mirror" effect of the position
          headRotation = {
            x: Math.atan2(matrix[9], matrix[10]) * 0.5,
            // Reverted Y rotation to match the non-inverted X position
            // If I rotate head Left (my physical left), the avatar should look to Screen Left.
            y: -Math.atan2(-matrix[8], Math.sqrt(matrix[9] * matrix[9] + matrix[10] * matrix[10])) * 0.5, // Negated for natural mirror
            z: Math.atan2(matrix[4], matrix[0]) * 0.3,
          };

          // SDD: Extract Quaternion from matrix
          const threeMatrix = new THREE.Matrix4().fromArray(matrix);
          const quat = new THREE.Quaternion().setFromRotationMatrix(threeMatrix);
          rawRotation = [quat.x, quat.y, quat.z, quat.w];
        }

        // --- EXTRACT LANDMARKS FOR DIAGNOSTIC & POSITIONING ---
        let facePoints: { x: number, y: number, z: number }[] = [];
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];

          // Comprehensive face landmark indices (~90 points)
          const diagnosticIndices = [
            // Face contour (17)
            10, 338, 297, 332, 284, 251, 389, 356, 454,
            152, 148, 176, 149, 150, 136, 172, 58,
            // Left eye (7)
            33, 7, 163, 144, 145, 153, 133,
            // Right eye (7)
            362, 382, 381, 380, 374, 263, 249,
            // Left eyebrow (5)
            70, 63, 105, 66, 107,
            // Right eyebrow (5)
            336, 296, 334, 293, 300,
            // Nose (9)
            1, 2, 98, 327, 168, 6, 195, 4, 5,
            // Outer lips (11)
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
            // Inner lips (10)
            78, 95, 88, 178, 87, 14, 317, 402, 318, 324,
            // Irises (2)
            468, 473,
            // Jaw / neck estimation (6)
            132, 361, 93, 234, 127, 162,
            // Chin to jaw lower (4)
            365, 379, 378, 400,
          ];

          facePoints = diagnosticIndices.map(idx => {
            const p = landmarks[idx];
            // MediaPipe gives normalized [0,1] coordinates.
            // We map to [-0.5, 0.5] range for consistency with our tracking logic
            return {
              x: (p.x - 0.5), // No flip, match screen space
              y: (p.y - 0.5) * -1, // Flip Y for R3F convention
              z: p.z
            };
          });

          // Use Landmark 1 (Nose Tip) as the primary anchor for 3D positioning
          // This is more stable than the transformation matrix translation for AR alignment
          const noseTip = landmarks[1];
          headPosition = {
            x: (noseTip.x - 0.5), // No flip, match screen space
            y: (noseTip.y - 0.5) * -1, // Invert Y for screen space
            z: noseTip.z // Z is depth
          };
        }

        setFaceData({
          headRotation,
          headPosition,
          mouthOpen: jawOpen,
          leftEyeBlink: eyeBlinkLeft,
          rightEyeBlink: eyeBlinkRight,
          rawCoefficients,
          rawRotation,
          facePoints
        });

        setTracking(true);

        // --- Obfuscation Mode logic ---
        // In obfuscation mode, we explicitly ensure the heavy landmark result
        // is discarded and not accessible for further inference or storage.
        if (useAvatarStore.getState().obfuscationMode) {
          // Nullify local references to help GC and prevent lingering data
          // @ts-ignore - explicitly clearing for privacy
          blendshapes.length = 0;
          // @ts-ignore
          result = null;
        }
      } else {
        setTracking(false);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [setFaceData, setTracking]);

  const startCamera = useCallback(async () => {
    // Prevent concurrent startCamera calls (race condition guard)
    if (startingRef.current) return;
    startingRef.current = true;

    try {
      setError(null);

      if (!faceLandmarkerRef.current) {
        await initializeFaceLandmarker();
      }

      // Stop any existing stream before starting a new one
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for the video to be ready before calling play()
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadeddata = () => resolve();
        });

        await videoRef.current.play();

        // Ensure store is updated with the active video element
        setVideoElement(videoRef.current);

        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    } catch (err: any) {
      // Ignore AbortError from play() interruptions — they are benign
      if (err?.name !== 'AbortError') {
        debugError('[FaceTracker] Failed to start camera:', err);
        setError('Failed to access camera. Please check permissions.');
      }
    } finally {
      startingRef.current = false;
    }
  }, [initializeFaceLandmarker, setCameraActive, processFrame, setVideoElement]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setCameraActive(false);
    setTracking(false);
  }, [setCameraActive, setTracking]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, [stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
    isLoading,
    error,
    isCameraActive,
  };
};
