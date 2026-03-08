import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const BARBELL_WEIGHT = 20;
const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-600',
  20: 'bg-blue-600',
  15: 'bg-yellow-500',
  10: 'bg-green-600',
  5: 'bg-foreground/80',
  2.5: 'bg-foreground/50',
  1.25: 'bg-foreground/30',
};

const PLATE_WIDTHS: Record<number, string> = {
  25: 'w-8 h-24',
  20: 'w-7 h-22',
  15: 'w-6 h-20',
  10: 'w-5 h-18',
  5: 'w-4 h-16',
  2.5: 'w-3 h-14',
  1.25: 'w-2.5 h-12',
};

function calculatePlates(totalWeight: number): { plates: number[]; achievable: boolean; actualWeight: number } {
  const weightPerSide = (totalWeight - BARBELL_WEIGHT) / 2;
  if (weightPerSide < 0) return { plates: [], achievable: false, actualWeight: BARBELL_WEIGHT };
  
  const plates: number[] = [];
  let remaining = weightPerSide;
  
  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }
  
  const actualWeight = BARBELL_WEIGHT + (plates.reduce((a, b) => a + b, 0) * 2);
  return { plates, achievable: remaining === 0, actualWeight };
}

export default function PlateCalculator() {
  const [targetWeight, setTargetWeight] = useState(100);

  const { plates, achievable, actualWeight } = calculatePlates(targetWeight);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Calculadora de Anilhas</h1>
        <p className="text-muted-foreground mt-1">Barra olímpica de {BARBELL_WEIGHT}kg</p>
      </motion.div>

      {/* Weight Input */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated">
        <label className="text-sm text-muted-foreground block mb-3">Peso total desejado (kg)</label>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            value={targetWeight}
            onChange={e => setTargetWeight(parseFloat(e.target.value) || 0)}
            step={2.5}
            min={20}
            className="w-28 bg-background border border-border rounded-xl px-4 py-3 text-xl text-center text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-muted-foreground text-lg">kg</span>
          <div className="flex gap-2 flex-wrap">
            {[2.5, 5, 10, -2.5, -5, -10].map(delta => (
              <button
                key={delta}
                onClick={() => setTargetWeight(Math.max(20, targetWeight + delta))}
                className="px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {delta > 0 ? '+' : ''}{delta}
              </button>
            ))}
          </div>
          <button onClick={() => setTargetWeight(20)} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {[60, 80, 100, 120, 140, 160, 180, 200].map(w => (
            <button
              key={w}
              onClick={() => setTargetWeight(w)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors",
                targetWeight === w ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {w}kg
            </button>
          ))}
        </div>
      </motion.div>

      {/* Visual Barbell */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Visualização da Barra</h3>
        
        <div className="flex items-center justify-center gap-1 py-8 overflow-x-auto">
          {/* Left plates (reversed) */}
          <div className="flex items-center gap-0.5 flex-row-reverse">
            {plates.map((plate, i) => (
              <motion.div
                key={`l-${i}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "rounded-sm flex items-center justify-center",
                  PLATE_COLORS[plate] || 'bg-muted-foreground',
                  plate >= 20 ? 'w-6 sm:w-8 h-20 sm:h-24' :
                  plate >= 10 ? 'w-4 sm:w-5 h-16 sm:h-20' :
                  plate >= 5 ? 'w-3 sm:w-4 h-14 sm:h-16' :
                  'w-2 sm:w-3 h-10 sm:h-12'
                )}
              >
                <span className="text-[8px] sm:text-[10px] font-bold text-primary-foreground -rotate-90">{plate}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Collar */}
          <div className="w-2 sm:w-3 h-8 sm:h-10 bg-muted-foreground/50 rounded-sm" />
          
          {/* Barbell */}
          <div className="w-20 sm:w-32 h-3 sm:h-4 bg-muted-foreground/30 rounded-full relative">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 sm:w-10 h-5 sm:h-6 -top-1 bg-muted-foreground/20 rounded-sm border border-muted-foreground/10" />
          </div>
          
          {/* Collar */}
          <div className="w-2 sm:w-3 h-8 sm:h-10 bg-muted-foreground/50 rounded-sm" />
          
          {/* Right plates */}
          <div className="flex items-center gap-0.5">
            {plates.map((plate, i) => (
              <motion.div
                key={`r-${i}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "rounded-sm flex items-center justify-center",
                  PLATE_COLORS[plate] || 'bg-muted-foreground',
                  plate >= 20 ? 'w-6 sm:w-8 h-20 sm:h-24' :
                  plate >= 10 ? 'w-4 sm:w-5 h-16 sm:h-20' :
                  plate >= 5 ? 'w-3 sm:w-4 h-14 sm:h-16' :
                  'w-2 sm:w-3 h-10 sm:h-12'
                )}
              >
                <span className="text-[8px] sm:text-[10px] font-bold text-primary-foreground -rotate-90">{plate}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {!achievable && (
          <p className="text-xs text-warning text-center mt-2">
            ⚠️ Peso exato não alcançável. Peso mais próximo: {actualWeight}kg
          </p>
        )}
      </motion.div>

      {/* Plate breakdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Anilhas por lado</h3>
        
        {plates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Apenas a barra ({BARBELL_WEIGHT}kg)</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AVAILABLE_PLATES.map(plate => {
              const count = plates.filter(p => p === plate).length;
              if (count === 0) return null;
              return (
                <div key={plate} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground", PLATE_COLORS[plate])}>
                    {plate}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{count}× {plate}kg</p>
                    <p className="text-[10px] text-muted-foreground">{count * 2} anilhas no total</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Barra: {BARBELL_WEIGHT}kg</p>
            <p className="text-xs text-muted-foreground">Anilhas por lado: {plates.reduce((a, b) => a + b, 0)}kg</p>
          </div>
          <p className="text-lg font-bold text-foreground">
            Total: <span className="text-primary">{actualWeight}kg</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
