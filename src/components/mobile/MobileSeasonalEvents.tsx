import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SeasonalEvent {
  id: string;
  name: string;
  description: string | null;
  event_type: string;
  theme_color: string;
  icon: string;
  start_date: string;
  end_date: string;
  xp_multiplier: number;
  is_active: boolean;
}

interface EventParticipation {
  event_id: string;
  points_earned: number;
  challenges_completed: number;
}

export function MobileSeasonalEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [participations, setParticipations] = useState<Record<string, EventParticipation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    const { data: eventsData } = await supabase
      .from('seasonal_events')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString());
    
    if (eventsData) {
      setEvents(eventsData as any[]);
      
      const { data: parts } = await supabase
        .from('event_participation')
        .select('*')
        .eq('user_id', user.id)
        .in('event_id', (eventsData as any[]).map(e => e.id));
      
      const map: Record<string, EventParticipation> = {};
      (parts as any[])?.forEach(p => { map[p.event_id] = p; });
      setParticipations(map);
    }
    setLoading(false);
  };

  const joinEvent = async (eventId: string) => {
    if (!user) return;
    await supabase.from('event_participation').insert({
      event_id: eventId,
      user_id: user.id,
    } as any);
    toast.success('🎉 Você entrou no evento!');
    loadEvents();
  };

  if (loading || events.length === 0) return null;

  return (
    <div className="mx-4 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-bold text-foreground">Eventos Especiais</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {events.map(event => {
          const participation = participations[event.id];
          const joined = !!participation;
          const daysLeft = Math.ceil((new Date(event.end_date).getTime() - Date.now()) / 86400000);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-w-[200px] rounded-2xl border border-border overflow-hidden bg-card shrink-0"
            >
              <div
                className="p-3 text-white"
                style={{ background: `linear-gradient(135deg, ${event.theme_color}, ${event.theme_color}88)` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{event.icon}</span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {event.xp_multiplier}x XP
                  </span>
                </div>
                <p className="text-sm font-extrabold">{event.name}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{daysLeft} dias restantes</p>
              </div>

              <div className="p-3">
                {event.description && (
                  <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                )}

                {joined ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">{participation.points_earned} pts</p>
                      <p className="text-[10px] text-muted-foreground">{participation.challenges_completed} desafios</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Participando</span>
                  </div>
                ) : (
                  <button
                    onClick={() => joinEvent(event.id)}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    Participar
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
