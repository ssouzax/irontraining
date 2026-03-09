import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Scale, Ruler, Droplets, Utensils, Pill, Heart } from 'lucide-react';

interface DietProfile {
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  health_conditions: string | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  meals_per_day: number | null;
  water_liters_per_day: number | null;
  foods_at_home: string | null;
  foods_easy_to_buy: string | null;
  uses_supplements: boolean | null;
  supplement_notes: string | null;
  goal: string | null;
  activity_level: string | null;
  diet_restrictions: string | null;
}

export function DietProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<DietProfile>({
    age: null,
    height_cm: null,
    weight_kg: null,
    health_conditions: null,
    waist_cm: null,
    hip_cm: null,
    chest_cm: null,
    arm_cm: null,
    thigh_cm: null,
    meals_per_day: 3,
    water_liters_per_day: 2,
    foods_at_home: null,
    foods_easy_to_buy: null,
    uses_supplements: false,
    supplement_notes: null,
    goal: 'weight_loss',
    activity_level: 'moderate',
    diet_restrictions: null,
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase
      .from('diet_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('diet_profiles')
      .upsert({
        user_id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil de dieta salvo com sucesso!' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="w-5 h-5 text-primary" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Idade</Label>
            <Input
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
              placeholder="25"
            />
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input
              type="number"
              value={profile.height_cm || ''}
              onChange={(e) => setProfile({ ...profile, height_cm: parseFloat(e.target.value) || null })}
              placeholder="175"
            />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.weight_kg || ''}
              onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || null })}
              placeholder="75.5"
            />
          </div>
          <div>
            <Label>Objetivo</Label>
            <Select value={profile.goal || 'weight_loss'} onValueChange={(v) => setProfile({ ...profile, goal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">Perder Peso</SelectItem>
                <SelectItem value="muscle_gain">Ganhar Massa</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="health">Saúde Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-red-500" />
            Saúde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Possui alguma doença ou condição que pode afetar a dieta?</Label>
            <Textarea
              value={profile.health_conditions || ''}
              onChange={(e) => setProfile({ ...profile, health_conditions: e.target.value })}
              placeholder="Ex: diabetes, hipertensão, intolerância à lactose, alergias alimentares..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Restrições alimentares</Label>
            <Textarea
              value={profile.diet_restrictions || ''}
              onChange={(e) => setProfile({ ...profile, diet_restrictions: e.target.value })}
              placeholder="Ex: vegetariano, vegano, sem glúten, sem lactose..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nível de Atividade</Label>
            <Select value={profile.activity_level || 'moderate'} onValueChange={(v) => setProfile({ ...profile, activity_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentário</SelectItem>
                <SelectItem value="light">Leve (1-2x/semana)</SelectItem>
                <SelectItem value="moderate">Moderado (3-4x/semana)</SelectItem>
                <SelectItem value="active">Ativo (5-6x/semana)</SelectItem>
                <SelectItem value="very_active">Muito Ativo (2x/dia)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Body Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="w-5 h-5 text-blue-500" />
            Medidas Corporais (cm)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <Label>Cintura</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.waist_cm || ''}
              onChange={(e) => setProfile({ ...profile, waist_cm: parseFloat(e.target.value) || null })}
              placeholder="80"
            />
          </div>
          <div>
            <Label>Quadril</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.hip_cm || ''}
              onChange={(e) => setProfile({ ...profile, hip_cm: parseFloat(e.target.value) || null })}
              placeholder="95"
            />
          </div>
          <div>
            <Label>Peitoral</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.chest_cm || ''}
              onChange={(e) => setProfile({ ...profile, chest_cm: parseFloat(e.target.value) || null })}
              placeholder="100"
            />
          </div>
          <div>
            <Label>Braço</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.arm_cm || ''}
              onChange={(e) => setProfile({ ...profile, arm_cm: parseFloat(e.target.value) || null })}
              placeholder="35"
            />
          </div>
          <div>
            <Label>Coxa</Label>
            <Input
              type="number"
              step="0.1"
              value={profile.thigh_cm || ''}
              onChange={(e) => setProfile({ ...profile, thigh_cm: parseFloat(e.target.value) || null })}
              placeholder="55"
            />
          </div>
        </CardContent>
      </Card>

      {/* Eating Habits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="w-5 h-5 text-orange-500" />
            Hábitos Alimentares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Refeições por dia</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={profile.meals_per_day || 3}
                onChange={(e) => setProfile({ ...profile, meals_per_day: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Droplets className="w-4 h-4" /> Água por dia (litros)
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={profile.water_liters_per_day || 2}
                onChange={(e) => setProfile({ ...profile, water_liters_per_day: parseFloat(e.target.value) || 2 })}
              />
            </div>
          </div>
          <div>
            <Label>Alimentos que tem com facilidade em casa</Label>
            <Textarea
              value={profile.foods_at_home || ''}
              onChange={(e) => setProfile({ ...profile, foods_at_home: e.target.value })}
              placeholder="Ex: arroz, feijão, frango, ovos, frutas..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Alimentos que tem facilidade em comprar</Label>
            <Textarea
              value={profile.foods_easy_to_buy || ''}
              onChange={(e) => setProfile({ ...profile, foods_easy_to_buy: e.target.value })}
              placeholder="Ex: peito de frango, batata doce, whey protein..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Supplements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="w-5 h-5 text-purple-500" />
            Suplementação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={profile.uses_supplements || false}
              onCheckedChange={(checked) => setProfile({ ...profile, uses_supplements: checked })}
            />
            <Label>Teria facilidade em utilizar suplementos se necessário?</Label>
          </div>
          {profile.uses_supplements && (
            <div>
              <Label>Observações sobre suplementos</Label>
              <Textarea
                value={profile.supplement_notes || ''}
                onChange={(e) => setProfile({ ...profile, supplement_notes: e.target.value })}
                placeholder="Ex: já uso whey e creatina, tenho interesse em outros..."
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Perfil de Dieta'}
      </Button>
    </form>
  );
}
