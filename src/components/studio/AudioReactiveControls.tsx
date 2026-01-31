import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAudioReactive } from '@/hooks/useAudioReactive';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';

export const AudioReactiveControls = () => {
  const { startListening, stopListening, isListening, error, volume } = useAudioReactive();
  const { 
    audioSensitivity, 
    setAudioSensitivity, 
    audioReactiveEnabled, 
    setAudioReactiveEnabled 
  } = useAvatarStore();
  const t = useTranslation();

  const handleToggle = async (enabled: boolean) => {
    setAudioReactiveEnabled(enabled);
    if (enabled) {
      await startListening();
    } else {
      stopListening();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">{t.audioReactive}</Label>
        </div>
        <Switch
          checked={audioReactiveEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {audioReactiveEnabled && (
        <>
          {/* Volume indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isListening ? t.listening : t.cameraInactive}</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-neon-pink transition-all duration-75"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          {/* Sensitivity slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t.sensitivity}</Label>
              <span className="text-xs text-muted-foreground">{audioSensitivity.toFixed(1)}x</span>
            </div>
            <Slider
              value={[audioSensitivity]}
              onValueChange={([value]) => setAudioSensitivity(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Manual toggle button */}
          <Button
            onClick={() => isListening ? stopListening() : startListening()}
            variant={isListening ? "secondary" : "default"}
            size="sm"
            className="w-full gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                {t.stopListening}
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                {t.startListening}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};
