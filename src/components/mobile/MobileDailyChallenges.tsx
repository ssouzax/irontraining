import { useState } from 'react';
import { Swords, Trophy, Plus, Crown, Medal, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CHALLENGE_EXERCISES = ['Supino Reto', 'Agachamento', 'Levantamento Terra', 'Desenvolvimento', 'Remada Curvada', 'Rosca Direta'];

export function MobileDailyChallenges() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const gymId = (profile as any)?.gym_id;
  const { challenges, loading, createChallenge, submitEntry } = useDailyChallenges(gymId);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<Record<string, string>>({});

  const handleCreate = async (exercise: string) => {
    await createChallenge(exercise, 'max_weight');
    setShowCreate(false);
    toast.success(`⚔️ Desafio criado: ${exercise}`);
  };

  const handleSubmit = async (challengeId: string) => {
    const val = parseFloat(inputValue[challengeId] || '0');
    if (val <= 0) return;
    await submitEntry(challengeId, val);
    setInputValue(prev => ({ ...prev, [challengeId]: '' }));
    toast.success('Resultado registrado! 💪');
  };

  if (loading) return null;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  const getBadgeTitle = (type: string) => {
    if (type === 'max_weight') return 'Campeão do Dia';
    if (type === 'max_reps') return 'Rei das Reps';
    return 'Destruidor de Volume';
  };

  return (
    <div className="mx-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-destructive" />
          <span className="text-sm font-bold text-foreground">Desafios do Dia</span>
          {challenges.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
              {challenges.length} ativos
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Create challenge */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="grid grid-cols-2 gap-2">
              {CHALLENGE_EXERCISES.map(ex => (
                <button
                  key={ex}
                  onClick={() => handleCreate(ex)}
                  className="p-3 rounded-xl bg-card border border-border text-left hover:border-destructive/50 transition-colors"
                >
                  <p className="text-xs font-semibold text-foreground">{ex}</p>
                  <p className="text-[10px] text-destructive font-medium mt-0.5">⚔️ Quem levanta mais?</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenges list */}
      <div className="space-y-2">
        {challenges.map((challenge) => {
          const isExpanded = expandedChallenge === challenge.id;
          const myEntry = challenge.entries.find(e => e.user_id === user?.id);
          const leader = challenge.entries[0];
          const isLeader = leader?.user_id === user?.id;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                className="w-full p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Swords className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">{challenge.exercise_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {challenge.entries.length} participantes · {challenge.challenge_type === 'max_weight' ? 'Peso máximo' : 'Max reps'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLeader && myEntry && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-bold">👑 Líder</span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-3 space-y-2">
                      {/* Submit entry */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={challenge.challenge_type === 'max_weight' ? 'Peso (kg)' : 'Reps'}
                          value={inputValue[challenge.id] || ''}
                          onChange={e => setInputValue(prev => ({ ...prev, [challenge.id]: e.target.value }))}
                          className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm"
                        />
                        <button
                          onClick={() => handleSubmit(challenge.id)}
                          className="px-4 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90"
                        >
                          Enviar
                        </button>
                      </div>

                      {/* Leaderboard */}
                      {challenge.entries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg",
                            entry.user_id === user?.id ? "bg-primary/5" : ""
                          )}
                        >
                          {getRankIcon(idx)}
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              entry.display_name?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground flex-1">{entry.display_name}</span>
                          <span className="text-sm font-extrabold text-foreground">
                            {entry.value}{challenge.challenge_type === 'max_weight' ? 'kg' : ' reps'}
                          </span>
                        </div>
                      ))}

                      {challenge.entries.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum participante ainda. Seja o primeiro! 🏆</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {challenges.length === 0 && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full p-4 rounded-xl border border-dashed border-border text-center hover:border-destructive/50 transition-colors"
        >
          <Swords className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Crie um desafio e desafie sua academia! ⚔️</p>
        </button>
      )}
    </div>
  );
}
