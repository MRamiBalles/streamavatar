import { useState } from 'react';
import { Home, User, Radio, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvatarStore } from '@/stores/avatarStore';

type TabType = 'studio' | 'avatar' | 'stream' | 'settings';

interface StudioSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'studio' as const, label: 'Studio', icon: Home },
  { id: 'avatar' as const, label: 'Avatar', icon: User },
  { id: 'stream' as const, label: 'Stream', icon: Radio },
  { id: 'settings' as const, label: 'Ajustes', icon: Settings },
];

export const StudioSidebar = ({ activeTab, onTabChange }: StudioSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isLive } = useAvatarStore();

  return (
    <div className={cn(
      "relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center neon-glow-sm">
            <span className="text-lg font-bold text-white">SA</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-sm gradient-text">StreamAvatar</h1>
              <p className="text-[10px] text-muted-foreground">Studio</p>
            </div>
          )}
        </div>
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className={cn(
          "mx-3 mt-3 py-2 px-3 rounded-lg bg-destructive/20 border border-destructive/50",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-destructive animate-ping" />
            </div>
            {!collapsed && (
              <span className="text-xs font-semibold text-destructive uppercase tracking-wider">EN VIVO</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground neon-border" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <span className="text-sm font-medium">{tab.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
};
