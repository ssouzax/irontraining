

# Plano de Implementação: Rebranding para Iron Training

## Contexto Atual

O aplicativo está usando "PowerBuild" como nome em diversos lugares, mas precisa ser renomeado para "Iron Training". A logo correta já existe em `src/assets/iron-training-logo.png`. Além disso, há ajustes necessários nos planos de assinatura e clarificação sobre o email de cadastro.

## Problemas Identificados

1. **Nome "PowerBuild" em múltiplos arquivos**:
   - `index.html`: títulos, meta tags, apple-mobile-web-app-title
   - `vite.config.ts`: PWA manifest (name, short_name, description)
   - `src/components/AppSidebar.tsx`: texto do sidebar
   - `src/pages/AuthPage.tsx`: título e subtítulo
   - `src/pages/LandingPage.tsx`: vários textos (se houver)
   - Outros arquivos mencionados na busca (migrations, componentes mobile, etc.)

2. **Logo não utilizada em todos os lugares apropriados**:
   - Sidebar usa ícone de Dumbbell genérico
   - AuthPage usa ícone de Dumbbell genérico
   - Alguns lugares podem se beneficiar da logo real

3. **Dieta no plano errado**:
   - Pelos dados do banco, "Dieta personalizada" está listada em `standard_monthly` e `standard_yearly`
   - Deve estar APENAS nos planos premium (monthly e yearly)

4. **Aviso de email existente mas pode ser mais claro**:
   - Já existe um aviso amarelo na página de assinatura
   - Pode ser tornado ainda mais proeminente e claro

## Mudanças Necessárias

### 1. **Arquivos de Configuração e Metadados**

**`index.html`** (linhas 6-11, 15-16):
- Trocar título de "PowerBuild" para "Iron Training"
- Atualizar meta description e author
- Atualizar apple-mobile-web-app-title
- Atualizar og:title

**`vite.config.ts`** (linhas 37-39):
- Manifest name: "Iron Training — Treino de Força"
- Manifest short_name: "Iron Training"
- Atualizar description

### 2. **Componentes da Interface**

**`src/components/AppSidebar.tsx`** (linhas 54-58):
- Substituir o ícone `<Dumbbell>` por `<img src={logoImg} />` (importar logo)
- Trocar texto "PowerBuild" para "Iron Training"
- Ajustar dimensões da imagem (w-8 h-8)

**`src/pages/AuthPage.tsx`** (linhas 42-46):
- Substituir o ícone `<Dumbbell>` por `<img src={logoImg} />` (importar logo)
- Trocar h1 de "PowerBuild" para "Iron Training"
- Ajustar dimensões da imagem

### 3. **Página de Assinatura**

**`src/pages/SubscribePage.tsx`**:

**Header com Logo** (após linha 122):
- Adicionar logo acima ou ao lado do título
- Pode substituir o ícone Crown por uma combinação de logo + Crown

**Aviso de Email Mais Proeminente** (linhas 139-152):
- Aumentar o padding e border-width
- Tornar o texto maior e mais em negrito
- Adicionar um segundo aviso abaixo do botão "Assinar Agora" em cada card
- Adicionar ícone adicional (Email/Mail)

**Exemplo de novo aviso no topo**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="mt-6 p-6 rounded-2xl border-2 border-amber-500 bg-amber-500/15 max-w-2xl mx-auto shadow-lg"
>
  <div className="flex items-start gap-4">
    <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
    <div>
      <p className="text-base font-bold text-amber-600 dark:text-amber-400 mb-2">
        ⚠️ ATENÇÃO: Email deve ser o mesmo do cadastro
      </p>
      <p className="text-sm text-muted-foreground">
        Para que seu plano seja ativado automaticamente, você DEVE usar o <strong>mesmo email</strong> que está cadastrado no aplicativo ao realizar a compra na plataforma Kiwify.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Exemplo: Se você se cadastrou com <code className="bg-background/50 px-1 rounded">joao@email.com</code>, use este mesmo email na compra.
      </p>
    </div>
  </div>
</motion.div>
```

**Aviso adicional nos cards de plano** (dentro do PlanCard, antes do botão):
```tsx
{!isCurrent && plan.kiwify_product_id && (
  <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-amber-600 dark:text-amber-400">
    <strong>Lembre-se:</strong> Use o email cadastrado no app
  </div>
)}
```

### 4. **Ajuste de Features nos Planos (Banco de Dados)**

**SQL Migration necessária**:

```sql
-- Remover "Dieta personalizada" dos planos standard
UPDATE subscription_plans 
SET features = features - 'Dieta personalizada'
WHERE tier = 'standard' AND interval IN ('monthly', 'yearly');

-- Garantir que "Dieta IA" está apenas nos planos premium
-- Primeiro, verificar se já existe
UPDATE subscription_plans 
SET features = CASE 
  WHEN features @> '["Dieta IA"]' THEN features
  ELSE features || '["Dieta personalizada IA"]'::jsonb
END
WHERE tier = 'premium' AND interval IN ('monthly', 'yearly');
```

**Atualização das features na página** (linhas 239-248):
- A feature "Dieta IA" já está marcada como "Premium" na UI
- Precisa garantir que isso está alinhado com o banco

### 5. **Outros Arquivos com PowerBuild**

**Arquivos que podem ter PowerBuild mas são menos críticos**:
- `src/components/mobile/MobileWrappedCards.tsx`: nome de arquivo de download
- `src/data/program.ts`: nome de programa padrão
- `src/pages/ProgramGenerator.tsx`: opção de objetivo
- `supabase/functions/analyze-training/index.ts`: prompt do sistema
- Migrations SQL: nomes de tipos/categorias

**Decisão**: Focar primeiro nos arquivos críticos de UI/UX visíveis ao usuário. Os outros podem ser atualizados em uma segunda fase se necessário.

## Ordem de Implementação

1. **Fase 1 - Metadados (crítico para SEO e PWA)**:
   - `index.html`
   - `vite.config.ts`

2. **Fase 2 - Interface Principal (o que o usuário vê sempre)**:
   - `src/components/AppSidebar.tsx`
   - `src/pages/AuthPage.tsx`

3. **Fase 3 - Página de Assinatura**:
   - Atualizar `src/pages/SubscribePage.tsx` com:
     - Avisos de email mais proeminentes
     - Logo do Iron Training no header
   - Executar migration SQL para ajustar features dos planos

4. **Fase 4 - Landing Page (se necessário)**:
   - Verificar e atualizar `src/pages/LandingPage.tsx` (já usa logo corretamente)

## Detalhes Técnicos

### Importação da Logo

Em todos os componentes que precisarem da logo:
```typescript
import logoImg from '@/assets/iron-training-logo.png';
```

### Uso da Logo

```tsx
<img 
  src={logoImg} 
  alt="Iron Training" 
  className="w-8 h-8 object-contain"
/>
```

### Classes Tailwind para Avisos

Para o aviso principal:
- `border-2 border-amber-500` (mais grosso)
- `bg-amber-500/15` (mais visível)
- `p-6` (mais padding)
- `shadow-lg` (sombra)

## Considerações

1. **Cache do PWA**: Após alterar o manifest no vite.config.ts, usuários podem precisar limpar cache ou reinstalar o PWA
2. **SEO**: As mudanças no index.html melhorarão o SEO para "Iron Training"
3. **Consistência**: Todos os textos visíveis devem usar "Iron Training", mas código interno pode manter alguns nomes antigos se não afetar funcionalidade
4. **Features dos Planos**: A mudança no banco garantirá que a dieta IA seja um diferencial exclusivo do Premium

