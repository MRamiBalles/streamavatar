/**
 * useHandTracker — MediaPipe Hand Landmarker integration
 * 
 * Detects up to 2 hands and stores 21 landmarks per hand.
 * Shares the same video element as the face tracker.
 */

import { useRef, useCallback, useEffect } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useAvatarStore } from '@/stores/avatarStore';

export const useHandTracker = () => {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const initializeHandLandmarker = useCallback(async () => {
    if (handLandmarkerRef.current) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      );

      handLandmarkerRef.current = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });

      console.log('[HandTracker] Initialized');
    } catch (err) {
      console.error('[HandTracker] Failed to initialize:', err);
    }
  }, []);

  const processHands = useCallback(() => {
    if (!isRunningRef.current) return;

    const { videoElement, isCameraActive, setLeftHandData, setRightHandData, setHandTrackingActive } =
      useAvatarStore.getState();

    if (!videoElement || !handLandmarkerRef.current || !isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(processHands);
      return;
    }

    if (videoElement.readyState >= 2) {
      const result = handLandmarkerRef.current.detectForVideo(videoElement, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        setHandTrackingActive(true);

        // Classify hands by handedness
        result.landmarks.forEach((landmarks, idx) => {
          const handedness = result.handednesses?.[idx]?.[0]?.categoryName;
          const points = landmarks.map(p => ({
            x: p.x - 0.5,
            y: (p.y - 0.5) * -1,
            z: p.z,
          }));

          // MediaPipe mirrors: "Left" in result = user's left hand
          if (handedness === 'Left') {
            setLeftHandData({ landmarks: points, isTracked: true });
          } else {
            setRightHandData({ landmarks: points, isTracked: true });
          }
        });

        // If only one hand detected, mark the other as not tracked
        if (result.landmarks.length === 1) {
          const handedness = result.handednesses?.[0]?.[0]?.categoryName;
          if (handedness === 'Left') {
            setRightHandData({ landmarks: [], isTracked: false });
          } else {
            setLeftHandData({ landmarks: [], isTracked: false });
          }
        }
      } else {
        setHandTrackingActive(false);
        setLeftHandData({ landmarks: [], isTracked: false });
        setRightHandData({ landmarks: [], isTracked: false });
      }
    }

    animationFrameRef.current = requestAnimationFrame(processHands);
  }, []);

  const startHandTracking = useCallback(async () => {
    if (isRunningRef.current) return;
    await initializeHandLandmarker();
    isRunningRef.current = true;
    animationFrameRef.current = requestAnimationFrame(processHands);
    console.log('[HandTracker] Started');
  }, [initializeHandLandmarker, processHands]);

  const stopHandTracking = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const { setHandTrackingActive, setLeftHandData, setRightHandData } = useAvatarStore.getState();
    setHandTrackingActive(false);
    setLeftHandData({ landmarks: [], isTracked: false });
    setRightHandData({ landmarks: [], isTracked: false });
    console.log('[HandTracker] Stopped');
  }, []);

  useEffect(() => {
    return () => {
      stopHandTracking();
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [stopHandTracking]);

  return { startHandTracking, stopHandTracking };
};
