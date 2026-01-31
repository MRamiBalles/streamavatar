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

type TabType = 'studio' | 'avatar' | 'stream' | 'settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const t = useTranslation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <StudioSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex">
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
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold text-lg">
              {activeTab === 'studio' && t.controlPanel}
              {activeTab === 'avatar' && t.configureAvatar}
              {activeTab === 'stream' && t.streamDestinations}
              {activeTab === 'settings' && t.settings}
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
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
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Index;
