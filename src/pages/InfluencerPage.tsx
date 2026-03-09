import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, Users, DollarSign, Tag, Trophy, Copy, Check, 
  Loader2, Plus, BarChart3, TrendingUp, X, ExternalLink,
  Instagram, Youtube, Star, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InfluencerProfile {
  id: string;
  name: string;
  email: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  niche: string | null;
  referral_code: string;
  commission_rate: number;
  total_referrals: number;
  total_revenue_cents: number;
  is_verified: boolean;
  status: string | null;
  followers_count: number | null;
  user_id: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface Referral {
  id: string;
  referred_user_id: string;
  commission_cents: number;
  commission_paid: boolean;
  status: string;
  created_at: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  total_referrals: number;
  total_revenue_cents: number;
  is_verified: boolean;
  instagram_handle: string | null;
}

export default function InfluencerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [influencer, setInfluencer] = useState<InfluencerProfile | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState('dashboard');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupInstagram, setSignupInstagram] = useState('');
  const [signupTiktok, setSignupTiktok] = useState('');
  const [signupYoutube, setSignupYoutube] = useState('');
  const [signupWhatsapp, setSignupWhatsapp] = useState('');
  const [signingUp, setSigningUp] = useState(false);

  // Coupon creation
  const [couponModal, setCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    // Check if user is already an influencer
    const { data: inf } = await supabase
      .from('influencers')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (inf) {
      setInfluencer(inf as unknown as InfluencerProfile);

      // Load coupons and referrals in parallel
      const [couponsRes, referralsRes] = await Promise.all([
        supabase.from('influencer_coupons').select('*').eq('influencer_id', inf.id).order('created_at', { ascending: false }),
        supabase.from('influencer_referrals').select('*').eq('influencer_id', inf.id).order('created_at', { ascending: false }),
      ]);

      if (couponsRes.data) setCoupons(couponsRes.data as unknown as Coupon[]);
      if (referralsRes.data) setReferrals(referralsRes.data as unknown as Referral[]);
    }

    // Load leaderboard
    const { data: lb } = await supabase
      .from('influencers')
      .select('id, name, avatar_url, total_referrals, total_revenue_cents, is_verified, instagram_handle')
      .not('user_id', 'is', null)
      .order('total_referrals', { ascending: false })
      .limit(50);

    if (lb) setLeaderboard(lb as unknown as LeaderboardEntry[]);
    setLoading(false);
  };

  const generateReferralCode = (name: string) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `IRON${clean}${rand}`;
  };

  const handleSignup = async () => {
    if (!signupName.trim()) {
      toast.error('Informe seu nome');
      return;
    }
    setSigningUp(true);
    try {
      const { data, error } = await supabase
        .from('influencers')
        .insert({
          user_id: user!.id,
          name: signupName,
          email: user!.email,
          instagram_handle: signupInstagram || null,
          tiktok_handle: signupTiktok || null,
          youtube_handle: signupYoutube || null,
          whatsapp: signupWhatsapp || null,
          referral_code: null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setSigningUp(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCouponCode.trim() || !influencer) return;
    const code = newCouponCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) {
      toast.error('Código deve ter pelo menos 4 caracteres');
      return;
    }
    setCreatingCoupon(true);
    try {
      const { error } = await supabase.from('influencer_coupons').insert({
        influencer_id: influencer.id,
        code,
        discount_percent: newCouponDiscount,
        max_uses: newCouponMaxUses ? parseInt(newCouponMaxUses) : null,
      });
      if (error) throw error;
      toast.success(`Cupom ${code} criado!`);
      setCouponModal(false);
      setNewCouponCode('');
      loadData();
    } catch (err: any) {
      toast.error(err.message?.includes('unique') ? 'Código já existe' : err.message);
    } finally {
      setCreatingCoupon(false);
    }
  };

  const copyReferralLink = () => {
    if (!influencer) return;
    const link = `${window.location.origin}/landing?ref=${influencer.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await supabase.from('influencer_coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Signup flow
  if (!influencer) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Programa de Influenciadores</h1>
          <p className="text-muted-foreground mt-2">Promova o Iron Training, ganhe comissões e ofereça descontos exclusivos!</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Cadastrar como Influenciador</h2>

          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Seu nome ou @" />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={signupInstagram} onChange={e => setSignupInstagram(e.target.value)} placeholder="@seuinsta" />
            </div>
            <div>
              <Label>TikTok</Label>
              <Input value={signupTiktok} onChange={e => setSignupTiktok(e.target.value)} placeholder="@seutiktok" />
            </div>
            <div>
              <Label>YouTube</Label>
              <Input value={signupYoutube} onChange={e => setSignupYoutube(e.target.value)} placeholder="Canal YouTube" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={signupWhatsapp} onChange={e => setSignupWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">✨ Benefícios</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Comissão sobre assinaturas indicadas</li>
              <li>• Link de referência exclusivo</li>
              <li>• Cupons de desconto personalizados</li>
              <li>• Dashboard com analytics completo</li>
              <li>• Ranking de influenciadores</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-400">
            ⏳ Após o cadastro, sua solicitação será analisada pelo administrador. Você receberá seu código de referência após a aprovação.
          </div>

          <Button onClick={handleSignup} disabled={signingUp} className="w-full gap-2">
            {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            Solicitar Cadastro
          </Button>
        </motion.div>
      </div>
    );
  }

  // Pending approval state
  if (influencer.status === 'pending') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Aguardando Aprovação</h1>
          <p className="text-muted-foreground mt-2">Sua solicitação para o programa de influenciadores foi enviada e está sendo analisada.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 space-y-3">
          <h3 className="font-semibold text-foreground">Dados enviados</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Nome:</strong> {influencer.name}</p>
            {influencer.instagram_handle && <p><strong className="text-foreground">Instagram:</strong> {influencer.instagram_handle}</p>}
            {influencer.tiktok_handle && <p><strong className="text-foreground">TikTok:</strong> {influencer.tiktok_handle}</p>}
            {influencer.youtube_handle && <p><strong className="text-foreground">YouTube:</strong> {influencer.youtube_handle}</p>}
            {influencer.whatsapp && <p><strong className="text-foreground">WhatsApp:</strong> {influencer.whatsapp}</p>}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-400 mt-4">
            ⏳ O administrador irá revisar sua solicitação e atribuir seu código de referência. Volte em breve!
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  const totalCommission = referrals.reduce((acc, r) => acc + r.commission_cents, 0);
  const unpaidCommission = referrals.filter(r => !r.commission_paid).reduce((acc, r) => acc + r.commission_cents, 0);
  const activeReferrals = referrals.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Painel Influenciador</h1>
            {influencer.is_verified && <Shield className="w-5 h-5 text-primary" />}
          </div>
          <p className="text-muted-foreground mt-1">Bem-vindo, {influencer.name}</p>
        </div>
        <Button onClick={copyReferralLink} variant="outline" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Link de Referência'}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Referências', value: influencer.total_referrals, icon: Users, color: 'text-blue-500' },
          { label: 'Ativos', value: activeReferrals, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Receita Total', value: `R$ ${(totalCommission / 100).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-500' },
          { label: 'Comissão', value: `${influencer.commission_rate}%`, icon: BarChart3, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-4">
            <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Code Card */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Seu código de referência</p>
            <p className="text-lg font-mono font-bold text-primary">{influencer.referral_code}</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyReferralLink} className="gap-2">
            <ExternalLink className="w-3 h-3" />
            Copiar Link
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="referrals">Referências</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">Resumo Mensal</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Novas referências</span>
                  <span className="text-foreground font-medium">
                    {referrals.filter(r => {
                      const d = new Date(r.created_at);
                      const now = new Date();
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comissão pendente</span>
                  <span className="text-foreground font-medium">R$ {(unpaidCommission / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cupons ativos</span>
                  <span className="text-foreground font-medium">{coupons.filter(c => c.is_active).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">Suas Redes</h3>
              <div className="space-y-2">
                {influencer.instagram_handle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Instagram className="w-4 h-4" />
                    <span>{influencer.instagram_handle}</span>
                  </div>
                )}
                {influencer.youtube_handle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Youtube className="w-4 h-4" />
                    <span>{influencer.youtube_handle}</span>
                  </div>
                )}
                {influencer.tiktok_handle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>{influencer.tiktok_handle}</span>
                  </div>
                )}
                {!influencer.instagram_handle && !influencer.youtube_handle && !influencer.tiktok_handle && (
                  <p className="text-xs text-muted-foreground/50">Nenhuma rede social cadastrada</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent referrals */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3">Últimas Referências</h3>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma referência ainda. Compartilhe seu link!</p>
            ) : (
              <div className="space-y-2">
                {referrals.slice(0, 5).map(ref => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="text-sm">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        ref.status === 'active' ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
                      )}>
                        {ref.status === 'active' ? 'Ativo' : ref.status}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      R$ {(ref.commission_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Seus Cupons</h3>
            <Button onClick={() => setCouponModal(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum cupom criado ainda</p>
              <Button onClick={() => setCouponModal(true)} variant="outline" className="mt-3 gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Cupom
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-foreground">{coupon.code}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          coupon.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                        )}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {coupon.discount_percent}% desconto · {coupon.times_used}{coupon.max_uses ? `/${coupon.max_uses}` : ''} usos
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => toggleCoupon(coupon)}>
                      {coupon.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4 mt-4">
          <h3 className="font-semibold text-foreground">Todas as Referências</h3>
          {referrals.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma referência ainda</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          ref.status === 'active' ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
                        )}>
                          {ref.status}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          ref.commission_paid ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-600'
                        )}>
                          {ref.commission_paid ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ref.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-medium text-foreground">
                      R$ {(ref.commission_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4 mt-4">
          <h3 className="font-semibold text-foreground">🏆 Ranking de Influenciadores</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {leaderboard.map((entry, idx) => {
                const isMe = entry.id === influencer?.id;
                return (
                  <div key={entry.id} className={cn(
                    "flex items-center gap-3 p-4",
                    isMe && "bg-primary/5"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      idx === 1 ? "bg-gray-400/20 text-gray-500" :
                      idx === 2 ? "bg-orange-500/20 text-orange-600" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                        {entry.is_verified && <Shield className="w-3 h-3 text-primary" />}
                        {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Você</span>}
                      </div>
                      {entry.instagram_handle && (
                        <p className="text-xs text-muted-foreground">{entry.instagram_handle}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{entry.total_referrals}</p>
                      <p className="text-[10px] text-muted-foreground">referências</p>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum influenciador ativo ainda. Seja o primeiro!
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Coupon Modal */}
      <Dialog open={couponModal} onOpenChange={setCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Cupom de Desconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código do Cupom *</Label>
              <Input
                value={newCouponCode}
                onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                placeholder="ex: IRONJOAO10"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">Letras e números, sem espaços</p>
            </div>
            <div>
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                value={newCouponDiscount}
                onChange={e => setNewCouponDiscount(Number(e.target.value))}
                min={5}
                max={50}
              />
            </div>
            <div>
              <Label>Limite de Usos (opcional)</Label>
              <Input
                type="number"
                value={newCouponMaxUses}
                onChange={e => setNewCouponMaxUses(e.target.value)}
                placeholder="Sem limite"
              />
            </div>
            <Button onClick={handleCreateCoupon} disabled={creatingCoupon} className="w-full gap-2">
              {creatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              Criar Cupom
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
