import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProgramPage() {
  const { program, currentWeek, setCurrentWeek, setCurrentDay } = useTraining();
  const [expandedBlock, setExpandedBlock] = useState<string | null>(program.blocks[0].id);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const navigate = useNavigate();

  const goToWorkout = (weekNum: number, dayIdx: number) => {
    setCurrentWeek(weekNum);
    setCurrentDay(dayIdx);
    navigate('/workout');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Program</h1>
        <p className="text-muted-foreground mt-1">{program.name} · {program.durationWeeks} weeks</p>
      </motion.div>

      <div className="space-y-3">
        {program.blocks.map(block => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
          >
            <button
              onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-sm">{block.name}</p>
                  <p className="text-xs text-muted-foreground">{block.weekRange} · {block.goal}</p>
                </div>
              </div>
              {expandedBlock === block.id ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedBlock === block.id && (
              <div className="border-t border-border">
                {block.weeks.map(week => (
                  <div key={week.id} className="border-b border-border last:border-0">
                    <button
                      onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors text-sm",
                        week.weekNumber === currentWeek && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">Week {week.weekNumber}</span>
                        {week.weekNumber === currentWeek && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      {expandedWeek === week.id ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>

                    {expandedWeek === week.id && (
                      <div className="px-5 pb-4 space-y-2">
                        {week.days.map((day, dayIdx) => (
                          <button
                            key={day.id}
                            onClick={() => goToWorkout(week.weekNumber, dayIdx)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{day.dayOfWeek} — {day.name}</p>
                              <p className="text-xs text-muted-foreground">{day.exercises.length} exercises · {day.focus}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
