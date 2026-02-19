import { Pill, Box, Circle, Cat, Ghost, Smile, Upload, Rocket, Skull, Rotate3D } from 'lucide-react';
import { useAvatarStore, AvatarType, useTranslation } from '@/stores/avatarStore';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { saveModel, validateModelFile, MAX_MODEL_SIZE } from '@/lib/db';
import { debugError } from '@/lib/debugLog';

const avatarOptions: { type: AvatarType; nameKey: 'peanut' | 'robot' | 'slime' | 'cat' | 'ghost' | 'alien' | 'scream' | 'emoji'; icon: React.ElementType }[] = [
  { type: 'pill', nameKey: 'peanut', icon: Pill },
  { type: 'boxy', nameKey: 'robot', icon: Box },
  { type: 'sphere', nameKey: 'slime', icon: Circle },
  { type: 'cat', nameKey: 'cat', icon: Cat },
  { type: 'ghost', nameKey: 'ghost', icon: Ghost },
  { type: 'alien', nameKey: 'alien', icon: Rocket },
  { type: 'scream', nameKey: 'scream', icon: Skull },
  { type: 'emoji', nameKey: 'emoji', icon: Smile },
];

export const AvatarSelector = () => {
  const { selectedAvatar, setSelectedAvatar, setCustomModel, customModel } = useAvatarStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const t = useTranslation();
  const [fixRotation, setFixRotation] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Extension check
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'glb' && extension !== 'vrm') {
      toast({
        title: t.unsupportedFormat,
        description: t.onlyGLBorVRM,
        variant: "destructive",
      });
      return;
    }

    // 2. Size + magic byte + glTF version validation
    const validation = await validateModelFile(file);
    if (!validation.valid) {
      toast({
        title: t.unsupportedFormat,
        description: validation.error || 'Invalid model file',
        variant: "destructive",
      });
      // Reset the file input so the same file can be retried
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const url = URL.createObjectURL(file);

    // Memory Safety: Revoke the previous object URL if it exists to prevent memory leaks
    if (customModel?.url) {
      URL.revokeObjectURL(customModel.url);
    }

    // Prepare initial rotation if fix is enabled
    // Meshy models often come Z-up/inverted. Trials show X(90) + Y(180) works best.
    const initialRotation: [number, number, number] | undefined = fixRotation ? [Math.PI / 2, Math.PI, 0] : undefined;

    // Save to IndexedDB for persistence (with enforced storage limits)
    saveModel('custom-avatar', file, { name: file.name, type: extension, initialRotation })
      .catch(err => {
        debugError('[AvatarSelector] Failed to save model to IDB:', err);
        toast({
          title: 'Storage error',
          description: err instanceof Error ? err.message : 'Failed to save model',
          variant: "destructive",
        });
      });

    setCustomModel({
      url,
      name: file.name,
      type: extension as 'glb' | 'vrm', // Cast to allowed types
      initialRotation
    });

    toast({
      title: t.modelLoaded,
      description: `${file.name} ${t.modelReadyToUse}`,
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {t.selectAvatar}
      </h3>

      {/* Built-in avatars */}
      <div className="grid grid-cols-3 gap-2">
        {avatarOptions.map((avatar) => {
          const Icon = avatar.icon;
          const isSelected = selectedAvatar === avatar.type;

          return (
            <button
              key={avatar.type}
              onClick={() => setSelectedAvatar(avatar.type)}
              className={cn(
                "avatar-card flex flex-col items-center gap-2 p-3 transition-all",
                isSelected && "selected"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {t[avatar.nameKey]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Import custom model */}
      <div className="pt-2 border-t border-border space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="fix-rotation"
            checked={fixRotation}
            onCheckedChange={(c) => setFixRotation(c === true)}
          />
          <Label htmlFor="fix-rotation" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
            <Rotate3D className="w-3 h-3" />
            {t.fixRotation || "Fix Rotation (Meshy/Z-up)"}
          </Label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.vrm"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full avatar-card flex items-center justify-center gap-2 p-3 transition-all",
            selectedAvatar === 'custom' && customModel && "selected"
          )}
        >
          <Upload className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-xs font-medium">
              {customModel ? customModel.name : t.importModel}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {customModel ? `${customModel.type.toUpperCase()}` : t.customModel}
            </p>
          </div>
        </button>

        {customModel && (
          <button
            onClick={() => {
              URL.revokeObjectURL(customModel.url);
              setCustomModel(null);
              setSelectedAvatar('pill');
            }}
            className="w-full mt-2 text-xs text-destructive hover:underline"
          >
            {t.removeCustomModel}
          </button>
        )}
      </div>
    </div>
  );
};