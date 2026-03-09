import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Download, Gift } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/iron-training-logo.png';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Capture referral code from URL
  const refCode = searchParams.get('ref') || '';
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    if (refCode) {
      // Look up referrer
      supabase
        .from('influencers')
        .select('name')
        .eq('referral_code', refCode)
        .single()
        .then(({ data }) => {
          if (data) setReferrerName(data.name);
        });
    }
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isLogin) {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(authError.message);
    } else {
      // Sign up flow
      const { data, error: authError } = await signUp(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        // Track referral if we have a ref code or coupon
        const codeToUse = couponCode.trim().toUpperCase() || refCode;
        
        if (codeToUse && data?.user) {
          // Try to find influencer by coupon or referral code
          let influencerId: string | null = null;
          let couponId: string | null = null;

          // First check coupons
          const { data: coupon } = await supabase
            .from('influencer_coupons')
            .select('id, influencer_id')
            .eq('code', codeToUse)
            .eq('is_active', true)
            .single();

          if (coupon) {
            influencerId = coupon.influencer_id;
            couponId = coupon.id;
            // Increment coupon usage
            await supabase.rpc('increment_coupon_usage', { coupon_id: coupon.id }).catch(() => {});
          } else {
            // Check referral code
            const { data: inf } = await supabase
              .from('influencers')
              .select('id')
              .eq('referral_code', codeToUse)
              .single();
            if (inf) influencerId = inf.id;
          }

          if (influencerId) {
            // Update profile with referrer
            await supabase.from('profiles').update({
              referred_by_influencer_id: influencerId,
              referral_coupon_used: codeToUse,
            }).eq('user_id', data.user.id);

            // Create referral record
            await supabase.from('influencer_referrals').insert({
              influencer_id: influencerId,
              referred_user_id: data.user.id,
              coupon_id: couponId,
              status: 'pending',
            });

            // Increment influencer stats
            await supabase.rpc('increment_influencer_referrals', { inf_id: influencerId }).catch(() => {});
          }
        }

        setMessage('Verifique seu e-mail para confirmar a conta.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <img src={logoImg} alt="Iron Training" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Iron Training</h1>
          <p className="text-muted-foreground mt-1">Treino de Força & Hipertrofia</p>
        </div>

        {/* Referral banner */}
        {referrerName && !isLogin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success/10 border border-success/30 rounded-xl p-4 mb-4 flex items-center gap-3"
          >
            <Gift className="w-6 h-6 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Indicado por {referrerName}!</p>
              <p className="text-xs text-muted-foreground">Você ganha XP bônus ao se cadastrar</p>
            </div>
          </motion.div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 card-elevated">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="voce@exemplo.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {/* Coupon field for signup */}
            {!isLogin && !refCode && (
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Cupom de desconto (opcional)</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="IRONCODE123"
                />
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-success">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>

        <Link
          to="/install"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Download className="w-4 h-4" />
          Instalar app no celular
        </Link>
      </motion.div>
    </div>
  );
}
