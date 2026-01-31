import { Camera, CameraOff, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceTracker } from '@/hooks/useFaceTracker';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';

export const CameraControls = () => {
  const { videoRef, startCamera, stopCamera, isLoading, error, isCameraActive } = useFaceTracker();
  const { isTracking } = useAvatarStore();
  const t = useTranslation();

  return (
    <div className="space-y-4">
      {/* Hidden video element for face tracking */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      
      {/* Status indicators */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isCameraActive 
            ? 'bg-success/20 text-success' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isCameraActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
          }`} />
          {isCameraActive ? t.cameraActive : t.cameraInactive}
        </div>
        
        {isCameraActive && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isTracking 
              ? 'bg-primary/20 text-primary' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isTracking ? 'bg-primary animate-pulse' : 'bg-destructive'
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
            onClick={startCamera}
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