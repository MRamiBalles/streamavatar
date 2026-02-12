import { Copy, ExternalLink, Monitor, ChevronDown, ChevronUp, Settings, PlayCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAvatarStore, useTranslation } from '@/stores/avatarStore';
import { useToast } from '@/hooks/use-toast';

/**
 * StreamPanel Component
 * 
 * Manages OBS integration settings and instructions.
 * Provides tools to copy the streaming URL and simulate the OBS view.
 */
export const StreamPanel = () => {
  // Access global state
  // Accede al estado global
  const selectedAvatar = useAvatarStore((s) => s.selectedAvatar);
  const avatarColor = useAvatarStore((s) => s.avatarColor);
  const avatarScale = useAvatarStore((s) => s.avatarScale);
  const background = useAvatarStore((s) => s.background);
  const setBackground = useAvatarStore((s) => s.setBackground);
  const publishedUrl = useAvatarStore((s) => s.publishedUrl);
  const setPublishedUrl = useAvatarStore((s) => s.setPublishedUrl);
  const isTracking = useAvatarStore((s) => s.isTracking);
  const toggleBackground = useAvatarStore((s) => s.toggleBackground);

  const t = useTranslation();
  const { toast } = useToast();

  // Local state for UI interaction
  // Estado local para interacción de UI
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState(publishedUrl || '');

  // Initialize temp URL from store on mount
  useEffect(() => {
    if (publishedUrl) setTempUrl(publishedUrl);
  }, [publishedUrl]);

  // Determine enviroment
  const isPreview = window.location.hostname.includes('lovableproject.com') || (window.location.hostname.includes('lovable.app') && window.location.hostname.includes('preview'));

  // Determine base origin
  const baseOrigin = publishedUrl
    ? publishedUrl.replace(/\/$/, '')
    : (isPreview ? 'https://streamavatar.lovable.app' : window.location.origin);

  // Construct query parameters for the Clean View URL
  // Construye parámetros de consulta para la URL de Vista Limpia
  const params = new URLSearchParams();
  if (background) params.append('bg', background);
  if (selectedAvatar) params.append('avatar', selectedAvatar);
  // Remove # from hex color for URL safety
  if (avatarColor) params.append('color', avatarColor.replace('#', ''));
  if (avatarScale !== 1) params.append('scale', avatarScale.toString());

  const cleanViewUrl = `${baseOrigin}/view?${params.toString()}`;

  // Handler to copy link to clipboard
  // Manejador para copiar enlace al portapapeles
  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanViewUrl);
    toast({
      title: t.linkCopied,
      description: t.useAsOBS,
    });
  };

  /**
   * Simulate OBS View
   * Opens the Clean View in a popup window sized exactly like a 1080p stream source (scaled down).
   * This allows testing the layout without needing OBS installed.
   * 
   * Simular Vista OBS
   * Abre la Vista Limpia en una ventana emergente dimensionada como una fuente de stream 1080p.
   * Permite probar el diseño sin necesitar OBS instalado.
   */
  const handleSimulateOBS = () => {
    // Open a popup window with 16:9 aspect ratio (1280x720 simulate 720p stream)
    // Abre una ventana popup con relación de aspecto 16:9 (1280x720 simula stream 720p)
    window.open(cleanViewUrl, 'obs-simulator', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  // Toggle guide steps visibility
  // Alterna visibilidad de pasos de guía
  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  // Save custom URL to store with validation
  // Guarda URL personalizada en el store con validación
  const handleSaveUrl = () => {
    if (!tempUrl.trim()) {
      // If empty, reset to default / Si está vacío, resetear a defecto
      setPublishedUrl(null); // Reset to default if empty
    } else {
      // Basic validation: ensure it starts with http/https
      // Validación básica: asegurar que empieza con http/https
      let formattedUrl = tempUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      setPublishedUrl(formattedUrl);
      setTempUrl(formattedUrl);
    }
    setIsEditingUrl(false);
    toast({
      title: "URL Actualizada / URL Updated",
      description: "El enlace de OBS ahora usa tu URL personalizada. / OBS link now uses your custom URL.",
    });
  };

  return (
    <div className="space-y-4">
      {/* OBS Setup Section / Sección de Configuración OBS */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <h3 className="font-medium">{t.obsSetup}</h3>
          </div>
          {/* Toggle for URL editing / Botón para editar URL */}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingUrl(!isEditingUrl)}>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t.obsInstructions}
        </p>

        {/* Custom URL Editor - Configurable! */}
        {/* Editor de URL Personalizada - ¡Configurable! */}
        {isEditingUrl && (
          <div className="p-3 bg-muted/30 rounded-md space-y-2 border border-border/50">
            <Label htmlFor="custom-url" className="text-xs font-semibold text-primary">
              URL Publicada / Published URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://tu-proyecto.lovable.app"
                className="h-8 text-xs"
              />
              <Button size="sm" onClick={handleSaveUrl} className="h-8">
                Guardar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Si el avatar no carga en OBS, asegúrate de que esta URL sea la correcta de tu proyecto publicado.
              <br />
              If avatar fails in OBS, ensure this URL matches your published project.
            </p>
          </div>
        )}

        {/* Action Buttons / Botones de Acción */}
        <div className="flex flex-col gap-2">
          {/* Environment Status Indicator / Indicador de Estado del Entorno */}
          {!publishedUrl && (
            <div className={`text-[11px] px-3 py-2 rounded-md border flex items-start gap-2 ${isPreview
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
              {isPreview ? (
                <>
                  <span className="mt-0.5">⚠️</span>
                  <span>
                    <strong>Preview Mode (Cloud):</strong> OBS might show a login screen because this link is private.
                    <br />
                    Use <strong>"Simulate OBS"</strong> or configure a <strong>Published URL</strong> above.
                  </span>
                </>
              ) : (
                <>
                  <span className="mt-0.5">✅</span>
                  <span>
                    <strong>Local Mode:</strong> You are on localhost. This link will work perfectly in OBS!
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {/* Display logic for current URL being used (debug helper) */}
            <div className="hidden">Using: {baseOrigin}</div>

            <Button
              variant="default"
              size="sm"
              onClick={handleCopyLink}
              className="flex-1 gap-2"
            >
              <Copy className="w-4 h-4" />
              {t.copyLink}
            </Button>

            {/* Simulate OBS Button - New Feature! */}
            {/* Botón Simular OBS - ¡Nueva Funcionalidad! */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateOBS}
              className="gap-2"
              title="Abre una ventana popup para probar sin OBS / Open popup to test without OBS"
            >
              <PlayCircle className="w-4 h-4 text-green-500" />
              Simular OBS
            </Button>
          </div>
        </div>
      </div>

      {/* Step-by-step Guide / Guía Paso a Paso */}
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
            {/* Added helpful tip about URL */}
            <p className="text-yellow-500/80 mt-1 font-semibold">
              ⚠️ Si ves la pantalla de login, clic en el engranaje arriba y pega tu URL publicada correcta.
            </p>
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

      {/* Quick Background Selector / Selector Rápido de Fondo */}
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

        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Splat Button */}
          <Button
            variant={background === 'splat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('splat')}
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
            title="Experimental Gaussian Splatting"
          >
            {t.splat}
          </Button>

          {/* AR Camera Button */}
          <Button
            variant={background === 'ar-camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBackground('ar-camera')}
            className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10"
            title="Use your webcam as background + Head Tracking"
          >
            <Camera className="w-4 h-4 mr-2" />
            AR Camera
          </Button>
        </div>
      </div>

      {/* Documentation Link / Enlace a Documentación */}
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
