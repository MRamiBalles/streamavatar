import { useState } from 'react';
import { StudioSidebar } from '@/components/studio/StudioSidebar';
import { AvatarRenderer } from '@/components/avatars/AvatarRenderer';
import { AvatarSelector } from '@/components/studio/AvatarSelector';
import { AvatarCustomizer } from '@/components/studio/AvatarCustomizer';
import { CameraControls } from '@/components/studio/CameraControls';
import { StreamPanel } from '@/components/studio/StreamPanel';
import { SettingsPanel } from '@/components/studio/SettingsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/stores/avatarStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

type TabType = 'studio' | 'avatar' | 'stream' | 'settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslation();

  const getPanelTitle = () => {
    switch (activeTab) {
      case 'studio': return t.controlPanel;
      case 'avatar': return t.configureAvatar;
      case 'stream': return t.obsSetup;
      case 'settings': return t.settings;
    }
  };

  const PanelContent = () => (
    <div className="p-4 space-y-6">
      {/* Studio Tab */}
      {activeTab === 'studio' && (
        <>
          <CameraControls />
          <div className="h-px bg-border" />
          <AvatarSelector />
          <div className="h-px bg-border" />
          <StreamPanel />
        </>
      )}

      {/* Avatar Tab */}
      {activeTab === 'avatar' && (
        <>
          <AvatarSelector />
          <div className="h-px bg-border" />
          <AvatarCustomizer />
        </>
      )}

      {/* Stream Tab */}
      {activeTab === 'stream' && (
        <StreamPanel />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SettingsPanel />
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <StudioSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center">
              <span className="text-sm font-bold text-white">SA</span>
            </div>
            <span className="font-display font-bold text-sm gradient-text">StreamAvatar</span>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle>{getPanelTitle()}</SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Tabs */}
              <div className="flex border-b border-border">
                {(['studio', 'avatar', 'stream', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === tab
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab === 'studio' && t.studio}
                    {tab === 'avatar' && t.avatar}
                    {tab === 'stream' && t.obsSetup}
                    {tab === 'settings' && t.settings}
                  </button>
                ))}
              </div>

              <ScrollArea className="h-[calc(100vh-120px)]">
                <PanelContent />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center - Avatar Canvas */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 relative">
            <AvatarRenderer />

            {/* Overlay controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
              <div className="glass-panel p-3 pointer-events-auto">
                <p className="text-xs text-muted-foreground mb-1">{t.preview}</p>
                <p className="text-sm font-medium">{t.dragToRotate}</p>
              </div>

              {/* Mobile menu hint */}
              <div className="md:hidden glass-panel p-3 pointer-events-auto">
                <p className="text-xs text-muted-foreground">
                  Toca <Menu className="w-3 h-3 inline" /> para opciones
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Hidden on mobile, use Sheet instead */}
        <div className="hidden md:flex w-80 border-l border-border bg-card/50 flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold text-lg">
              {getPanelTitle()}
            </h2>
          </div>

          <ScrollArea className="flex-1">
            <PanelContent />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Index;