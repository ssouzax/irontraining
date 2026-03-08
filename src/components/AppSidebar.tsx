import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Calendar, BarChart3, Bot, User, Zap, LogOut, Menu, X, Calculator, Sparkles, Trophy, BookOpen, Award, Users, FolderOpen, Crown, Compass, Download, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/program', icon: Calendar, label: 'Programa' },
  { to: '/programs', icon: FolderOpen, label: 'Meus Programas' },
  { to: '/generate', icon: Sparkles, label: 'Gerar Programa' },
  { to: '/workout', icon: Dumbbell, label: 'Treino' },
  { to: '/train', icon: Zap, label: 'Modo App' },
  { to: '/analytics', icon: BarChart3, label: 'Análises' },
  { to: '/rankings', icon: Trophy, label: 'Ranking' },
  { to: '/leaderboard', icon: Crown, label: 'Ranking DOTS' },
  { to: '/achievements', icon: Award, label: 'Conquistas' },
  { to: '/feed', icon: Users, label: 'Feed Social' },
  { to: '/discover', icon: Compass, label: 'Explorar' },
  { to: '/exercises', icon: BookOpen, label: 'Exercícios' },
  { to: '/plates', icon: Calculator, label: 'Anilhas' },
  { to: '/coach', icon: Bot, label: 'Coach IA' },
  { to: '/profile', icon: User, label: 'Perfil' },
  { to: '/install', icon: Download, label: 'Instalar App' },
];

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navContent = (
    <>
      <div className="flex items-center justify-between p-4 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">PowerBuild</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              <span>{item.label}</span>
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border card-elevated"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 w-[280px] h-screen z-50 flex flex-col border-r border-border bg-sidebar lg:hidden"
          >
            {navContent}
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex fixed left-0 top-0 w-[240px] h-screen z-40 flex-col border-r border-border bg-sidebar">
        {navContent}
      </aside>
    </>
  );
}
