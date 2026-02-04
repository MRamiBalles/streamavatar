import { Pill, Box, Circle, Cat, Ghost, Smimport { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import Index from "./pages/Index";
import CleanView from "./pages/CleanView";
import NotFound from "./pages/NotFound"; el } from '@/lib/db';

const avatarOptions: { type: AvatarType; nameKey: 'peanut' | 'robot' | 'slime' | 'cat' | 'ghost' | 'emoji'; icon: React.ElementType }[] = [
  { type: 'pill', nameKey: 'peanut', icon: Pill },
  { type: 'boxy', nameKey: 'robot', icon: Box },
  { type: 'sphere', nameKey: 'slime', icon: Circle },
  { type: 'cat', nameKey: 'cat', icon: Cat },
  { type: 'ghost', nameKey: 'ghost', icon: Ghost },
  { type: 'emoji', nameKey: 'emoji', icon: Smile },
];

export const AvatarSelector = () => {
  const { selectedAvatar, setSelectedAvatar, setCustomModel, customModel } = useAvatarStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const t = useTranslation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'glb' && extension !== 'vrm') {
      toast({
        title: t.unsupportedFormat,
        description: t.onlyGLBorVRM,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);

    // Memory Safety: Revoke the previous object URL if it exists to prevent memory leaks
    if (customModel?.url) {
      URL.revokeObjectURL(customModel.url);
    }

    // Save to IndexedDB for persistence
    saveModel('custom-avatar', file, { name: file.name, type: extension })
      .catch(err => console.error('Failed to save model to IDB:', err));

    setCustomModel({
      url,
      name: file.name,
      type: extension as 'glb' | 'vrm',
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
      <div className="pt-2 border-t border-border">
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
