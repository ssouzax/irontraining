import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Users, Building2, Megaphone, Tag, Star, Plus, Pencil, Trash2, Shield, Phone } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Influencer {
  id: string;
  name: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  followers_count: number | null;
  email: string | null;
  whatsapp: string | null;
  niche: string | null;
  deal_type: string | null;
  status: string | null;
  notes: string | null;
}

interface Brand {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  deal_type: string | null;
  deal_description: string | null;
  deal_value_cents: number | null;
  status: string | null;
  notes: string | null;
}

interface GymPromo {
  id: string;
  gym_name: string;
  gym_id: string | null;
  plan_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  monthly_value_cents: number | null;
  description: string | null;
  status: string | null;
  notes: string | null;
}

interface SpecialistPlan {
  id: string;
  title: string;
  category: string;
  specialist_name: string | null;
  specialist_bio: string | null;
  description: string | null;
  price_cents: number;
  whatsapp_contact: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [gymPromos, setGymPromos] = useState<GymPromo[]>([]);
  const [specialistPlans, setSpecialistPlans] = useState<SpecialistPlan[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingGymPromo, setEditingGymPromo] = useState<GymPromo | null>(null);
  const [editingSpecialistPlan, setEditingSpecialistPlan] = useState<SpecialistPlan | null>(null);

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  async function checkAdminStatus() {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.rpc('is_admin', { _user_id: user.id });
    setIsAdmin(data === true);
    setLoading(false);
    if (data === true) {
      loadAllData();
    }
  }

  async function loadAllData() {
    const [infRes, brandRes, gymRes, specRes, profRes] = await Promise.all([
      supabase.from('influencers').select('*').order('created_at', { ascending: false }),
      supabase.from('brands').select('*').order('created_at', { ascending: false }),
      supabase.from('gym_promo_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('specialist_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, user_id, display_name, email, whatsapp, created_at').order('created_at', { ascending: false }).limit(100),
    ]);

    if (infRes.data) setInfluencers(infRes.data);
    if (brandRes.data) setBrands(brandRes.data);
    if (gymRes.data) setGymPromos(gymRes.data);
    if (specRes.data) setSpecialistPlans(specRes.data as SpecialistPlan[]);
    if (profRes.data) setProfiles(profRes.data);
  }

  // Influencer CRUD
  async function saveInfluencer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name') as string,
      instagram_handle: form.get('instagram_handle') as string || null,
      tiktok_handle: form.get('tiktok_handle') as string || null,
      youtube_handle: form.get('youtube_handle') as string || null,
      followers_count: parseInt(form.get('followers_count') as string) || 0,
      email: form.get('email') as string || null,
      whatsapp: form.get('whatsapp') as string || null,
      niche: form.get('niche') as string || 'fitness',
      deal_type: form.get('deal_type') as string || 'free',
      status: form.get('status') as string || 'active',
      notes: form.get('notes') as string || null,
    };

    if (editingInfluencer) {
      await supabase.from('influencers').update(data).eq('id', editingInfluencer.id);
      toast({ title: 'Influenciador atualizado!' });
    } else {
      await supabase.from('influencers').insert(data);
      toast({ title: 'Influenciador adicionado!' });
    }
    setDialogOpen(null);
    setEditingInfluencer(null);
    loadAllData();
  }

  async function deleteInfluencer(id: string) {
    await supabase.from('influencers').delete().eq('id', id);
    toast({ title: 'Influenciador removido!' });
    loadAllData();
  }

  // Brand CRUD
  async function saveBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name') as string,
      category: form.get('category') as string || 'supplements',
      website: form.get('website') as string || null,
      contact_name: form.get('contact_name') as string || null,
      contact_email: form.get('contact_email') as string || null,
      contact_whatsapp: form.get('contact_whatsapp') as string || null,
      deal_type: form.get('deal_type') as string || 'sponsor',
      deal_description: form.get('deal_description') as string || null,
      deal_value_cents: parseInt(form.get('deal_value_cents') as string) * 100 || 0,
      status: form.get('status') as string || 'active',
      notes: form.get('notes') as string || null,
    };

    if (editingBrand) {
      await supabase.from('brands').update(data).eq('id', editingBrand.id);
      toast({ title: 'Marca atualizada!' });
    } else {
      await supabase.from('brands').insert(data);
      toast({ title: 'Marca adicionada!' });
    }
    setDialogOpen(null);
    setEditingBrand(null);
    loadAllData();
  }

  async function deleteBrand(id: string) {
    await supabase.from('brands').delete().eq('id', id);
    toast({ title: 'Marca removida!' });
    loadAllData();
  }

  // GymPromo CRUD
  async function saveGymPromo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      gym_name: form.get('gym_name') as string,
      plan_type: form.get('plan_type') as string || 'basic',
      contact_name: form.get('contact_name') as string || null,
      contact_email: form.get('contact_email') as string || null,
      contact_whatsapp: form.get('contact_whatsapp') as string || null,
      monthly_value_cents: parseInt(form.get('monthly_value_cents') as string) * 100 || 0,
      description: form.get('description') as string || null,
      status: form.get('status') as string || 'active',
      notes: form.get('notes') as string || null,
    };

    if (editingGymPromo) {
      await supabase.from('gym_promo_plans').update(data).eq('id', editingGymPromo.id);
      toast({ title: 'Academia atualizada!' });
    } else {
      await supabase.from('gym_promo_plans').insert(data);
      toast({ title: 'Academia adicionada!' });
    }
    setDialogOpen(null);
    setEditingGymPromo(null);
    loadAllData();
  }

  async function deleteGymPromo(id: string) {
    await supabase.from('gym_promo_plans').delete().eq('id', id);
    toast({ title: 'Academia removida!' });
    loadAllData();
  }

  // Specialist Plan CRUD
  async function saveSpecialistPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get('title') as string,
      category: form.get('category') as string || 'diet',
      specialist_name: form.get('specialist_name') as string || null,
      specialist_bio: form.get('specialist_bio') as string || null,
      description: form.get('description') as string || null,
      price_cents: parseInt(form.get('price_cents') as string) * 100 || 0,
      whatsapp_contact: form.get('whatsapp_contact') as string || null,
      is_active: form.get('is_active') === 'true',
      is_featured: form.get('is_featured') === 'true',
    };

    if (editingSpecialistPlan) {
      await supabase.from('specialist_plans').update(data).eq('id', editingSpecialistPlan.id);
      toast({ title: 'Plano atualizado!' });
    } else {
      await supabase.from('specialist_plans').insert(data);
      toast({ title: 'Plano adicionado!' });
    }
    setDialogOpen(null);
    setEditingSpecialistPlan(null);
    loadAllData();
  }

  async function deleteSpecialistPlan(id: string) {
    await supabase.from('specialist_plans').delete().eq('id', id);
    toast({ title: 'Plano removido!' });
    loadAllData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
      </div>

      <Tabs defaultValue="specialist" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="specialist" className="flex items-center gap-1">
            <Star className="w-4 h-4" /> Especialistas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="influencers" className="flex items-center gap-1">
            <Megaphone className="w-4 h-4" /> Influenciadores
          </TabsTrigger>
          <TabsTrigger value="gyms" className="flex items-center gap-1">
            <Building2 className="w-4 h-4" /> Academias
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-1">
            <Tag className="w-4 h-4" /> Marcas
          </TabsTrigger>
        </TabsList>

        {/* SPECIALIST PLANS TAB */}
        <TabsContent value="specialist" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Planos Especialistas (Dieta, Treino Personalizado)
              </CardTitle>
              <Dialog open={dialogOpen === 'specialist'} onOpenChange={(o) => { setDialogOpen(o ? 'specialist' : null); if (!o) setEditingSpecialistPlan(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adicionar Plano</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingSpecialistPlan ? 'Editar' : 'Novo'} Plano Especialista</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={saveSpecialistPlan} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Título do Plano *</Label>
                        <Input name="title" defaultValue={editingSpecialistPlan?.title || ''} required />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select name="category" defaultValue={editingSpecialistPlan?.category || 'diet'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diet">Dieta</SelectItem>
                            <SelectItem value="training">Treino Personalizado</SelectItem>
                            <SelectItem value="coaching">Coaching Completo</SelectItem>
                            <SelectItem value="consultation">Consultoria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Especialista</Label>
                        <Input name="specialist_name" defaultValue={editingSpecialistPlan?.specialist_name || ''} />
                      </div>
                      <div>
                        <Label>Preço (R$)</Label>
                        <Input name="price_cents" type="number" defaultValue={(editingSpecialistPlan?.price_cents || 0) / 100} />
                      </div>
                    </div>
                    <div>
                      <Label>Bio do Especialista</Label>
                      <Textarea name="specialist_bio" defaultValue={editingSpecialistPlan?.specialist_bio || ''} />
                    </div>
                    <div>
                      <Label>Descrição do Plano</Label>
                      <Textarea name="description" defaultValue={editingSpecialistPlan?.description || ''} />
                    </div>
                    <div>
                      <Label>WhatsApp para Contato</Label>
                      <Input name="whatsapp_contact" defaultValue={editingSpecialistPlan?.whatsapp_contact || ''} placeholder="+55 11 99999-9999" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ativo</Label>
                        <Select name="is_active" defaultValue={editingSpecialistPlan?.is_active ? 'true' : 'false'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Destaque</Label>
                        <Select name="is_featured" defaultValue={editingSpecialistPlan?.is_featured ? 'true' : 'false'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Especialista</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialistPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.category === 'diet' ? 'Dieta' : plan.category === 'training' ? 'Treino' : plan.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.specialist_name || '-'}</TableCell>
                      <TableCell>
                        {plan.whatsapp_contact && (
                          <a href={`https://wa.me/${plan.whatsapp_contact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                            <Phone className="w-3 h-3" /> {plan.whatsapp_contact}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>R$ {((plan.price_cents || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {plan.is_featured && <Badge className="ml-1" variant="outline">⭐</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingSpecialistPlan(plan); setDialogOpen('specialist'); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteSpecialistPlan(plan.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuários Premium (últimos 100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.display_name || '-'}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {profile.whatsapp ? (
                          <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                            <Phone className="w-3 h-3" /> {profile.whatsapp}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INFLUENCERS TAB */}
        <TabsContent value="influencers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Influenciadores
              </CardTitle>
              <Dialog open={dialogOpen === 'influencer'} onOpenChange={(o) => { setDialogOpen(o ? 'influencer' : null); if (!o) setEditingInfluencer(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingInfluencer ? 'Editar' : 'Novo'} Influenciador</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={saveInfluencer} className="space-y-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input name="name" defaultValue={editingInfluencer?.name || ''} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Instagram</Label>
                        <Input name="instagram_handle" defaultValue={editingInfluencer?.instagram_handle || ''} placeholder="@usuario" />
                      </div>
                      <div>
                        <Label>TikTok</Label>
                        <Input name="tiktok_handle" defaultValue={editingInfluencer?.tiktok_handle || ''} placeholder="@usuario" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>YouTube</Label>
                        <Input name="youtube_handle" defaultValue={editingInfluencer?.youtube_handle || ''} />
                      </div>
                      <div>
                        <Label>Seguidores</Label>
                        <Input name="followers_count" type="number" defaultValue={editingInfluencer?.followers_count || 0} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input name="email" type="email" defaultValue={editingInfluencer?.email || ''} />
                      </div>
                      <div>
                        <Label>WhatsApp</Label>
                        <Input name="whatsapp" defaultValue={editingInfluencer?.whatsapp || ''} placeholder="+55 11 99999-9999" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nicho</Label>
                        <Select name="niche" defaultValue={editingInfluencer?.niche || 'fitness'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="powerlifting">Powerlifting</SelectItem>
                            <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                            <SelectItem value="crossfit">CrossFit</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tipo de Deal</Label>
                        <Select name="deal_type" defaultValue={editingInfluencer?.deal_type || 'free'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="barter">Permuta</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="affiliate">Afiliado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select name="status" defaultValue={editingInfluencer?.status || 'active'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea name="notes" defaultValue={editingInfluencer?.notes || ''} />
                    </div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Seguidores</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {influencers.map((inf) => (
                    <TableRow key={inf.id}>
                      <TableCell className="font-medium">{inf.name}</TableCell>
                      <TableCell>{inf.instagram_handle || '-'}</TableCell>
                      <TableCell>{inf.followers_count?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        {inf.whatsapp && (
                          <a href={`https://wa.me/${inf.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                            <Phone className="w-3 h-3" /> {inf.whatsapp}
                          </a>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{inf.deal_type}</Badge></TableCell>
                      <TableCell><Badge variant={inf.status === 'active' ? 'default' : 'secondary'}>{inf.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingInfluencer(inf); setDialogOpen('influencer'); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteInfluencer(inf.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GYMS TAB */}
        <TabsContent value="gyms" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Academias com Planos de Divulgação
              </CardTitle>
              <Dialog open={dialogOpen === 'gym'} onOpenChange={(o) => { setDialogOpen(o ? 'gym' : null); if (!o) setEditingGymPromo(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingGymPromo ? 'Editar' : 'Nova'} Academia</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={saveGymPromo} className="space-y-4">
                    <div>
                      <Label>Nome da Academia *</Label>
                      <Input name="gym_name" defaultValue={editingGymPromo?.gym_name || ''} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Plano</Label>
                        <Select name="plan_type" defaultValue={editingGymPromo?.plan_type || 'basic'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor Mensal (R$)</Label>
                        <Input name="monthly_value_cents" type="number" defaultValue={(editingGymPromo?.monthly_value_cents || 0) / 100} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contato</Label>
                        <Input name="contact_name" defaultValue={editingGymPromo?.contact_name || ''} />
                      </div>
                      <div>
                        <Label>WhatsApp</Label>
                        <Input name="contact_whatsapp" defaultValue={editingGymPromo?.contact_whatsapp || ''} placeholder="+55 11 99999-9999" />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input name="contact_email" type="email" defaultValue={editingGymPromo?.contact_email || ''} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea name="description" defaultValue={editingGymPromo?.description || ''} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select name="status" defaultValue={editingGymPromo?.status || 'active'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea name="notes" defaultValue={editingGymPromo?.notes || ''} />
                    </div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academia</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Valor/mês</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gymPromos.map((gym) => (
                    <TableRow key={gym.id}>
                      <TableCell className="font-medium">{gym.gym_name}</TableCell>
                      <TableCell><Badge variant="outline">{gym.plan_type}</Badge></TableCell>
                      <TableCell>{gym.contact_name || '-'}</TableCell>
                      <TableCell>
                        {gym.contact_whatsapp && (
                          <a href={`https://wa.me/${gym.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                            <Phone className="w-3 h-3" /> {gym.contact_whatsapp}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>R$ {((gym.monthly_value_cents || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={gym.status === 'active' ? 'default' : 'secondary'}>{gym.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingGymPromo(gym); setDialogOpen('gym'); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteGymPromo(gym.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDS TAB */}
        <TabsContent value="brands" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Marcas Parceiras
              </CardTitle>
              <Dialog open={dialogOpen === 'brand'} onOpenChange={(o) => { setDialogOpen(o ? 'brand' : null); if (!o) setEditingBrand(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingBrand ? 'Editar' : 'Nova'} Marca</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={saveBrand} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input name="name" defaultValue={editingBrand?.name || ''} required />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select name="category" defaultValue={editingBrand?.category || 'supplements'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supplements">Suplementos</SelectItem>
                            <SelectItem value="equipment">Equipamentos</SelectItem>
                            <SelectItem value="apparel">Vestuário</SelectItem>
                            <SelectItem value="tech">Tecnologia</SelectItem>
                            <SelectItem value="nutrition">Nutrição</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input name="website" defaultValue={editingBrand?.website || ''} placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contato</Label>
                        <Input name="contact_name" defaultValue={editingBrand?.contact_name || ''} />
                      </div>
                      <div>
                        <Label>WhatsApp</Label>
                        <Input name="contact_whatsapp" defaultValue={editingBrand?.contact_whatsapp || ''} placeholder="+55 11 99999-9999" />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input name="contact_email" type="email" defaultValue={editingBrand?.contact_email || ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Deal</Label>
                        <Select name="deal_type" defaultValue={editingBrand?.deal_type || 'sponsor'}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sponsor">Patrocínio</SelectItem>
                            <SelectItem value="affiliate">Afiliado</SelectItem>
                            <SelectItem value="barter">Permuta</SelectItem>
                            <SelectItem value="ad">Publicidade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor (R$)</Label>
                        <Input name="deal_value_cents" type="number" defaultValue={(editingBrand?.deal_value_cents || 0) / 100} />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição do Deal</Label>
                      <Textarea name="deal_description" defaultValue={editingBrand?.deal_description || ''} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select name="status" defaultValue={editingBrand?.status || 'active'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea name="notes" defaultValue={editingBrand?.notes || ''} />
                    </div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell><Badge variant="outline">{brand.category}</Badge></TableCell>
                      <TableCell>{brand.contact_name || '-'}</TableCell>
                      <TableCell>
                        {brand.contact_whatsapp && (
                          <a href={`https://wa.me/${brand.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                            <Phone className="w-3 h-3" /> {brand.contact_whatsapp}
                          </a>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{brand.deal_type}</Badge></TableCell>
                      <TableCell>R$ {((brand.deal_value_cents || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>{brand.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingBrand(brand); setDialogOpen('brand'); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteBrand(brand.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
