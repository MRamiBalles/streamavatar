import { useState } from 'react';
import { Camera, CameraOff, Monitor, Loader2, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceTracker } from '@/hooks/useFaceTracker';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { createPortal } from 'react-dom';

export const CameraControls = () => {
  const { videoRef, startCamera, stopCamera, isLoading, error, isCameraActive } = useFaceTracker();
  const { isTracking } = useAvatarStore();
  const [showMirror, setShowMirror] = useState(false);
  const t = useTranslation();

  return (
    <div className="space-y-4">
      {/* 
        Video Mirror Overlay 
        - Uses createPortal to render outside the sidebar context for proper z-indexing & positioning 
        - Helps user debug tracking by seeing what the camera sees
      */}
      {showMirror && isCameraActive && createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-primary/50 bg-black">
            <video
              ref={videoRef}
              className="w-80 h-auto object-cover transform scale-x-[-1]"
              playsInline
              muted
            />
            {/* Mirror Overlay Controls */}
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                onClick={() => setShowMirror(false)}
                title="Close Mirror"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>

            {/* Tracking Status Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-white font-mono">
                {isTracking ? 'TRACKING: ACTIVE' : 'TRACKING: LOST'}
              </div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border shadow-sm">
              Mirror Mode (Debug)
            </span>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden video element when mirror is OFF (still needed for tracking logic) */}
      {!showMirror && (
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isCameraActive
            ? 'bg-success/20 text-success'
            : 'bg-muted text-muted-foreground'
          }`}>
          <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`} />
          {isCameraActive ? t.cameraActive : t.cameraInactive}
        </div>

        {isCameraActive && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isTracking
              ? 'bg-primary/20 text-primary'
              : 'bg-destructive/20 text-destructive'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-primary animate-pulse' : 'bg-destructive'
              }`} />
            {isTracking ? t.trackingOk : t.noFace}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        {!isCameraActive ? (
          <Button
            onClick={() => {
              startCamera();
              setShowMirror(true); // Auto-show mirror on start for better UX
            }}
            disabled={isLoading}
            className="flex-1 gap-2"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.starting}
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {t.startCamera}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopCamera}
            className="flex-1 gap-2"
            variant="secondary"
          >
            <CameraOff className="w-4 h-4" />
            {t.stopCamera}
          </Button>
        )}

        {/* Mirror Toggle Button */}
        {isCameraActive && (
          <Button
            onClick={() => setShowMirror(!showMirror)}
            variant={showMirror ? "default" : "outline"}
            size="icon"
            title="Toggle Mirror / Ver Cámara"
          >
            {showMirror ? <Eye className="w-4 h-4" /> : <LayoutTemplate className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Screen share placeholder */}
      <Button
        variant="outline"
        className="w-full gap-2"
        disabled
      >
        <Monitor className="w-4 h-4" />
        {t.shareScreen}
      </Button>
    </div>
  );
};