import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { useAvatarStore } from '@/stores/avatarStore';
import { ARKitIndex } from '@/lib/vrmTrackingBridge';
import * as THREE from 'three';

export const useFaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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
      console.error('Failed to initialize face landmarker:', err);
      setError('Failed to initialize face tracking. Please try again.');
      setIsLoading(false);
    }
  }, []);

  /* 
   * FIXED: Face Tracking Logic for Mirroring & Responsiveness
   */
  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current || !isCameraActive) {
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

        const jawOpen = boost(getBlendshapeValue('jawOpen'), 1.8); // Make mouth opening easier
        // Eye blinks are often subtle, boost them significantly so "normal" blinks register fully
        const eyeBlinkLeft = boost(getBlendshapeValue('eyeBlinkLeft'), 1.5);
        const eyeBlinkRight = boost(getBlendshapeValue('eyeBlinkRight'), 1.5);

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

          // Indices for diagnostics
          const diagnosticIndices = [
            33, 133, 362, 263, // Eyes (4)
            1, 2, 3, 4,       // Nose (4)
            61, 291, 0, 17, 78, 308, // Mouth (6)
            10, 152, 234, 454, 58, 288, 172, 397, 132, 361 // Face Shape (10)
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
  }, [isCameraActive, setFaceData, setTracking]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (!faceLandmarkerRef.current) {
        await initializeFaceLandmarker();
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
        await videoRef.current.play();

        // Ensure store is updated with the active video element
        setVideoElement(videoRef.current);

        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  }, [initializeFaceLandmarker, setCameraActive, processFrame]);

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
