import { Keyboard, X, Sparkles, Smile, Frown, Angry, Zap } from 'lucide-react';
import { useAvatarStore, ExpressionType, HotkeyMapping } from '@/stores/avatarStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const HotkeysPanel = () => {
    const { hotkeyMappings, setHotkeyMapping, removeHotkeyMapping, activeExpression } = useAvatarStore();
    const [recordingKey, setRecordingKey] = useState<ExpressionType | null>(null);

    useEffect(() => {
        if (!recordingKey) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            setHotkeyMapping({
                key: e.key,
                expression: recordingKey,
                intensity: 1
            });
            setRecordingKey(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [recordingKey, setHotkeyMapping]);

    const expressions: { type: ExpressionType; icon: any; label: string }[] = [
        { type: 'happy', icon: Smile, label: 'Feliz' },
        { type: 'sad', icon: Frown, label: 'Triste' },
        { type: 'angry', icon: Angry, label: 'Enfadado' },
        { type: 'surprised', icon: Zap, label: 'Sorprendido' },
        { type: 'neutral', icon: Sparkles, label: 'Neutral' },
    ];

    return (
        <div className="p-4 space-y-6 rounded-2xl bg-card border border-border shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Keyboard className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold">Mapeo de Hotkeys</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Control de Expresiones</p>
                </div>
            </div>

            <div className="grid gap-3">
                {expressions.map(({ type, icon: Icon, label }) => {
                    const mapping = hotkeyMappings.find(m => m.expression === type);
                    const isRecording = recordingKey === type;
                    const isActive = activeExpression === type;

                    return (
                        <div
                            key={type}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl border transition-all",
                                isActive ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-muted/30 border-transparent hover:border-border"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isActive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{label}</div>
                                    <div className="text-[10px] text-muted-foreground capitalize">{type}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={isRecording ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-8 px-4 font-mono text-xs min-w-[60px]",
                                        isRecording && "animate-pulse"
                                    )}
                                    onClick={() => setRecordingKey(type)}
                                >
                                    {isRecording ? "Presiona una tecla..." : mapping?.key || "Sin asignar"}
                                </Button>

                                {mapping && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={() => removeHotkeyMapping(mapping.key)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Tip:</span> Pulsa la tecla asignada durante tu stream para cambiar la expresión de tu avatar instantáneamente. No funciona mientras escribes en el chat.
                </p>
            </div>
        </div>
    );
};
