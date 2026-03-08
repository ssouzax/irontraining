import { ReactNode, useState } from 'react';
import { Home, Dumbbell, PlusCircle, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileHomeFeed } from './MobileHomeFeed';
import { MobileCreatePost } from './MobileCreatePost';
import { MobileRankings } from './MobileRankings';
import { MobileProfile } from './MobileProfile';
import { NotificationBell } from '../NotificationBell';

type Tab = 'home' | 'workout' | 'post' | 'rankings' | 'profile';

const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
  { key: 'home', icon: Home, label: 'Home' },
  { key: 'workout', icon: Dumbbell, label: 'Treino' },
  { key: 'post', icon: PlusCircle, label: 'Post' },
  { key: 'rankings', icon: Trophy, label: 'Ranking' },
  { key: 'profile', icon: User, label: 'Perfil' },
];

interface MobileLayoutProps {
  workoutContent: ReactNode;
}

export function MobileLayout({ workoutContent }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base tracking-tight">PowerBuild</span>
        </div>
        <NotificationBell />
      </header>

      {/* Content */}
      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        {activeTab === 'home' && <MobileHomeFeed />}
        {activeTab === 'workout' && (
          <div className="p-4">{workoutContent}</div>
        )}
        {activeTab === 'post' && <MobileCreatePost onPostCreated={() => setActiveTab('home')} />}
        {activeTab === 'rankings' && <MobileRankings />}
        {activeTab === 'profile' && <MobileProfile />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            const isPost = tab.key === 'post';
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 transition-colors",
                  isPost && "relative -mt-4"
                )}
              >
                {isPost ? (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <tab.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                ) : (
                  <tab.icon className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                  isPost && "mt-0.5"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
