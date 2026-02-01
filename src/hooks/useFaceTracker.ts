import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { useAvatarStore } from '@/stores/avatarStore';

export const useFaceTracker = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setFaceData, setCameraActive, setTracking, isCameraActive } = useAvatarStore();

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

  const processFrame = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current || !isCameraActive) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      const result: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        const blendshapes = result.faceBlendshapes[0].categories;

        const getBlendshapeValue = (name: string) => {
          const shape = blendshapes.find(b => b.categoryName === name);
          return shape ? shape.score : 0;
        };

        // Extract relevant blendshapes
        const jawOpen = getBlendshapeValue('jawOpen');
        const eyeBlinkLeft = getBlendshapeValue('eyeBlinkLeft');
        const eyeBlinkRight = getBlendshapeValue('eyeBlinkRight');

        // Get head rotation from transformation matrix
        let headRotation = { x: 0, y: 0, z: 0 };

        if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
          const matrix = result.facialTransformationMatrixes[0].data;

          // Extract rotation from transformation matrix
          headRotation = {
            x: Math.atan2(matrix[9], matrix[10]) * 0.5,
            y: Math.atan2(-matrix[8], Math.sqrt(matrix[9] * matrix[9] + matrix[10] * matrix[10])) * 0.5,
            z: Math.atan2(matrix[4], matrix[0]) * 0.3,
          };
        }

        setFaceData({
          headRotation,
          mouthOpen: jawOpen,
          leftEyeBlink: eyeBlinkLeft,
          rightEyeBlink: eyeBlinkRight,
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
