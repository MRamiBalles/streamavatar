import { Trash2, User, Clock, Grid } from 'lucide-react';
import { useAvatarStore, AvatarPreset } from '@/stores/avatarStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
                            {/* Thumbnail Placeholder / Icon */}
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                                activePresetId === preset.id ? "bg-primary/20" : "bg-muted"
                            )}>
                                <User className={cn(
                                    "w-6 h-6",
                                    activePresetId === preset.id ? "text-primary" : "text-muted-foreground"
                                )} />
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
