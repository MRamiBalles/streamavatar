import { Copy, ExternalLink, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { useToast } from '@/hooks/use-toast';

export const StreamPanel = () => {
  const { background, setBackground } = useAvatarStore();
  const { toast } = useToast();
  const t = useTranslation();

  const cleanViewUrl = `${window.location.origin}/view`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanViewUrl);
    toast({
      title: t.linkCopied,
      description: t.useAsOBS,
    });
  };

  const handleOpenCleanView = () => {
    window.open(cleanViewUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* OBS Setup Section */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{t.obsSetup}</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          {t.obsInstructions}
        </p>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 gap-2"
          >
            <Copy className="w-4 h-4" />
            {t.copyLink}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCleanView}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {t.openPreview}
          </Button>
        </div>
      </div>

      {/* Quick Background Selector */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-medium">{t.quickBackground}</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={background === 'chroma-green' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('chroma-green')}
          >
            {t.chromaGreen}
          </Button>
          <Button
            variant={background === 'chroma-blue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('chroma-blue')}
          >
            {t.chromaBlue}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={background === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('dark')}
          >
            {t.dark}
          </Button>
          <Button
            variant={background === 'transparent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('transparent')}
          >
            {t.transparent}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <Button
            variant={background === 'splat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('splat')}
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
          >
            {t.splat}
          </Button>
        </div>
      </div>

      {/* Documentation Link */}
      <a
        href="https://github.com/MRamiBalles/streamavatar/blob/main/docs/OBS_SETUP_GUIDE.md"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-sm text-primary hover:underline py-2"
      >
        {t.viewFullGuide} →
      </a>
    </div>
  );
};