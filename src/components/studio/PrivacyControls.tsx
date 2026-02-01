import { Shield, ShieldCheck, Fingerprint, EyeOff } from 'lucide-react';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const PrivacyControls = () => {
    const { obfuscationMode, setObfuscationMode, privacyShieldActive } = useAvatarStore();
    const t = useTranslation();

    return (
        <div className="space-y-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-base text-slate-200">
                    {t.privacy}
                </h3>
            </div>

            {/* Privacy Shield Status */}
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                privacyShieldActive
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            )}>
                <Shield className={cn("w-5 h-5", privacyShieldActive && "animate-pulse")} />
                <div className="flex-1">
                    <p className="text-sm font-bold">{t.privacyShield}</p>
                    <p className="text-[10px] opacity-80 uppercase tracking-tighter">
                        {t.localProcessing}
                    </p>
                </div>
            </div>

            {/* Obfuscation Mode Toggle */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                        <EyeOff className="w-4 h-4" />
                        <Label className="text-sm font-medium cursor-pointer" htmlFor="obfuscation">
                            {t.obfuscationMode}
                        </Label>
                    </div>
                    <Switch
                        id="obfuscation"
                        checked={obfuscationMode}
                        onCheckedChange={setObfuscationMode}
                    />
                </div>
                <p className="text-xs text-muted-foreground leading-snug pl-6">
                    {t.obfuscationDesc}
                </p>
            </div>

            <div className="flex items-center gap-2 pt-1 opacity-50">
                <Fingerprint className="w-3 h-3" />
                <span className="text-[10px] italic">Biometric Data Protection Protocol v1.2</span>
            </div>
        </div>
    );
};
