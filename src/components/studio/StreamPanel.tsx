import { Copy, ExternalLink, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { useToast } from '@/hooks/use-toast';

export const StreamPanel = () => {
  const { background, setBackground } = useAvatarStore();
  const { toast } = useToast();
  const t = useTranslation();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Use published URL for OBS (preview URLs require Lovable auth)
  const isPreview = window.location.hostname.includes('lovableproject.com') || window.location.hostname.includes('lovable.app') && window.location.hostname.includes('preview');
  const publishedOrigin = 'https://streamavatar.lovable.app';
  const baseOrigin = isPreview ? publishedOrigin : window.location.origin;
  const bgParam = background ? `?bg=${background}` : '';
  const cleanViewUrl = `${baseOrigin}/view${bgParam}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanViewUrl);
    toast({
      title: t.linkCopied,
      description: t.useAsOBS,
    });
  };

  const handleOpenCleanView = () => {
    window.open(cleanViewUrl, '_blank');
  };

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  return (
    <div className="space-y-4">
      {/* OBS Setup Section */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{t.obsSetup}</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          {t.obsInstructions}
        </p>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 gap-2"
          >
            <Copy className="w-4 h-4" />
            {t.copyLink}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCleanView}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {t.openPreview}
          </Button>
        </div>
      </div>

      {/* Step-by-step Guide */}
      <div className="glass-panel p-4 space-y-2">
        <h4 className="text-sm font-medium mb-3">Guía paso a paso</h4>

        {/* Step 1 */}
        <button
          onClick={() => toggleStep(1)}
          className="w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
            Elige un fondo Chroma
          </span>
          {expandedStep === 1 ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expandedStep === 1 && (
          <div className="pl-9 pb-2 text-xs text-muted-foreground space-y-1">
            <p>Selecciona <strong>Chroma Green</strong> o <strong>Chroma Blue</strong> abajo para que OBS pueda eliminar el fondo.</p>
          </div>
        )}

        {/* Step 2 */}
        <button
          onClick={() => toggleStep(2)}
          className="w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
            Copia el link y pégalo en OBS
          </span>
          {expandedStep === 2 ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expandedStep === 2 && (
          <div className="pl-9 pb-2 text-xs text-muted-foreground space-y-1">
            <p>1. Copia el link con el botón de arriba</p>
            <p>2. En OBS: <strong>Fuentes → + → Navegador</strong></p>
            <p>3. Pega la URL, ancho <strong>1920</strong>, alto <strong>1080</strong></p>
            <p>4. Acepta</p>
          </div>
        )}

        {/* Step 3 */}
        <button
          onClick={() => toggleStep(3)}
          className="w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
            Aplica el filtro Chroma Key
          </span>
          {expandedStep === 3 ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expandedStep === 3 && (
          <div className="pl-9 pb-2 text-xs text-muted-foreground space-y-1">
            <p>1. Clic derecho en la fuente <strong>"StreamAvatar"</strong></p>
            <p>2. Selecciona <strong>Filtros</strong></p>
            <p>3. Clic en <strong>+</strong> → <strong>Clave cromática</strong></p>
            <p>4. Color clave: <strong>Verde</strong> (o Azul si usaste Chroma Blue)</p>
            <p>5. Similitud: <strong>400-600</strong> (ajusta hasta que el fondo desaparezca)</p>
            <p>6. Suavidad: <strong>20-80</strong> (para bordes más limpios)</p>
            <p>7. Cierra el diálogo de filtros</p>
          </div>
        )}

        {/* Step 4 */}
        <button
          onClick={() => toggleStep(4)}
          className="w-full flex items-center justify-between text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">4</span>
            Posiciona y transmite
          </span>
          {expandedStep === 4 ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expandedStep === 4 && (
          <div className="pl-9 pb-2 text-xs text-muted-foreground space-y-1">
            <p>1. Arrastra y redimensiona el avatar en el preview de OBS</p>
            <p>2. Colócalo sobre tu gameplay (esquina inferior)</p>
            <p>3. ¡Listo! Inicia tu stream normalmente</p>
          </div>
        )}
      </div>

      {/* Quick Background Selector */}
      <div className="glass-panel p-4 space-y-3">
        <h4 className="text-sm font-medium">{t.quickBackground}</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={background === 'chroma-green' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('chroma-green')}
          >
            {t.chromaGreen}
          </Button>
          <Button
            variant={background === 'chroma-blue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('chroma-blue')}
          >
            {t.chromaBlue}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={background === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('dark')}
          >
            {t.dark}
          </Button>
          <Button
            variant={background === 'transparent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('transparent')}
          >
            {t.transparent}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 pt-2">
          <Button
            variant={background === 'splat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('splat')}
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
          >
            {t.splat}
          </Button>
        </div>
      </div>

      {/* Documentation Link */}
      <a
        href="https://github.com/MRamiBalles/streamavatar/blob/main/docs/OBS_SETUP_GUIDE.md"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-sm text-primary hover:underline py-2"
      >
        {t.viewFullGuide} →
      </a>
    </div>
  );
};
