import { motion } from 'framer-motion';
import { Bot, Send, Loader2, Settings2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

const PERSONALITIES = [
  { id: 'motivational', label: '🔥 Motivacional', desc: 'Encorajador e positivo', tone: 'Encouraging, supportive, celebrates every win' },
  { id: 'technical', label: '📊 Técnico', desc: 'Analítico e preciso', tone: 'Data-driven, focuses on performance analysis and numbers' },
  { id: 'hardcore', label: '💀 Hardcore', desc: 'Direto e intenso', tone: 'Intense, demanding, no excuses, pushes hard' },
  { id: 'friendly', label: '😄 Parceiro', desc: 'Casual e relaxado', tone: 'Casual, friendly, relaxed gym buddy vibe' },
];

export default function CoachPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState('motivational');
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('coach_personality').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.coach_personality) setPersonality(data.coach_personality as string);
        });
    }
  }, [user]);

  useEffect(() => {
    const p = PERSONALITIES.find(p => p.id === personality);
    setMessages([{
      role: 'assistant',
      content: getGreeting(personality),
    }]);
  }, [personality]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getGreeting = (id: string) => {
    const greetings: Record<string, string> = {
      motivational: `Olá! 💪 Sou seu **Coach Motivacional de Powerbuilding**. Estou aqui para te ajudar a atingir seus objetivos e celebrar cada conquista!\n\nPosso te ajudar com:\n- **Ajustes de carga** e progressão\n- **Detecção de platô** e estratégias\n- **Gestão de fadiga** e recovery\n\nVamos treinar forte! 🔥`,
      technical: `Olá. Sou seu **Coach Técnico de Powerbuilding**. Minha abordagem é baseada em dados e análise de performance.\n\nPosso analisar:\n- **Métricas de RIR** e precisão de auto-regulação\n- **Progressão de E1RM** e tendências\n- **Volume e intensidade** por grupo muscular\n\nVamos aos dados.`,
      hardcore: `E aí. Sou seu **Coach Hardcore**. Sem desculpas, sem mimimi. Aqui é treino pesado e resultado.\n\n🏋️ Vou te cobrar:\n- **Cargas máximas** e progressão agressiva\n- **Consistência** — sem faltar treino\n- **Intensidade** — cada série conta\n\nBora meter peso.`,
      friendly: `Fala! 😄 Sou seu **parceiro de treino virtual**. Tô aqui pra trocar ideia sobre treino de boa.\n\nPode perguntar sobre:\n- **Dicas de treino** e exercícios\n- **Como tá sua progressão**\n- **Qualquer dúvida** de powerbuilding\n\nManda ver!`,
    };
    return greetings[id] || greetings.motivational;
  };

  const savePersonality = async (id: string) => {
    setPersonality(id);
    if (user) {
      await supabase.from('profiles').update({ coach_personality: id }).eq('user_id', user.id);
    }
    setShowSettings(false);
  };

  const buildContext = () => {
    const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
    const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
    const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
    return {
      bodyWeight: profile.bodyWeight,
      estimatedMaxes: { squat: squat1RM, deadlift: deadlift1RM, bench: bench1RM },
      targets: profile.targetProgression,
      goals: profile.goals,
      personality: PERSONALITIES.find(p => p.id === personality)?.tone || '',
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length === allMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error('Sem corpo de resposta');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Falha ao conectar com o coach IA.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPersonality = PERSONALITIES.find(p => p.id === personality);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] sm:h-[calc(100vh-4rem)]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Coach IA</h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
            {currentPersonality?.label} — {currentPersonality?.desc}
          </p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Settings2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Personality Selector */}
      {showSettings && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="mb-4 grid grid-cols-2 gap-2">
          {PERSONALITIES.map(p => (
            <button key={p.id} onClick={() => savePersonality(p.id)}
              className={cn("p-3 rounded-xl border text-left transition-colors",
                personality === p.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
              )}>
              <p className="text-sm font-medium text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
            </button>
          ))}
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Coach IA</span>
                </div>
              )}
              <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Pergunte sobre seu treino..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
