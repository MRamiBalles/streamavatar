import { Pill, Box, Circle, Cat, Ghost, Smile, Upload } from 'lucide-react';
import { useAvatarStore, AvatarType } from '@/stores/avatarStore';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const avatarOptions: { type: AvatarType; name: string; icon: React.ElementType; description: string }[] = [
  { type: 'pill', name: 'Cacahuete', icon: Pill, description: 'Peanut style' },
  { type: 'boxy', name: 'Robot', icon: Box, description: 'Boxy vibes' },
  { type: 'sphere', name: 'Slime', icon: Circle, description: 'Cute blob' },
  { type: 'cat', name: 'Gato', icon: Cat, description: 'Meow!' },
  { type: 'ghost', name: 'Fantasma', icon: Ghost, description: 'Boo!' },
  { type: 'emoji', name: 'Emoji', icon: Smile, description: 'Classic face' },
];

export const AvatarSelector = () => {
  const { selectedAvatar, setSelectedAvatar, setCustomModel, customModel } = useAvatarStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'glb' && extension !== 'vrm') {
      toast({
        title: "Formato no soportado",
        description: "Solo se permiten archivos .GLB o .VRM",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setCustomModel({
      url,
      name: file.name,
      type: extension as 'glb' | 'vrm',
    });

    toast({
      title: "¡Modelo cargado!",
      description: `${file.name} listo para usar`,
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Seleccionar Avatar
      </h3>
      
      {/* Built-in avatars */}
      <div className="grid grid-cols-3 gap-2">
        {avatarOptions.map((avatar) => {
          const Icon = avatar.icon;
          const isSelected = selectedAvatar === avatar.type;
          
          return (
            <button
              key={avatar.type}
              onClick={() => setSelectedAvatar(avatar.type)}
              className={cn(
                "avatar-card flex flex-col items-center gap-2 p-3 transition-all",
                isSelected && "selected"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Import custom model */}
      <div className="pt-2 border-t border-border">
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.vrm"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full avatar-card flex items-center justify-center gap-2 p-3 transition-all",
            selectedAvatar === 'custom' && customModel && "selected"
          )}
        >
          <Upload className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-xs font-medium">
              {customModel ? customModel.name : 'Importar .VRM / .GLB'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {customModel ? `Tipo: ${customModel.type.toUpperCase()}` : 'Modelo 3D personalizado'}
            </p>
          </div>
        </button>

        {customModel && (
          <button
            onClick={() => {
              URL.revokeObjectURL(customModel.url);
              setCustomModel(null);
              setSelectedAvatar('pill');
            }}
            className="w-full mt-2 text-xs text-destructive hover:underline"
          >
            Eliminar modelo personalizado
          </button>
        )}
      </div>
    </div>
  );
};
