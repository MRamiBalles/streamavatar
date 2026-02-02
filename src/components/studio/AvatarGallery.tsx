import { Trash2, User, Clock, Grid, Sparkles, Box, Circle, Ghost, Cat, Smile } from 'lucide-react';
import { useAvatarStore, AvatarPreset, AvatarType } from '@/stores/avatarStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Map avatar types to icons and colors for visual thumbnails
const AVATAR_VISUALS: Record<AvatarType, { icon: any; bgGradient: string }> = {
    pill: { icon: Sparkles, bgGradient: 'from-amber-500/20 to-orange-500/20' },
    sphere: { icon: Circle, bgGradient: 'from-blue-500/20 to-cyan-500/20' },
    boxy: { icon: Box, bgGradient: 'from-purple-500/20 to-pink-500/20' },
    cat: { icon: Cat, bgGradient: 'from-yellow-500/20 to-amber-500/20' },
    ghost: { icon: Ghost, bgGradient: 'from-slate-500/20 to-gray-500/20' },
    emoji: { icon: Smile, bgGradient: 'from-green-500/20 to-emerald-500/20' },
    custom: { icon: User, bgGradient: 'from-violet-500/20 to-purple-500/20' },
    composite: { icon: Grid, bgGradient: 'from-rose-500/20 to-red-500/20' },
};

const PresetThumbnail = ({ preset }: { preset: AvatarPreset }) => {
    const visual = AVATAR_VISUALS[preset.avatarType] || AVATAR_VISUALS.pill;
    const Icon = visual.icon;
    
    return (
        <div 
            className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden",
                "bg-gradient-to-br",
                visual.bgGradient
            )}
            style={{ 
                boxShadow: `0 0 20px ${preset.baseColor}30`,
            }}
        >
            {/* Color indicator ring */}
            <div 
                className="absolute inset-0 rounded-full border-2 opacity-50"
                style={{ borderColor: preset.baseColor }}
            />
            
            {/* Avatar type icon */}
            <Icon 
                className="w-6 h-6 z-10" 
                style={{ color: preset.baseColor }}
            />
            
            {/* Parts count badge for composite avatars */}
            {preset.avatarType === 'composite' && preset.parts.length > 0 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                    {preset.parts.length}
                </div>
            )}
        </div>
    );
};

export const AvatarGallery = () => {
    const { presets, loadPreset, deletePreset, activePresetId } = useAvatarStore();

    if (presets.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-widest">
                <Grid className="w-3 h-3" />
                Tus Identidades
            </div>

            <ScrollArea className="h-48 rounded-lg border bg-background/30">
                <div className="p-3 grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                        <div
                            key={preset.id}
                            onClick={() => loadPreset(preset.id)}
                            className={cn(
                                "group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                                activePresetId === preset.id
                                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                                    : "bg-card hover:bg-accent border-border"
                            )}
                        >
                            {/* Visual Thumbnail */}
                            <div className={cn(
                                "transition-transform duration-200 group-hover:scale-110",
                                activePresetId === preset.id && "scale-110"
                            )}>
                                <PresetThumbnail preset={preset} />
                            </div>

                            <div className="text-center overflow-hidden w-full">
                                <p className="text-[10px] font-bold truncate px-1">{preset.name}</p>
                                <div className="flex items-center justify-center gap-1 opacity-50 mt-1">
                                    <Clock className="w-2 h-2" />
                                    <span className="text-[8px]">{new Date(preset.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deletePreset(preset.id);
                                }}
                            >
                                <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
