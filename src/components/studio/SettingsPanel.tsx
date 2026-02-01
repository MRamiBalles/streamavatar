import { useRef } from 'react';
import { Download, Upload, RotateCcw, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAvatarStore, useTranslation, Language } from '@/stores/avatarStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AudioReactiveControls } from './AudioReactiveControls';
import { LipSyncControls } from './LipSyncControls';
import { PrivacyControls } from './PrivacyControls';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const SettingsPanel = () => {
  const {
    language,
    setLanguage,
    audioSensitivity,
    setAudioSensitivity,
    exportConfig,
    importConfig,
    resetToDefaults
  } = useAvatarStore();
  const t = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'streamavatar-config.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t.exportSuccess,
      description: 'streamavatar-config.json',
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importConfig(content);

      if (success) {
        toast({
          title: t.importSuccess,
        });
      } else {
        toast({
          title: t.importError,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: t.resetSuccess,
    });
  };

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t.language}
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg transition-all",
                language === lang.code
                  ? "bg-primary/20 border border-primary/50 text-foreground"
                  : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.label}</span>
              {language === lang.code && (
                <Check className="w-4 h-4 ml-auto text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Audio Reactive */}
      <AudioReactiveControls />

      <div className="h-px bg-border" />

      {/* Lip Sync */}
      <LipSyncControls />

      <div className="h-px bg-border" />

      {/* Privacy & Ethics */}
      <PrivacyControls />

      <div className="h-px bg-border" />

      {/* Export/Import */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {t.exportConfig} / {t.importConfig}
        </Label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {t.exportConfig.split(' ')[0]}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t.importConfig.split(' ')[0]}
          </Button>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Reset */}
      <Button
        variant="ghost"
        onClick={handleReset}
        className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <RotateCcw className="w-4 h-4" />
        {t.resetDefaults}
      </Button>
    </div>
  );
};
