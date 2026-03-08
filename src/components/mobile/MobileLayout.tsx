import { ReactNode, useState, useRef, useEffect } from 'react';
import { Home, Dumbbell, PlusCircle, Trophy, User, Menu, X, LayoutDashboard, Calendar, Sparkles, Zap, BarChart3, Crown, Award, Users, Compass, BookOpen, Calculator, Bot, FolderOpen, Download, MapPin, Swords, Brain, Flame, Radio, Star, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileHomeFeed } from './MobileHomeFeed';
import { MobileCreatePost } from './MobileCreatePost';
import { MobileRankings } from './MobileRankings';
import { MobileProfile } from './MobileProfile';
import { MobileGymPage } from './MobileGymPage';
import { MobileRivals } from './MobileRivals';
import { MobilePowerScore } from './MobilePowerScore';
import { MobilePredictor } from './MobilePredictor';
import { MobileExplore } from './MobileExplore';
import { MobileGymHeatmap } from './MobileGymHeatmap';
import { MobileGymPoints } from './MobileGymPoints';
import { MobileExerciseLeaderboard } from './MobileExerciseLeaderboard';
import { MobileLiveGym } from './MobileLiveGym';
import { MobileWrappedCards } from './MobileWrappedCards';
import { MobileGymMap } from './MobileGymMap';
import { NotificationBell } from '../NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'home' | 'workout' | 'post' | 'rankings' | 'profile' | 'gym' | 'gymmap' | 'rivals' | 'powerscore' | 'predictor' | 'explore' | 'heatmap' | 'gympoints' | 'exerciserankings' | 'livegym' | 'wrapped';

const bottomTabs: { key: Tab; icon: typeof Home; label: string }[] = [
  { key: 'home', icon: Home, label: 'Home' },
  { key: 'workout', icon: Dumbbell, label: 'Treino' },
  { key: 'post', icon: PlusCircle, label: 'Post' },
  { key: 'rankings', icon: Trophy, label: 'Ranking' },
  { key: 'profile', icon: User, label: 'Perfil' },
];

const menuItems = [
  { key: 'home' as Tab, icon: LayoutDashboard, label: 'Painel / Feed' },
  { key: 'workout' as Tab, icon: Dumbbell, label: 'Treino Atual' },
  { key: 'explore' as Tab, icon: Compass, label: 'Explorar' },
  { key: 'livegym' as Tab, icon: Radio, label: 'Live Gym' },
  { key: 'heatmap' as Tab, icon: Flame, label: 'Mapa de Força' },
  { key: 'rankings' as Tab, icon: Crown, label: 'Leaderboard DOTS' },
  { key: 'exerciserankings' as Tab, icon: Dumbbell, label: 'Ranking Exercícios' },
  { key: 'gym' as Tab, icon: MapPin, label: 'Minha Academia' },
  { key: 'gymmap' as Tab, icon: Map, label: 'Mapa de Academias' },
  { key: 'gympoints' as Tab, icon: Star, label: 'Gym Points' },
  { key: 'rivals' as Tab, icon: Swords, label: 'Rivais de Força' },
  { key: 'powerscore' as Tab, icon: Zap, label: 'Power Score' },
  { key: 'predictor' as Tab, icon: Brain, label: 'Preditor IA' },
  { key: 'wrapped' as Tab, icon: Sparkles, label: 'Wrapped Cards' },
  { key: 'profile' as Tab, icon: User, label: 'Perfil' },
];

const extraMenuItems = [
  { icon: Calendar, label: 'Programa' , route: '/program' },
  { icon: FolderOpen, label: 'Meus Programas', route: '/programs' },
  { icon: Sparkles, label: 'Gerar Programa', route: '/generate' },
  { icon: Zap, label: 'Modo App Treino', route: '/train' },
  { icon: BarChart3, label: 'Análises', route: '/analytics' },
  { icon: Trophy, label: 'Ranking por Lift', route: '/rankings' },
  { icon: Award, label: 'Conquistas', route: '/achievements' },
  { icon: Users, label: 'Feed Social', route: '/feed' },
  { icon: Compass, label: 'Explorar', route: '/discover' },
  { icon: BookOpen, label: 'Exercícios', route: '/exercises' },
  { icon: Calculator, label: 'Calculadora de Anilhas', route: '/plates' },
  { icon: Bot, label: 'Coach IA', route: '/coach' },
  { icon: Download, label: 'Instalar App', route: '/install' },
];

interface MobileLayoutProps {
  workoutContent: ReactNode;
}

const tabOrder: Tab[] = ['home', 'workout', 'post', 'rankings', 'profile', 'gym', 'gymmap', 'rivals', 'powerscore', 'predictor', 'explore', 'heatmap', 'gympoints', 'exerciserankings', 'livegym', 'wrapped'];

export function MobileLayout({ workoutContent }: MobileLayoutProps) {
  // Detect if we're on a routed page (not home)
  const getInitialTab = (): Tab => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'home';
    // If it's a known route, show workout content (which holds the routed page)
    return 'workout';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [direction, setDirection] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const changeTab = (tab: Tab) => {
    const oldIdx = tabOrder.indexOf(activeTab);
    const newIdx = tabOrder.indexOf(tab);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(tab);
    // When switching to internal mobile tabs, go back to home route
    if (tab !== 'workout' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const navigateToTab = (tab: Tab) => {
    changeTab(tab);
    setMenuOpen(false);
  };

  const navigateToRoute = (route: string) => {
    setMenuOpen(false);
    window.location.href = route;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base tracking-tight">PowerBuild</span>
          </div>
        </div>
        <NotificationBell />
      </header>

      {/* Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-card border-r border-border flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">PowerBuild</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main tabs */}
              <div className="p-2 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 font-medium">Principal</p>
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => navigateToTab(item.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      activeTab === item.key
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="h-px bg-border mx-4" />

              {/* All features */}
              <div className="p-2 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2 font-medium">Todas as Funcionalidades</p>
                {extraMenuItems.map(item => (
                  <button
                    key={item.route}
                    onClick={() => navigateToRoute(item.route)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <item.icon className="w-5 h-5 shrink-0 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-auto p-4 border-t border-border">
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-5 h-5 shrink-0" />
                  Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 pt-14 pb-20 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {activeTab === 'home' && <MobileHomeFeed />}
            {activeTab === 'workout' && <div className="p-4">{workoutContent}</div>}
            {activeTab === 'post' && <MobileCreatePost onPostCreated={() => changeTab('home')} />}
            {activeTab === 'rankings' && <MobileRankings />}
            {activeTab === 'profile' && <MobileProfile />}
            {activeTab === 'gym' && <MobileGymPage />}
            {activeTab === 'gymmap' && <MobileGymMap />}
            {activeTab === 'rivals' && <MobileRivals />}
            {activeTab === 'powerscore' && <MobilePowerScore />}
            {activeTab === 'predictor' && <MobilePredictor />}
            {activeTab === 'explore' && <MobileExplore />}
            {activeTab === 'heatmap' && <MobileGymHeatmap />}
            {activeTab === 'gympoints' && <MobileGymPoints />}
            {activeTab === 'exerciserankings' && <MobileExerciseLeaderboard />}
            {activeTab === 'livegym' && <MobileLiveGym />}
            {activeTab === 'wrapped' && <MobileWrappedCards />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomTabs.map(tab => {
            const isActive = activeTab === tab.key;
            const isPost = tab.key === 'post';
            return (
              <button
                key={tab.key}
                onClick={() => changeTab(tab.key)}
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
