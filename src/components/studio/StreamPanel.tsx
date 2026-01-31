import { useState } from 'react';
import { Radio, Plus, Trash2, Copy, ExternalLink, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export const StreamPanel = () => {
  const { streamDestinations, updateStreamDestination, toggleStreamDestination, removeStreamDestination, addStreamDestination, isLive, setLive } = useAvatarStore();
  const { toast } = useToast();
  const t = useTranslation();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDestination, setNewDestination] = useState({ name: '', rtmpUrl: '', streamKey: '' });
  const [openDestination, setOpenDestination] = useState<string | null>(null);

  const handleCopyCleanViewLink = () => {
    const cleanViewUrl = `${window.location.origin}/view`;
    navigator.clipboard.writeText(cleanViewUrl);
    toast({
      title: t.linkCopied,
      description: t.useAsOBS,
    });
  };

  const handleAddDestination = () => {
    if (newDestination.name && newDestination.rtmpUrl) {
      addStreamDestination({
        ...newDestination,
        enabled: false,
      });
      setNewDestination({ name: '', rtmpUrl: '', streamKey: '' });
      setIsAddingNew(false);
    }
  };

  const handleGoLive = () => {
    const enabledDestinations = streamDestinations.filter(d => d.enabled && d.streamKey);
    if (enabledDestinations.length === 0) {
      toast({
        title: t.noDestinations,
        description: t.configureDestination,
        variant: "destructive",
      });
      return;
    }
    setLive(!isLive);
    toast({
      title: isLive ? t.streamStopped : t.live,
      description: isLive ? t.streamEnded : `${t.streamingTo} ${enabledDestinations.length} ${t.destinationsCount}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* GO LIVE Button */}
      <Button
        onClick={handleGoLive}
        size="lg"
        className={cn(
          "w-full h-14 text-lg font-display font-bold gap-3 transition-all",
          isLive 
            ? "bg-destructive hover:bg-destructive/90 animate-pulse-glow" 
            : "bg-gradient-to-r from-primary to-neon-pink hover:opacity-90"
        )}
      >
        <Radio className={cn("w-5 h-5", isLive && "animate-pulse")} />
        {isLive ? t.stopStream : t.goLive}
      </Button>

      {/* Clean View Link */}
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t.cleanView}</p>
            <p className="text-xs text-muted-foreground">{t.addAsBrowserSource}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCleanViewLink}
            className="gap-2"
          >
            <Copy className="w-3 h-3" />
            {t.copyLink}
          </Button>
        </div>
      </div>

      {/* Stream Destinations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t.destinations}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            {t.add}
          </Button>
        </div>

        {/* Existing destinations */}
        <div className="space-y-2">
          {streamDestinations.map((dest) => (
            <Collapsible
              key={dest.id}
              open={openDestination === dest.id}
              onOpenChange={(open) => setOpenDestination(open ? dest.id : null)}
            >
              <div className="glass-panel">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronRight className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        openDestination === dest.id && "rotate-90"
                      )} />
                      <div>
                        <p className="text-sm font-medium">{dest.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dest.streamKey ? t.configured : t.noStreamKey}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={dest.enabled}
                      onCheckedChange={() => toggleStreamDestination(dest.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">RTMP URL</Label>
                      <Input
                        value={dest.rtmpUrl}
                        onChange={(e) => updateStreamDestination(dest.id, { rtmpUrl: e.target.value })}
                        placeholder="rtmp://..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t.streamKeyPlaceholder}</Label>
                      <Input
                        type="password"
                        value={dest.streamKey}
                        onChange={(e) => updateStreamDestination(dest.id, { streamKey: e.target.value })}
                        placeholder={t.yourSecretKey}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStreamDestination(dest.id)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {t.delete}
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Add new destination form */}
        {isAddingNew && (
          <div className="glass-panel p-3 space-y-3">
            <Input
              placeholder={t.namePlaceholder}
              value={newDestination.name}
              onChange={(e) => setNewDestination(prev => ({ ...prev, name: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder={t.rtmpPlaceholder}
              value={newDestination.rtmpUrl}
              onChange={(e) => setNewDestination(prev => ({ ...prev, rtmpUrl: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder={t.streamKeyPlaceholder}
              type="password"
              value={newDestination.streamKey}
              onChange={(e) => setNewDestination(prev => ({ ...prev, streamKey: e.target.value }))}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddDestination} className="flex-1">
                <Check className="w-3 h-3 mr-1" />
                {t.save}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingNew(false)}>
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Import model placeholder */}
      <Button
        variant="outline"
        className="w-full gap-2 text-muted-foreground"
        disabled
      >
        <ExternalLink className="w-4 h-4" />
        {t.importModelComingSoon}
      </Button>
    </div>
  );
};