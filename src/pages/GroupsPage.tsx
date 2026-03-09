import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Lock, Globe, Search, Loader2, X } from 'lucide-react';
import { useGroups, Group } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

function CreateGroupModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, desc: string, priv: boolean) => Promise<any> }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), description.trim(), isPrivate);
    setCreating(false);
    setName(''); setDescription(''); setIsPrivate(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Criar Grupo</h3>
              <button onClick={onClose} className="p-1 text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do grupo"
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={3}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={() => setIsPrivate(!isPrivate)}
                className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm w-full transition-colors",
                  isPrivate ? "bg-warning/10 text-warning border border-warning/20" : "bg-secondary text-foreground"
                )}>
                {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {isPrivate ? 'Grupo Privado' : 'Grupo Público'}
              </button>
              <button onClick={handleCreate} disabled={!name.trim() || creating}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Grupo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GroupCard({ group, isMember, onJoin, onLeave }: { group: Group; isMember: boolean; onJoin: () => void; onLeave: () => void }) {
  const { user } = useAuth();
  const isOwner = group.created_by === user?.id;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary/20 to-accent/10 relative">
        {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute top-2 right-2">
          {group.is_private ? (
            <span className="flex items-center gap-1 bg-warning/20 text-warning text-[10px] px-2 py-0.5 rounded-full font-medium">
              <Lock className="w-3 h-3" /> Privado
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
              <Globe className="w-3 h-3" /> Público
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 -mt-7 border-2 border-background">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{group.name}</h3>
            <p className="text-xs text-muted-foreground">{group.member_count} {group.member_count === 1 ? 'membro' : 'membros'}</p>
          </div>
        </div>
        {group.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
        )}
        <div className="mt-3">
          {isMember ? (
            <button onClick={onLeave} disabled={isOwner}
              className={cn("w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                isOwner ? "bg-secondary text-muted-foreground cursor-not-allowed" : "border border-border text-foreground hover:bg-secondary"
              )}>
              {isOwner ? 'Administrador' : 'Sair do Grupo'}
            </button>
          ) : (
            <button onClick={onJoin}
              className="w-full py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground">
              Entrar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GroupsPage() {
  const { groups, myGroups, loading, createGroup, joinGroup, leaveGroup, isMember } = useGroups();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const displayed = (filter === 'mine' ? myGroups : groups)
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 pb-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Grupos</h1>
          <p className="text-xs text-muted-foreground">Conecte-se com atletas</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="p-2.5 bg-primary text-primary-foreground rounded-xl">
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar grupos..."
          className="w-full bg-secondary rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'mine'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            {f === 'all' ? 'Todos' : 'Meus Grupos'}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === 'mine' ? 'Você ainda não faz parte de nenhum grupo' : 'Nenhum grupo encontrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayed.map(g => (
            <GroupCard key={g.id} group={g} isMember={isMember(g.id)}
              onJoin={() => joinGroup(g.id)} onLeave={() => leaveGroup(g.id)} />
          ))}
        </div>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={createGroup} />
    </div>
  );
}
