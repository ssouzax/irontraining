import { useState, useMemo } from 'react';
import { Plus, X, Search, Dumbbell, Trophy, Loader2, Trash2 } from 'lucide-react';
import { useUserPRs } from '@/hooks/useUserPRs';
import { exerciseCategories, allExercises } from '@/data/exerciseList';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function PRConfigSection() {
  const { prs, loading, total, addPR, updatePR, removePR } = useUserPRs();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const existingNames = new Set(prs.map(p => p.exercise_name));

  const filteredExercises = useMemo(() => {
    const term = search.toLowerCase();
    if (selectedCategory) {
      const cat = exerciseCategories.find(c => c.name === selectedCategory);
      return (cat?.exercises || []).filter(e => !existingNames.has(e) && e.toLowerCase().includes(term));
    }
    if (term.length < 2) return [];
    return allExercises.filter(e => !existingNames.has(e) && e.toLowerCase().includes(term)).slice(0, 30);
  }, [search, selectedCategory, existingNames]);

  const handleAdd = async (name: string) => {
    try {
      await addPR(name);
      setShowPicker(false);
      setSearch('');
      setSelectedCategory(null);
      toast.success(`${name} adicionado!`);
    } catch {
      toast.error('Exercício já adicionado');
    }
  };

  const handleSave = async (id: string, weight: string, reps: string) => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 1;
    await updatePR(id, w, r);
    setEditingId(null);
    toast.success('PR atualizado!');
  };

  const handleRemove = async (id: string) => {
    await removePR(id);
    toast.success('Exercício removido');
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Meus PRs</h3>
        </div>
        <button onClick={() => setShowPicker(true)} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {/* PR Cards */}
      {prs.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-xl border border-border">
          <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum PR configurado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione exercícios para acompanhar seus PRs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prs.map(pr => (
            <PRCard key={pr.id} pr={pr} editing={editingId === pr.id}
              onEdit={() => setEditingId(pr.id)} onSave={handleSave} onRemove={handleRemove} onCancel={() => setEditingId(null)} />
          ))}
          {/* Total */}
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-3 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Estimado</span>
            <span className="text-xl font-extrabold text-primary">{Math.round(total * 10) / 10} kg</span>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => { setShowPicker(false); setSearch(''); setSelectedCategory(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="bg-background w-full max-w-lg rounded-t-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-base font-bold text-foreground">Adicionar Exercício</h3>
                <button onClick={() => { setShowPicker(false); setSearch(''); setSelectedCategory(null); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setSelectedCategory(null); }}
                    placeholder="Buscar exercício..." className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground" />
                </div>
              </div>

              {/* Categories */}
              {!search && !selectedCategory && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {exerciseCategories.map(cat => (
                    <button key={cat.name} onClick={() => setSelectedCategory(cat.name)}
                      className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground hover:bg-primary/10 transition-colors">
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedCategory && (
                <div className="px-4 pb-2">
                  <button onClick={() => setSelectedCategory(null)} className="text-xs text-primary flex items-center gap-1">
                    ← Voltar às categorias
                  </button>
                </div>
              )}

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {filteredExercises.length === 0 && (search.length >= 2 || selectedCategory) ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Nenhum exercício encontrado</p>
                    {search.length >= 2 && (
                      <button onClick={() => handleAdd(search)} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                        Adicionar "{search}" como exercício personalizado
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredExercises.map(ex => (
                      <button key={ex} onClick={() => handleAdd(ex)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PRCard({ pr, editing, onEdit, onSave, onRemove, onCancel }: {
  pr: { id: string; exercise_name: string; weight: number; reps: number; estimated_1rm: number };
  editing: boolean; onEdit: () => void; onSave: (id: string, w: string, r: string) => void;
  onRemove: (id: string) => void; onCancel: () => void;
}) {
  const [weight, setWeight] = useState(String(pr.weight || ''));
  const [reps, setReps] = useState(String(pr.reps || 1));

  if (editing) {
    return (
      <div className="bg-card rounded-xl border border-primary/30 p-3 space-y-2">
        <p className="text-sm font-semibold text-foreground">{pr.exercise_name}</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground uppercase">Peso (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground" placeholder="0" />
          </div>
          <div className="w-20">
            <label className="text-[10px] text-muted-foreground uppercase">Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground" placeholder="1" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(pr.id, weight, reps)} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Salvar</button>
          <button onClick={onCancel} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-xs">Cancelar</button>
          <button onClick={() => onRemove(pr.id)} className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={onEdit} className="w-full bg-card rounded-xl border border-border p-3 flex items-center justify-between text-left">
      <div>
        <p className="text-sm font-semibold text-foreground">{pr.exercise_name}</p>
        <p className="text-xs text-muted-foreground">
          {pr.weight > 0 ? `${pr.weight}kg × ${pr.reps} rep${pr.reps > 1 ? 's' : ''}` : 'Toque para configurar'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-extrabold text-foreground">{pr.estimated_1rm > 0 ? `${pr.estimated_1rm}` : '—'}</p>
        <p className="text-[10px] text-muted-foreground uppercase">E1RM</p>
      </div>
    </button>
  );
}
