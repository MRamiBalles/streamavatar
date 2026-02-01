import { Plus, Trash2, Move, RotateCw, Maximize, Eye, EyeOff } from 'lucide-react';
import { useAvatarStore, AvatarPart } from '@/stores/avatarStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export const ComposerPanel = () => {
    const { currentParts, addPart, removePart, updatePart, saveCurrentAsPreset } = useAvatarStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [presetName, setPresetName] = useState('');

    const selectedPart = currentParts.find(p => p.id === selectedId);

    const handleUpdate = (updates: Partial<AvatarPart>) => {
        if (selectedId) updatePart(selectedId, updates);
    };

    const partTypes: AvatarPart['type'][] = ['sphere', 'box', 'cylinder', 'torus', 'head', 'body'];

    return (
        <div className="space-y-6">
            {/* Add Parts */}
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                    Añadir Piezas
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    {partTypes.map(type => (
                        <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => addPart(type)}
                            className="text-[10px] capitalize h-8"
                        >
                            <Plus className="w-3 h-3 mr-1" /> {type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Parts List */}
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                    Jerarquía de Piezas
                </Label>
                <ScrollArea className="h-40 border rounded-lg bg-background/50">
                    <div className="p-2 space-y-1">
                        {currentParts.map((part) => (
                            <div
                                key={part.id}
                                onClick={() => setSelectedId(part.id)}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                                    selectedId === part.id ? "bg-primary/20 border-primary/30 border" : "hover:bg-accent"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium capitalize">{part.type}</span>
                                    <span className="text-[10px] opacity-50 font-mono">{part.id.slice(0, 4)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updatePart(part.id, { visible: !part.visible });
                                        }}
                                    >
                                        {part.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removePart(part.id);
                                            if (selectedId === part.id) setSelectedId(null);
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Transformation Controls */}
            {selectedPart && (
                <div className="space-y-6 p-4 rounded-xl bg-accent/20 border border-border animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold capitalize">{selectedPart.type} Settings</h4>
                        <Input
                            type="color"
                            value={selectedPart.color}
                            onChange={(e) => handleUpdate({ color: e.target.value })}
                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                        />
                    </div>

                    {/* Position */}
                    <TransformControl
                        label="Posición"
                        icon={<Move className="w-3 h-3" />}
                        values={selectedPart.position}
                        onChange={(val) => handleUpdate({ position: val as [number, number, number] })}
                        min={-5}
                        max={5}
                    />

                    {/* Rotation */}
                    <TransformControl
                        label="Rotación"
                        icon={<RotateCw className="w-3 h-3" />}
                        values={selectedPart.rotation}
                        onChange={(val) => handleUpdate({ rotation: val as [number, number, number] })}
                        min={-Math.PI}
                        max={Math.PI}
                    />

                    {/* Scale */}
                    <TransformControl
                        label="Escala"
                        icon={<Maximize className="w-3 h-3" />}
                        values={selectedPart.scale}
                        onChange={(val) => handleUpdate({ scale: val as [number, number, number] })}
                        min={0.1}
                        max={3}
                    />
                </div>
            )}

            {/* Save Area */}
            {currentParts.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                    <Input
                        placeholder="Nombre del preset..."
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="h-8 text-xs"
                    />
                    <Button
                        className="w-full"
                        disabled={!presetName}
                        onClick={() => {
                            saveCurrentAsPreset(presetName);
                            setPresetName('');
                        }}
                    >
                        Guardar en Galería
                    </Button>
                </div>
            )}
        </div>
    );
};

const TransformControl = ({ label, icon, values, onChange, min, max }: any) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {icon} {label}
        </div>
        <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis} className="space-y-1">
                    <Slider
                        value={[values[i]]}
                        onValueChange={([val]) => {
                            const newVals = [...values];
                            newVals[i] = val;
                            onChange(newVals);
                        }}
                        min={min}
                        max={max}
                        step={0.1}
                    />
                    <div className="text-[8px] text-center font-mono opacity-50">{axis}: {values[i].toFixed(1)}</div>
                </div>
            ))}
        </div>
    </div>
);
