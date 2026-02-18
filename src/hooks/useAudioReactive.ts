import { useEffect, useRef, useCallback, useState } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { debugError } from '@/lib/debugLog';

export const useAudioReactive = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const { setAudioData, audioSensitivity } = useAvatarStore();

  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedVolume = Math.min((average / 128) * audioSensitivity, 1);

    // Calculate bass (low frequencies) for more impactful reactions
    const bassRange = dataArray.slice(0, Math.floor(dataArray.length * 0.1));
    const bassAverage = bassRange.reduce((acc, val) => acc + val, 0) / bassRange.length;
    const normalizedBass = Math.min((bassAverage / 128) * audioSensitivity, 1);

    // Calculate treble (high frequencies) for subtle details
    const trebleRange = dataArray.slice(Math.floor(dataArray.length * 0.7));
    const trebleAverage = trebleRange.reduce((acc, val) => acc + val, 0) / trebleRange.length;
    const normalizedTreble = Math.min((trebleAverage / 128) * audioSensitivity, 1);

    setVolume(normalizedVolume);
    setAudioData({
      volume: normalizedVolume,
      bass: normalizedBass,
      treble: normalizedTreble,
    });

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [setAudioData, audioSensitivity]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setIsListening(true);
      animationFrameRef.current = requestAnimationFrame(processAudio);
    } catch (err) {
      debugError('[AudioReactive] Failed to access microphone:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [processAudio]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
    setVolume(0);
    setAudioData({ volume: 0, bass: 0, treble: 0 });
  }, [setAudioData]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    startListening,
    stopListening,
    isListening,
    error,
    volume,
  };
};
