import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Brain, TrendingUp, Users, Flame, MapPin, Zap, Trophy, 
  ChevronDown, Star, Shield, Crown, Sparkles, Target, 
  Dumbbell, Heart, Award, Download, ArrowRight, Check,
  Smartphone, Gift, Lock, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/iron-training-logo.png';

/* ───────────────────── Helpers ───────────────────── */

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─────── Particles Background ─────── */
function ParticlesHero() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -80 - Math.random() * 120],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Gradient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-info/5 blur-[100px]" />
    </div>
  );
}

/* ─────── Streak Fire Animation ─────── */
function AnimatedFire({ size = 80 }: { size?: number }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.15, 1], rotate: [0, -3, 3, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span style={{ fontSize: size * 0.7 }} className="drop-shadow-[0_0_20px_hsl(var(--destructive)/0.6)]">🔥</span>
    </motion.div>
  );
}

/* ─────── Feature Card ─────── */
function FeatureCard({ icon: Icon, title, desc, delay = 0 }: { icon: any; title: string; desc: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: 15 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.04, rotateY: 5, boxShadow: '0 0 40px -10px hsl(var(--primary) / 0.4)' }}
      className="group relative p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ─────── Pricing Card ─────── */
function PricingCard({ name, price, period, features, popular = false, delay = 0 }: {
  name: string; price: string; period: string; features: string[]; popular?: boolean; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.03, y: -8 }}
      className={`relative p-6 rounded-2xl border backdrop-blur-sm ${popular
        ? 'border-primary/60 bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]'
        : 'border-border/50 bg-card/60'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          MAIS POPULAR
        </div>
      )}
      <h3 className="text-lg font-bold text-foreground mb-1">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-extrabold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">/{period}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${popular
          ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.7)]'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        Assine Agora
      </motion.button>
    </motion.div>
  );
}

/* ─────── Testimonial Card ─────── */
function TestimonialCard({ name, stat, desc, delay = 0 }: { name: string; stat: string; desc: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="p-5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{name}</p>
          <p className="text-xs text-primary font-mono">{stat}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">"{desc}"</p>
      <div className="flex gap-0.5 mt-2">
        {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ──── HERO ──── */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticlesHero />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.img
            src={logoImg}
            alt="Iron Training"
            className="w-40 h-40 mx-auto mb-8 drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          />

          <motion.h1
            className="text-5xl sm:text-7xl font-extrabold leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transforme Sua{' '}
            <span className="text-gradient">Força</span>.{' '}
            <br className="hidden sm:block" />
            Domine Seu{' '}
            <span className="text-gradient">Corpo</span>.
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Treinos, IA avançada, gamificação e AR/VR em um único app.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Button
                size="lg"
                className="text-lg px-10 py-6 rounded-2xl font-bold shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_50px_-8px_hsl(var(--primary)/0.7)] transition-shadow"
                onClick={() => navigate('/auth')}
              >
                <Download className="w-5 h-5 mr-2" />
                Baixe Agora
              </Button>
            </motion.div>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-2xl border-border/60"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Saiba Mais
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </div>

      {/* ──── FEATURES ──── */}
      <Section className="py-24 px-6" >
        <div id="features" className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span className="text-primary text-sm font-bold uppercase tracking-widest">Diferenciais</motion.span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
              Tudo que você precisa,{' '}
              <span className="text-gradient">em um lugar</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas que vão revolucionar seus treinos e transformar sua jornada de força.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Brain} title="IA Personal Trainer" desc="Coach inteligente que analisa seu desempenho e adapta treinos em tempo real." delay={0} />
            <FeatureCard icon={TrendingUp} title="Previsor de PRs" desc="Algoritmos preditivos que estimam seus próximos recordes pessoais." delay={0.1} />
            <FeatureCard icon={Zap} title="Progressão Automática" desc="Auto-regulação baseada em velocidade, RIR e volume para evolução constante." delay={0.2} />
            <FeatureCard icon={Users} title="Feed Social & Rankings" desc="Compartilhe conquistas, desafie amigos e suba no ranking global." delay={0.3} />
            <FeatureCard icon={MapPin} title="Mapa de Academias" desc="Encontre gyms, veja heatmaps de atividade e compare leaderboards." delay={0.4} />
            <FeatureCard icon={BarChart3} title="Analytics Completo" desc="Gráficos avançados de volume, intensidade, PRs e composição corporal." delay={0.5} />
          </div>
        </div>
      </Section>

      {/* ──── STREAKS & GAMIFICATION ──── */}
      <Section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-destructive/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-destructive text-sm font-bold uppercase tracking-widest">Gamificação</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-6">
                Mantenha sua{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-warning to-destructive">
                  chama acesa
                </span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Desbloqueie conquistas épicas, mantenha streaks de treino e compartilhe badges exclusivas. 
                Quanto mais consistente, mais recompensas.
              </p>
              <div className="flex gap-6 flex-wrap">
                {[
                  { num: '365+', label: 'Dias de Streak' },
                  { num: '50+', label: 'Conquistas' },
                  { num: '∞', label: 'Motivação' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-extrabold text-foreground font-mono">{s.num}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative">
                <AnimatedFire size={140} />
                {/* Streak badges floating around */}
                {['🏆', '⚡', '💎', '🎯'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${50 + 70 * Math.cos((i * Math.PI) / 2)}%`,
                      top: `${50 + 70 * Math.sin((i * Math.PI) / 2)}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ──── GYM HEATMAP ──── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-info text-sm font-bold uppercase tracking-widest">Gym Heatmap</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
              Descubra{' '}
              <span className="text-gradient">academias</span>{' '}
              ao redor
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Veja onde os maiores PRs estão sendo batidos, compare academias e desafie-se em novos ambientes.
            </p>
          </div>
          <motion.div
            className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden h-80 flex items-center justify-center"
            whileHover={{ scale: 1.01 }}
          >
            {/* Simulated map UI */}
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-80" />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--primary) / 0.12) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(var(--info) / 0.1) 0%, transparent 40%), radial-gradient(circle at 50% 30%, hsl(var(--destructive) / 0.08) 0%, transparent 30%)',
            }} />
            {/* Animated pins */}
            {[
              { x: '25%', y: '35%', color: 'primary' },
              { x: '55%', y: '25%', color: 'destructive' },
              { x: '70%', y: '55%', color: 'info' },
              { x: '40%', y: '60%', color: 'warning' },
              { x: '60%', y: '40%', color: 'primary' },
            ].map((pin, i) => (
              <motion.div
                key={i}
                className="absolute z-10"
                style={{ left: pin.x, top: pin.y }}
                animate={{ y: [0, -4, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className={`w-4 h-4 rounded-full bg-${pin.color} shadow-[0_0_12px_hsl(var(--${pin.color})/0.5)]`} />
                <motion.div
                  className={`absolute inset-0 rounded-full bg-${pin.color}/30`}
                  animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                />
              </motion.div>
            ))}
            <div className="relative z-20 text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-3 drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]" />
              <p className="text-muted-foreground text-sm font-medium">Mapa interativo disponível no app</p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ──── PRICING ──── */}
      <Section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-bold uppercase tracking-widest">Planos</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
              Escolha seu{' '}
              <span className="text-gradient">plano</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e evolua conforme sua jornada de força.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard
              name="Básico"
              price="R$19,90"
              period="mês"
              features={['Treinos ilimitados', 'Tracker de PRs', 'Streaks básicos', 'Feed social']}
              delay={0}
            />
            <PricingCard
              name="Padrão"
              price="R$29,90"
              period="mês"
              features={['Tudo do Básico', 'IA Coach', 'Previsor de PRs', 'Rankings avançados', 'Analytics completo']}
              popular
              delay={0.1}
            />
            <PricingCard
              name="Premium"
              price="R$49,90"
              period="mês"
              features={['Tudo do Padrão', 'Gym Heatmap', 'Replay 3D', 'Avatares premium', 'Lootboxes mensais']}
              delay={0.2}
            />
            <PricingCard
              name="Anual"
              price="R$299"
              period="ano"
              features={['Acesso Premium completo', '2 meses grátis', 'Badge exclusiva anual', 'Prioridade no suporte', 'Skins limitadas']}
              delay={0.3}
            />
          </div>
        </div>
      </Section>

      {/* ──── MINI FEATURES / MICROTRANSACTIONS ──── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-warning text-sm font-bold uppercase tracking-widest">Personalização</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
              Desbloqueie{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-warning to-primary">
                seu estilo
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Avatares animados, skins de streak, lootboxes e efeitos visuais exclusivos.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Crown, label: 'Avatares Premium', color: 'warning' },
              { icon: Flame, label: 'Skins de Streak', color: 'destructive' },
              { icon: Gift, label: 'Lootboxes', color: 'primary' },
              { icon: Award, label: 'Badges Raras', color: 'info' },
            ].map((item, i) => {
              const ref = useRef(null);
              const inView = useInView(ref, { once: true });
              return (
                <motion.div
                  key={i}
                  ref={ref}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  className="p-6 rounded-2xl border border-border/50 bg-card/60 text-center cursor-pointer group"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <item.icon className={`w-10 h-10 mx-auto mb-3 text-${item.color}`} />
                  </motion.div>
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ──── TESTIMONIALS ──── */}
      <Section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-success text-sm font-bold uppercase tracking-widest">Resultados</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-3 mb-4">
              Atletas que{' '}
              <span className="text-gradient">evoluíram</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Lucas M."
              stat="Squat: 180kg → 220kg"
              desc="O previsor de PRs me ajudou a planejar minha evolução semana a semana. Em 6 meses bati todos meus recordes."
              delay={0}
            />
            <TestimonialCard
              name="Ana C."
              stat="Streak: 142 dias"
              desc="A gamificação é viciante. Nunca fui tão consistente nos treinos. O sistema de badges é genial."
              delay={0.1}
            />
            <TestimonialCard
              name="Rafael S."
              stat="DOTS: 380 → 445"
              desc="O coach IA mudou completamente minha periodização. Progressão automática fez toda a diferença."
              delay={0.2}
            />
          </div>
        </div>
      </Section>

      {/* ──── FINAL CTA ──── */}
      <Section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.img
            src={logoImg}
            alt="Iron Training"
            className="w-24 h-24 mx-auto mb-8 drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <h2 className="text-4xl sm:text-6xl font-extrabold mb-6">
            Eleve sua força ao{' '}
            <span className="text-gradient">máximo</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Baixe o Iron Training agora e comece sua transformação. Sua jornada de força começa aqui.
          </p>
          <motion.div
            className="inline-block"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Button
              size="lg"
              className="text-lg px-12 py-7 rounded-2xl font-bold shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_60px_-8px_hsl(var(--primary)/0.7)] transition-shadow"
              onClick={() => navigate('/auth')}
            >
              <Download className="w-5 h-5 mr-2" />
              Baixe Agora — É Grátis
            </Button>
          </motion.div>
          <div className="flex justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Smartphone className="w-4 h-4" /> iOS & Android
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="w-4 h-4" /> Dados seguros
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Lock className="w-4 h-4" /> Grátis para começar
            </div>
          </div>
        </div>
      </Section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Iron Training" className="w-8 h-8" />
            <span className="font-bold text-foreground">Iron Training</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Iron Training. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
