import { motion } from 'framer-motion';
import { Bot, Send } from 'lucide-react';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: `Hey! I'm your AI Powerbuilding Coach. I can help you with:

• **Load adjustments** based on your performance
• **Plateau identification** and solutions
• **Accessory recommendations** for weak points
• **Recovery tips** and training modifications
• **Form cues** and technique advice

What would you like help with today?`,
  },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mock AI response (will be replaced with real AI via Cloud)
    setTimeout(() => {
      const responses = [
        "Based on your current squat at 150kg×4, your estimated 1RM is around 170kg. To hit your 180-190kg target, I'd recommend progressive overload of 2.5kg per week on your top sets during Block 2. Focus on maintaining RIR 1-2 and prioritize quad accessories like leg press and front squats.",
        "Looking at your deadlift PR of 177.5kg, you're in a great position. During the peaking block, consider adding deficit deadlifts at 60-70% for 3×3 to improve off-the-floor strength. Your target of 185-200kg is very achievable with proper periodization.",
        "For bench progress, since you're at 90kg (45 each side) ×5, I'd suggest adding close-grip bench as a primary accessory. Also ensure you're doing 3-4 sets of face pulls every push day to maintain shoulder health and stability.",
      ];
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Coach</h1>
        <p className="text-muted-foreground mt-1">Your intelligent training assistant</p>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Coach</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your training..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Connect to Lovable Cloud for real AI coaching
        </p>
      </div>
    </div>
  );
}
