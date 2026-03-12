import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Calendar, BarChart3, Bot, User, Zap, LogOut, Menu, X, Calculator, Sparkles, Trophy, BookOpen, Award, Users, FolderOpen, Crown, Compass, Download, MapPin, Swords, Brain, Scale, Activity, HeartHandshake, Gauge, Heart, RotateCw, CheckCircle, ShoppingBag, CreditCard, Star, Shield, Utensils, Megaphone, HelpCircle, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumLockBadge } from '@/components/PremiumLock';
import { PremiumTier } from '@/hooks/usePremium';
import logoImg from '@/assets/iron-training-logo.png';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  requiredTier?: PremiumTier;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/program', icon: Calendar, label: 'Programa' },
  { to: '/programs', icon: FolderOpen, label: 'Meus Programas' },
  { to: '/generate', icon: Sparkles, label: 'Gerar Programa', requiredTier: 'basic' },
  { to: '/workout', icon: Dumbbell, label: 'Treino' },
  { to: '/train', icon: Zap, label: 'Modo App' },
  { to: '/training-notes', icon: MessageSquare, label: 'Anotações' },
  { to: '/analytics', icon: BarChart3, label: 'Análises', requiredTier: 'basic' },
  { to: '/rankings', icon: Trophy, label: 'Ranking' },
  { to: '/leaderboard', icon: Crown, label: 'Ranking DOTS' },
  { to: '/gym', icon: MapPin, label: 'Minha Academia' },
  { to: '/rivals', icon: Swords, label: 'Rivais' },
  { to: '/powerscore', icon: Zap, label: 'Power Score', requiredTier: 'standard' },
  { to: '/predictor', icon: Brain, label: 'Preditor IA', requiredTier: 'basic' },
  { to: '/achievements', icon: Award, label: 'Conquistas' },
  { to: '/feed', icon: Users, label: 'Feed Social' },
  { to: '/discover', icon: Compass, label: 'Explorar' },
  { to: '/exercises', icon: BookOpen, label: 'Exercícios' },
  { to: '/plates', icon: Calculator, label: 'Anilhas' },
  { to: '/coach', icon: Bot, label: 'Coach IA', requiredTier: 'premium' },
  { to: '/body', icon: Scale, label: 'Evolução Corporal', requiredTier: 'standard' },
  { to: '/prsimulator', icon: Brain, label: 'Simulador PR', requiredTier: 'standard' },
  { to: '/recovery', icon: Activity, label: 'Recuperação', requiredTier: 'standard' },
  { to: '/cotraining', icon: HeartHandshake, label: 'Co-Training', requiredTier: 'standard' },
  { to: '/barvelocity', icon: Gauge, label: 'Velocidade Barra', requiredTier: 'premium' },
  { to: '/wearable', icon: Heart, label: 'Wearable', requiredTier: 'premium' },
  { to: '/replay3d', icon: RotateCw, label: 'Replay 3D', requiredTier: 'premium' },
  { to: '/grading', icon: CheckCircle, label: 'Notas Execução', requiredTier: 'basic' },
  { to: '/diet', icon: Utensils, label: 'Dieta IA', requiredTier: 'premium' },
  { to: '/subscribe', icon: Crown, label: 'Planos Premium' },
  { to: '/shop', icon: ShoppingBag, label: 'Loja' },
  { to: '/premium-content', icon: Star, label: 'Conteúdo Premium', requiredTier: 'premium' },
  { to: '/influencer', icon: Megaphone, label: 'Influenciadores' },
  { to: '/admin', icon: Shield, label: 'Painel Admin' },
  { to: '/groups', icon: Users, label: 'Grupos' },
  { to: '/profile', icon: User, label: 'Perfil' },
  { to: '/help', icon: HelpCircle, label: 'Central de Ajuda' },
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
          <img src={logoImg} alt="Iron Training" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-foreground text-sm tracking-tight">Iron Training</span>
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
              <span className="flex-1">{item.label}</span>
              {item.requiredTier && <PremiumLockBadge requiredTier={item.requiredTier} />}
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
