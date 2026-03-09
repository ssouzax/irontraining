import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Crown, Zap, Star, ArrowRight, Shield, Sparkles, Brain, Dumbbell, Users, MapPin, Gift, Flame, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/iron-training-logo.png';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  interval: string;
  tier: string;
  features: string[];
  kiwify_product_id: string | null;
}

function PlanCard({ plan, isPopular, isCurrent, delay }: { plan: Plan; isPopular: boolean; isCurrent: boolean; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const price = (plan.price_cents / 100).toFixed(2).replace('.', ',');
  const period = plan.interval === 'yearly' ? 'ano' : 'mês';

  const handleSubscribe = () => {
    if (plan.kiwify_product_id) {
      window.open(`https://pay.kiwify.com.br/${plan.kiwify_product_id}`, '_blank');
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.03, y: -8 }}
      className={cn(
        'relative p-6 rounded-2xl border backdrop-blur-sm flex flex-col',
        isPopular
          ? 'border-primary/60 bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]'
          : 'border-border/50 bg-card/60',
        isCurrent && 'ring-2 ring-success'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" /> MAIS POPULAR
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-success text-success-foreground text-xs font-bold">
          PLANO ATUAL
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-extrabold text-foreground">R${price}</span>
        <span className="text-sm text-muted-foreground">/{period}</span>
        {plan.interval === 'yearly' && (
          <p className="text-xs text-success mt-1 font-semibold">~2 meses grátis!</p>
        )}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {!isCurrent && plan.kiwify_product_id && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <strong>Lembre-se:</strong> Use o email cadastrado no app
          </div>
        </div>
      )}

      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <Button
          onClick={handleSubscribe}
          className={cn(
            'w-full py-6 rounded-xl font-bold text-sm',
            isPopular && 'shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.7)]'
          )}
          variant={isPopular ? 'default' : 'secondary'}
          disabled={isCurrent}
        >
          {isCurrent ? 'Plano Atual' : 'Assinar Agora'}
          {!isCurrent && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function SubscribePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { planId, isPremium, tier } = usePremium();

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents')
      .then(({ data }) => {
        if (data) setPlans(data.map(p => ({ ...p, features: (p.features as any) || [] })));
      });
  }, []);

  const filtered = plans.filter(p =>
    billingInterval === 'yearly' ? p.interval === 'yearly' : p.interval === 'monthly'
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <img src={logoImg} alt="Iron Training" className="w-12 h-12 object-contain" />
          <Crown className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-extrabold mb-3">
          Escolha seu <span className="text-gradient">plano</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Desbloqueie o potencial máximo do Iron Training. Todos os planos incluem 7 dias de teste grátis.
        </p>

        {/* Email warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 max-w-2xl mx-auto"
        >
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            IMPORTANTE: Use o mesmo email cadastrado no app ao fazer a compra
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Seu plano será ativado automaticamente quando os emails coincidirem
          </p>
        </motion.div>

        {/* Interval toggle */}
        <div className="flex items-center justify-center gap-2 mt-8 p-1 bg-secondary rounded-xl inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              billingInterval === 'monthly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold transition-all relative',
              billingInterval === 'yearly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Anual
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-success text-success-foreground text-[9px] font-bold rounded-full">
              -40%
            </span>
          </button>
        </div>
      </div>

      {/* Free Plan */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-center mb-4">Plano Gratuito</h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto p-6 rounded-2xl border border-border/50 bg-card/40"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground">Grátis</h3>
            <p className="text-xs text-muted-foreground mt-1">Recursos essenciais para começar</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-foreground">R$0</span>
            <span className="text-sm text-muted-foreground">/para sempre</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {[
              'Programas de treino básicos',
              'Registro de séries e repetições',
              'Treinos personalizados',
              'Conquistas e gamificação',
              'Feed social e interações',
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full" variant="outline" disabled>
            Plano Atual
          </Button>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-center mb-4">Planos Premium</h2>
        <div className={cn(
          'grid gap-6 mb-16',
          filtered.length <= 1 ? 'max-w-md mx-auto' : filtered.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'
        )}>
          {filtered.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isPopular={plan.tier === 'standard' || (billingInterval === 'yearly' && plan.tier === 'premium')}
              isCurrent={planId === plan.id}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Features comparison */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">O que cada plano inclui</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Dumbbell, title: 'Treinos', desc: 'Programas e tracker de séries', tier: 'Todos' },
            { icon: Flame, title: 'Streaks & XP', desc: 'Gamificação básica e conquistas', tier: 'Todos' },
            { icon: Users, title: 'Feed Social', desc: 'Posts, curtidas e comentários', tier: 'Todos' },
            { icon: Brain, title: 'IA Coach', desc: 'Análise avançada de treino', tier: 'Básico+' },
            { icon: Zap, title: 'Previsor de PRs', desc: 'Algoritmo preditivo de recordes', tier: 'Básico+' },
            { icon: Shield, title: 'Mentoria VIP', desc: 'Feedback detalhado e periodização', tier: 'Padrão+' },
            { icon: Sparkles, title: 'Dieta IA', desc: 'Plano alimentar personalizado', tier: 'Premium' },
            { icon: MapPin, title: 'Gym Heatmap', desc: 'Mapa avançado e analytics', tier: 'Premium' },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-border/50 bg-card/40"
            >
              <div className="flex items-center gap-3 mb-2">
                <feat.icon className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm text-foreground">{feat.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{feat.desc}</p>
              <span className="text-[10px] font-bold text-primary mt-2 inline-block">{feat.tier}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pb-8">
        <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Pagamento seguro via Kiwify</div>
        <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Cancele quando quiser</div>
        <div className="flex items-center gap-2"><Gift className="w-4 h-4" /> 7 dias grátis</div>
      </div>
    </div>
  );
}