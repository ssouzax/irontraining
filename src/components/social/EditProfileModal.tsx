import { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfileData {
  display_name: string;
  username: string;
  bio: string;
  website_url: string;
  avatar_url: string;
  profile_public: boolean;
}

interface Props {
  profile: ProfileData;
  onClose: () => void;
  onSave: (updated: ProfileData) => void;
}

export function EditProfileModal({ profile: initial, onClose, onSave }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileData>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const checkUsername = async (val: string) => {
    if (!val || val.length < 3) { setUsernameError('Mínimo 3 caracteres'); return; }
    if (!/^[a-zA-Z0-9_.]+$/.test(val)) { setUsernameError('Apenas letras, números, . e _'); return; }
    if (val === initial.username) { setUsernameError(''); return; }
    const { data } = await supabase.from('profiles').select('id').eq('username', val).maybeSingle();
    setUsernameError(data ? 'Username já em uso' : '');
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro no upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setForm(f => ({ ...f, avatar_url: publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user || usernameError) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: form.display_name || null,
      username: form.username || null,
      bio: form.bio || null,
      website_url: form.website_url || null,
      avatar_url: form.avatar_url || null,
      profile_public: form.profile_public,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Perfil atualizado!');
    onSave(form);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Editar Perfil</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar */}
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          <div className="flex justify-center">
            <button onClick={() => avatarRef.current?.click()} className="relative group">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center overflow-hidden">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
              <span className="text-xs text-primary mt-1 block text-center">Alterar foto</span>
            </button>
          </div>

          {/* Fields */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Username</label>
            <input value={form.username}
              onChange={e => { setForm(f => ({ ...f, username: e.target.value })); checkUsername(e.target.value); }}
              className={cn("w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground border focus:outline-none focus:ring-1",
                usernameError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              )} />
            {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea value={form.bio} maxLength={150}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-xs text-muted-foreground text-right">{form.bio.length}/150</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Website</label>
            <input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              placeholder="https://"
              className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Conta privada</span>
            <button onClick={() => setForm(f => ({ ...f, profile_public: !f.profile_public }))}
              className={cn("w-11 h-6 rounded-full transition-colors relative",
                !form.profile_public ? "bg-primary" : "bg-secondary"
              )}>
              <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                !form.profile_public ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving || !!usernameError}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
