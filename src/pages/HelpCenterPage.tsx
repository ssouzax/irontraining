import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  BookOpen, Dumbbell, ClipboardList, TrendingUp, Trophy, Users,
  ChevronDown, ChevronRight, Play, Target, Zap, Crown, MessageSquare,
  BarChart3, MapPin, Award, Sparkles, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialSection {
  id: string;
  icon: any;
  title: string;
  description: string;
  steps: { title: string; detail: string }[];
}

const sections: TutorialSection[] = [
  {
    id: 'intro',
    icon: BookOpen,
    title: 'Introdução ao Iron Training',
    description: 'Conheça os pilares do app: treino, social e competição.',
    steps: [
      { title: 'O que é o Iron Training?', detail: 'O Iron Training é um app de musculação completo que combina registro de treinos, rede social fitness e sistema de competição entre atletas.' },
      { title: 'Três pilares', detail: '1) Registro de treino com histórico e progressão automática. 2) Rede social para compartilhar conquistas. 3) Rankings e desafios para competir com amigos.' },
      { title: 'Navegação', detail: 'Use o menu lateral para acessar todas as funcionalidades. No celular, toque no ícone de menu no canto superior esquerdo.' },
      { title: 'Seu perfil', detail: 'Acesse "Perfil" para configurar seus dados: peso corporal, PRs atuais e foto de perfil.' },
    ],
  },
  {
    id: 'create-workout',
    icon: Dumbbell,
    title: 'Como criar um treino',
    description: 'Aprenda a montar seu programa de treino personalizado.',
    steps: [
      { title: 'Acessar Programa', detail: 'Vá em "Programa" no menu. Você verá seu programa atual com os dias de treino organizados por semana.' },
      { title: 'Gerar Programa com IA', detail: 'Vá em "Gerar Programa" e informe seus 1RMs (Agachamento, Supino, Terra), objetivo e dias por semana. A IA cria um programa periodizado completo.' },
      { title: 'Adicionar exercícios', detail: 'Dentro de cada dia de treino, toque em "Adicionar Exercício" para buscar na biblioteca. Todos os exercícios estão em português.' },
      { title: 'Configurar séries', detail: 'Para cada exercício, defina o número de séries, repetições alvo, RIR (Repetições em Reserva) e carga estimada.' },
    ],
  },
  {
    id: 'register',
    icon: ClipboardList,
    title: 'Como registrar exercícios',
    description: 'Salve peso, repetições e séries durante o treino.',
    steps: [
      { title: 'Iniciar treino', detail: 'Vá em "Modo App" para iniciar o treino do dia. A interface é otimizada para uso durante o treino na academia.' },
      { title: 'Preencher dados', detail: 'Para cada série, preencha: Peso (kg) — ex: 80 | Repetições — ex: 8 | RIR — ex: 2 (quantas reps faltou para a falha).' },
      { title: 'Ver último treino', detail: 'Toque em "Último treino" ao lado de cada exercício para ver os pesos e reps da sessão anterior. Use isso para progredir.' },
      { title: 'Adaptar exercício', detail: 'Se o equipamento estiver ocupado, toque em "Adaptar" para trocar a variação (ex: Supino barra → Supino halteres) sem perder o progresso.' },
      { title: 'Timer de descanso', detail: 'Ao completar uma série, o timer de descanso inicia automaticamente. Ajuste o tempo conforme necessário.' },
      { title: 'Salvar automaticamente', detail: 'Todos os dados são salvos automaticamente no banco. Você não precisa clicar em "salvar".' },
    ],
  },
  {
    id: 'progress',
    icon: TrendingUp,
    title: 'Como acompanhar evolução',
    description: 'Monitore recordes pessoais e gráficos de progresso.',
    steps: [
      { title: 'Análises', detail: 'Acesse "Análises" para ver gráficos de evolução de carga, volume semanal e frequência de treino.' },
      { title: 'Recordes Pessoais', detail: 'Seus PRs (Personal Records) são detectados automaticamente. Quando você levanta mais peso, o app registra e notifica.' },
      { title: 'Power Score', detail: 'Vá em "Power Score" para ver sua classificação geral de força baseada nos seus lifts principais (Agachamento, Supino, Terra).' },
      { title: 'Preditor IA', detail: 'O "Preditor IA" estima quando você atingirá seus próximos PRs baseado no seu ritmo de progressão.' },
      { title: 'Conquistas', detail: 'Desbloqueie medalhas e badges ao atingir marcos importantes (ex: 100kg no supino, streak de 30 dias).' },
    ],
  },
  {
    id: 'social',
    icon: Users,
    title: 'Recursos sociais',
    description: 'Compartilhe treinos e interaja com outros atletas.',
    steps: [
      { title: 'Feed Social', detail: 'Acesse "Feed Social" para ver treinos, PRs e conquistas de outros atletas. Curta e comente.' },
      { title: 'Explorar', detail: 'Use "Explorar" para descobrir novos atletas, PRs do dia e academias em destaque.' },
      { title: 'Seguir atletas', detail: 'Siga outros usuários para acompanhar a evolução deles no seu feed.' },
      { title: 'Compartilhar', detail: 'Ao finalizar um treino, compartilhe o resumo como card visual nas redes sociais.' },
      { title: 'Grupos', detail: 'Crie ou entre em grupos de treino para se conectar com amigos ou comunidades.' },
    ],
  },
  {
    id: 'compete',
    icon: Trophy,
    title: 'Rankings e competições',
    description: 'Compita com amigos e suba no ranking.',
    steps: [
      { title: 'Rankings', detail: 'Veja seu posicionamento nos rankings de força por exercício. Compare com atletas da mesma academia ou do Brasil inteiro.' },
      { title: 'Ranking DOTS', detail: 'O ranking DOTS normaliza a força pelo peso corporal, permitindo competição justa entre atletas de diferentes categorias.' },
      { title: 'Rivais', detail: 'Adicione rivais para acompanhar quem está na frente na progressão de força.' },
      { title: 'Desafios', detail: 'Participe de desafios semanais (ex: quem faz mais volume no supino esta semana).' },
      { title: 'Streaks', detail: 'Mantenha sua sequência de treinos e suba no ranking de streaks.' },
    ],
  },
  {
    id: 'plans',
    icon: Crown,
    title: 'Planos e funcionalidades',
    description: 'Entenda o que cada plano oferece.',
    steps: [
      { title: 'Plano Gratuito', detail: 'Registro de treinos, biblioteca de exercícios, histórico básico e feed social.' },
      { title: 'Plano Básico', detail: 'Tudo do Gratuito + análises avançadas, preditor IA e geração de programas.' },
      { title: 'Plano Padrão', detail: 'Tudo do Básico + Power Score, simulador de PR, recuperação e co-training.' },
      { title: 'Plano Premium', detail: 'Acesso completo: dieta IA, coach IA personalizado, replay 3D, conteúdo exclusivo e sem anúncios.' },
      { title: 'Como fazer upgrade', detail: 'Acesse "Planos Premium" no menu ou toque em qualquer funcionalidade com cadeado para ver as opções de assinatura.' },
    ],
  },
  {
    id: 'notes',
    icon: MessageSquare,
    title: 'Anotações inteligentes',
    description: 'Use notas rápidas para registrar feedback do treino.',
    steps: [
      { title: 'Notas por exercício', detail: 'Toque no ícone de balão ao lado de cada exercício para adicionar observações como "barra instável" ou "tríceps falhou antes".' },
      { title: 'Feedback pós-treino', detail: 'Ao finalizar o treino, avalie esforço (1-10), nível de energia e registre desconfortos.' },
      { title: 'Tags rápidas', detail: 'Use botões pré-definidos como "Fadiga alta", "Execução ótima", "Dor muscular" para anotar sem digitar.' },
      { title: 'Coach IA analisa', detail: 'A IA usa suas notas junto com dados de carga e RIR para sugerir ajustes de volume e intensidade.' },
    ],
  },
];

export default function HelpCenterPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('intro');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Aprenda a usar todas as funcionalidades do Iron Training</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {sections.map((section, idx) => {
          const isExpanded = expandedSection === section.id;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <section.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-3">
                    {section.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{sIdx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{step.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
