import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, Dumbbell, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseInfo {
  name: string;
  muscleGroups: string[];
  category: 'compound' | 'accessory';
  instructions: string;
  commonMistakes: string[];
  tips: string;
}

const EXERCISE_DATABASE: Record<string, ExerciseInfo[]> = {
  'Peito': [
    { name: 'Supino Reto com Barra', muscleGroups: ['Peito', 'Tríceps', 'Ombro Anterior'], category: 'compound', instructions: 'Deite no banco, pés firmes no chão. Agarre a barra na largura dos ombros +. Desça controladamente até o peito, pressione para cima.', commonMistakes: ['Rebater a barra no peito', 'Levantar os glúteos do banco', 'Cotovelos muito abertos'], tips: 'Mantenha escápulas retraídas e deprimidas. Arco torácico moderado.' },
    { name: 'Supino Inclinado com Halteres', muscleGroups: ['Peito Superior', 'Ombro Anterior'], category: 'compound', instructions: 'Banco a 30-45°. Desça os halteres até o nível do peito, pressione para cima com leve adução.', commonMistakes: ['Ângulo muito alto (vira desenvolvimento)', 'Não controlar a fase excêntrica'], tips: 'Foque na conexão mente-músculo na porção superior do peitoral.' },
    { name: 'Crucifixo com Cabos', muscleGroups: ['Peito'], category: 'accessory', instructions: 'Cabos na altura do ombro. Movimento em arco, cotovelos levemente flexionados.', commonMistakes: ['Flexionar demais os cotovelos', 'Usar peso excessivo'], tips: 'Excelente para finalização. Mantenha tensão constante.' },
  ],
  'Costas': [
    { name: 'Levantamento Terra', muscleGroups: ['Posteriores', 'Glúteos', 'Lombar', 'Trapézio'], category: 'compound', instructions: 'Pés na largura do quadril. Agarre a barra, peito para cima, lombar neutra. Empurre o chão com os pés, estenda quadril e joelhos simultaneamente.', commonMistakes: ['Arredondar a lombar', 'Puxar com os braços', 'Barra longe do corpo'], tips: 'Pense em empurrar o chão, não puxar a barra. Mantenha lats engajados.' },
    { name: 'Remada Curvada', muscleGroups: ['Costas', 'Bíceps', 'Lombar'], category: 'compound', instructions: 'Incline o tronco a ~45°, agarre a barra pronada. Puxe em direção ao umbigo, contraia escápulas.', commonMistakes: ['Usar impulso do tronco', 'Não retrair escápulas'], tips: 'Pausa de 1s no topo para máxima contração.' },
    { name: 'Pulldown / Puxada', muscleGroups: ['Latíssimo', 'Bíceps'], category: 'compound', instructions: 'Pegada pronada, largura dos ombros +. Puxe a barra até o peito, escápulas deprimidas.', commonMistakes: ['Puxar atrás da cabeça', 'Inclinar demais o tronco'], tips: 'Inicie o movimento deprimindo as escápulas.' },
  ],
  'Pernas': [
    { name: 'Agachamento com Barra', muscleGroups: ['Quadríceps', 'Glúteos', 'Posteriores', 'Core'], category: 'compound', instructions: 'Barra nas costas (high ou low bar). Pés na largura dos ombros, pontas levemente para fora. Desça quebrando quadril e joelhos simultaneamente até paralelo ou abaixo.', commonMistakes: ['Joelhos colapsando para dentro', 'Inclinar demais o tronco', 'Não atingir profundidade'], tips: 'Mantenha core braced. Empurre os joelhos para fora na subida.' },
    { name: 'Leg Press', muscleGroups: ['Quadríceps', 'Glúteos'], category: 'compound', instructions: 'Pés no meio da plataforma. Desça até 90° de flexão de joelho, empurre sem travar.', commonMistakes: ['Amplitude muito curta', 'Travar os joelhos no topo'], tips: 'Pés mais altos = mais glúteo. Pés mais baixos = mais quadríceps.' },
    { name: 'Cadeira Extensora', muscleGroups: ['Quadríceps'], category: 'accessory', instructions: 'Ajuste o encosto e o rolo. Estenda as pernas completamente, contraia o quadríceps no topo.', commonMistakes: ['Usar impulso', 'Não estender completamente'], tips: 'Pausa de 2s no topo. Excelente para isolar o reto femoral.' },
    { name: 'Stiff / Romeno', muscleGroups: ['Posteriores', 'Glúteos', 'Lombar'], category: 'compound', instructions: 'Barra na frente das coxas. Empurre o quadril para trás mantendo as pernas quase estendidas. Desça até sentir alongamento nos posteriores.', commonMistakes: ['Arredondar a lombar', 'Flexionar demais os joelhos'], tips: 'Foque no hip hinge. A barra deve deslizar pelas coxas.' },
  ],
  'Ombros': [
    { name: 'Desenvolvimento com Barra', muscleGroups: ['Deltóide Anterior', 'Deltóide Lateral', 'Tríceps'], category: 'compound', instructions: 'Em pé ou sentado. Barra na altura dos ombros, pressione para cima até extensão total dos braços.', commonMistakes: ['Inclinar demais o tronco para trás', 'Não completar a amplitude'], tips: 'Core firme. No topo, empurre a cabeça levemente à frente.' },
    { name: 'Elevação Lateral', muscleGroups: ['Deltóide Lateral'], category: 'accessory', instructions: 'Halteres ao lado do corpo. Eleve lateralmente até a altura dos ombros com cotovelos levemente flexionados.', commonMistakes: ['Usar impulso do tronco', 'Elevar acima dos ombros'], tips: 'Pense em derramar água de um copo. Leve inclinação para frente ajuda.' },
  ],
  'Braços': [
    { name: 'Rosca Direta', muscleGroups: ['Bíceps'], category: 'accessory', instructions: 'Barra ou halteres, pegada supinada. Flexione os cotovelos mantendo-os fixos ao lado do corpo.', commonMistakes: ['Balançar o corpo', 'Mover os cotovelos para frente'], tips: 'Controle a fase excêntrica (descida) para máximo estímulo.' },
    { name: 'Tríceps Pulley', muscleGroups: ['Tríceps'], category: 'accessory', instructions: 'Cabo alto, pegada pronada ou corda. Estenda os cotovelos mantendo-os fixos ao lado do corpo.', commonMistakes: ['Afastar os cotovelos do corpo', 'Inclinar o tronco demais'], tips: 'Com corda, abra as mãos no final para maior contração.' },
    { name: 'Extensão de Tríceps Overhead', muscleGroups: ['Tríceps (cabeça longa)'], category: 'accessory', instructions: 'Halter ou cabo atrás da cabeça. Estenda os braços para cima mantendo os cotovelos apontados para cima.', commonMistakes: ['Cotovelos abrindo para os lados', 'Usar impulso'], tips: 'Excelente para a cabeça longa do tríceps. Alongamento máximo na posição baixa.' },
  ],
};

export default function ExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Peito');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const filteredGroups = Object.entries(EXERCISE_DATABASE).map(([group, exercises]) => ({
    group,
    exercises: exercises.filter(e => 
      !search || e.name.toLowerCase().includes(search.toLowerCase()) || 
      e.muscleGroups.some(m => m.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(g => g.exercises.length > 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Biblioteca de Exercícios</h1>
        <p className="text-muted-foreground mt-1">Instruções, dicas e erros comuns</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar exercício ou grupo muscular..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Exercise Groups */}
      {filteredGroups.map(({ group, exercises }) => (
        <motion.div key={group} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
          <button
            onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">{group}</p>
                <p className="text-xs text-muted-foreground">{exercises.length} exercícios</p>
              </div>
            </div>
            {expandedGroup === group ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedGroup === group && (
            <div className="border-t border-border divide-y divide-border">
              {exercises.map(exercise => (
                <div key={exercise.name}>
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exercise.name ? null : exercise.name)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", exercise.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground')} />
                      <span className="text-sm text-foreground">{exercise.name}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded",
                        exercise.category === 'compound' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                      )}>
                        {exercise.category === 'compound' ? 'Composto' : 'Acessório'}
                      </span>
                    </div>
                    {expandedExercise === exercise.name ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  </button>

                  {expandedExercise === exercise.name && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscleGroups.map(m => (
                          <span key={m} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Execução</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{exercise.instructions}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">❌ Erros Comuns</p>
                        <ul className="space-y-1">
                          {exercise.commonMistakes.map((m, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-destructive mt-0.5">•</span> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">💡 Dica</p>
                        <p className="text-xs text-muted-foreground">{exercise.tips}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
