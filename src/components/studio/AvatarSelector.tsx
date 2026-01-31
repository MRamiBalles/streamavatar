import { Pill, Box, Circle } from 'lucide-react';
import { useAvatarStore, AvatarType } from '@/stores/avatarStore';
import { cn } from '@/lib/utils';

const avatarOptions: { type: AvatarType; name: string; icon: React.ElementType; description: string }[] = [
  { type: 'pill', name: 'The Pill', icon: Pill, description: 'Peanut style' },
  { type: 'boxy', name: 'Boxy', icon: Box, description: 'Robot vibes' },
  { type: 'sphere', name: 'Slime', icon: Circle, description: 'Cute blob' },
];

export const AvatarSelector = () => {
  const { selectedAvatar, setSelectedAvatar } = useAvatarStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Seleccionar Avatar
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {avatarOptions.map((avatar) => {
          const Icon = avatar.icon;
          const isSelected = selectedAvatar === avatar.type;
          
          return (
            <button
              key={avatar.type}
              onClick={() => setSelectedAvatar(avatar.type)}
              className={cn(
                "avatar-card flex flex-col items-center gap-2 p-4 transition-all",
                isSelected && "selected"
              )}
            >
              <Icon 
                className={cn(
                  "w-8 h-8 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
