import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ClipboardList, TrendingUp, Trophy, ChevronRight } from 'lucide-react';

const steps = [
  {
    icon: Dumbbell,
    title: 'Crie seu treino',
    description: 'Escolha exercícios da nossa biblioteca em português e organize sua rotina de treino.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: ClipboardList,
    title: 'Registre seu treino',
    description: 'Adicione peso (kg), repetições e séries. O app salva tudo automaticamente.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhe sua evolução',
    description: 'Veja seus recordes pessoais, histórico de cargas e progresso ao longo do tempo.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Trophy,
    title: 'Compita com amigos',
    description: 'Participe de rankings, desafios semanais e compare seus resultados com outros atletas.',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className={`w-24 h-24 rounded-3xl ${current.bg} flex items-center justify-center mb-8`}>
            <current.icon className={`w-12 h-12 ${current.color}`} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{current.title}</h2>
          <p className="text-muted-foreground text-base leading-relaxed">{current.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex gap-2 mt-10 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === step ? 'bg-primary w-8' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <button
          onClick={next}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          {step === steps.length - 1 ? 'Começar a treinar' : 'Próximo'}
          <ChevronRight className="w-4 h-4" />
        </button>
        {step < steps.length - 1 && (
          <button onClick={onComplete} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  );
}
