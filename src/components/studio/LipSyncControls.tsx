import { Mic, Info } from 'lucide-react';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const LipSyncControls = () => {
    const { lipSyncEnabled, setLipSyncEnabled } = useAvatarStore();
    const t = useTranslation();

    return (
        <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                    <Mic className="w-5 h-5" />
                    <h3 className="font-display font-semibold text-base">{t.lipSync}</h3>
                </div>
                <Switch
                    checked={lipSyncEnabled}
                    onCheckedChange={setLipSyncEnabled}
                />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                {t.lipSyncDesc}
            </p>

            {lipSyncEnabled && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-primary/80 italic">
                        {t.experimental}: El análisis de vocales (Aa, Ee, Ih, Oh, Ou) mejora el realismo fonético.
                    </p>
                </div>
            )}
        </div>
    );
};
