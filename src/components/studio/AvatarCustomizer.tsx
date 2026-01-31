import { useAvatarStore, useTranslation, BackgroundType } from '@/stores/avatarStore';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const presetColors = [
  '#c97d3d', // Peanut brown
  '#ff6b6b', // Coral
  '#4ecdc4', // Teal
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

export const AvatarCustomizer = () => {
  const { avatarColor, setAvatarColor, avatarScale, setAvatarScale, background, setBackground } = useAvatarStore();
  const t = useTranslation();

  const backgroundOptions: { type: BackgroundType; label: string; color: string }[] = [
    { type: 'dark', label: t.dark, color: 'bg-zinc-900' },
    { type: 'chroma-green', label: t.green, color: 'bg-green-500' },
    { type: 'chroma-blue', label: t.blue, color: 'bg-blue-600' },
    { type: 'transparent', label: t.transparent, color: 'bg-gradient-to-br from-gray-300 to-gray-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Color Picker */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {t.color}
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={avatarColor}
            onChange={(e) => setAvatarColor(e.target.value)}
            className="w-12 h-10 p-1 cursor-pointer border-2 border-border rounded-lg"
          />
          <div className="flex gap-1.5 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setAvatarColor(color)}
                className={cn(
                  "w-7 h-7 rounded-md transition-all hover:scale-110",
                  avatarColor === color && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scale Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t.scale}
          </Label>
          <span className="text-sm text-muted-foreground">{avatarScale.toFixed(1)}x</span>
        </div>
        <Slider
          value={[avatarScale]}
          onValueChange={([value]) => setAvatarScale(value)}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Background Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {t.background}
        </Label>
        <div className="flex gap-2">
          {backgroundOptions.map((bg) => (
            <button
              key={bg.type}
              onClick={() => setBackground(bg.type)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                background === bg.type 
                  ? "ring-2 ring-primary bg-secondary" 
                  : "hover:bg-secondary/50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-md border border-border",
                bg.color,
                bg.type === 'transparent' && "bg-[length:8px_8px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%)] bg-[position:0_0,4px_4px]"
              )} />
              <span className="text-[10px] text-muted-foreground">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};