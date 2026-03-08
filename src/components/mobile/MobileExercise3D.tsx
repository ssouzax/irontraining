import { useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RotateCw, Info, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { AnatomicalBody } from './AnatomicalBody3D';

const EXERCISE_MUSCLES: Record<string, { primary: string[]; secondary: string[]; tips: string[]; posture: { label: string; angle: number; ideal: number; tolerance: number }[] }> = {
  'Supino Reto': {
    primary: ['Peitoral Maior'],
    secondary: ['Tríceps', 'Deltóide Anterior', 'Core'],
    tips: ['Mantenha escápulas retraídas', 'Pés firmes no chão', 'Desça a barra até o peito'],
    posture: [
      { label: 'Arco lombar', angle: 15, ideal: 15, tolerance: 10 },
      { label: 'Ângulo cotovelo', angle: 75, ideal: 75, tolerance: 15 },
      { label: 'Retração escapular', angle: 90, ideal: 90, tolerance: 10 },
    ],
  },
  'Agachamento': {
    primary: ['Quadríceps', 'Glúteos'],
    secondary: ['Isquiotibiais', 'Core', 'Eretores', 'Panturrilha'],
    tips: ['Joelhos alinhados com os pés', 'Tronco neutro', 'Desça até paralelo ou abaixo'],
    posture: [
      { label: 'Profundidade', angle: 95, ideal: 100, tolerance: 15 },
      { label: 'Inclinação tronco', angle: 45, ideal: 45, tolerance: 10 },
      { label: 'Valgismo joelho', angle: 0, ideal: 0, tolerance: 5 },
    ],
  },
  'Levantamento Terra': {
    primary: ['Posteriores de Coxa', 'Eretores', 'Glúteos'],
    secondary: ['Trapézio', 'Core', 'Antebraços', 'Dorsais', 'Quadríceps'],
    tips: ['Barra próxima ao corpo', 'Lombar neutra', 'Empurre o chão com os pés'],
    posture: [
      { label: 'Curvatura lombar', angle: 5, ideal: 0, tolerance: 8 },
      { label: 'Ângulo quadril', angle: 60, ideal: 55, tolerance: 10 },
      { label: 'Distância barra-corpo', angle: 2, ideal: 0, tolerance: 5 },
    ],
  },
  'Desenvolvimento': {
    primary: ['Deltóides', 'Deltóide Anterior', 'Deltóide Lateral'],
    secondary: ['Tríceps', 'Trapézio', 'Core'],
    tips: ['Cotovelos levemente à frente', 'Core contraído', 'Extensão completa acima'],
    posture: [
      { label: 'Extensão overhead', angle: 170, ideal: 180, tolerance: 10 },
      { label: 'Ativação core', angle: 85, ideal: 90, tolerance: 10 },
      { label: 'Posição cotovelo', angle: 85, ideal: 90, tolerance: 10 },
    ],
  },
  'Remada Curvada': {
    primary: ['Dorsais', 'Rombóides'],
    secondary: ['Bíceps Braquial', 'Eretores', 'Trapézio', 'Deltóide Posterior', 'Antebraços'],
    tips: ['Inclinação de 45°', 'Puxe para o abdômen', 'Escápulas juntas no topo'],
    posture: [
      { label: 'Inclinação tronco', angle: 48, ideal: 45, tolerance: 10 },
      { label: 'Retração escapular', angle: 80, ideal: 90, tolerance: 15 },
      { label: 'Curvatura lombar', angle: 3, ideal: 0, tolerance: 8 },
    ],
  },
  'Rosca Direta': {
    primary: ['Bíceps Braquial'],
    secondary: ['Braquiorradial', 'Antebraços', 'Braquial'],
    tips: ['Cotovelos fixos', 'Sem balanço do tronco', 'Contração controlada'],
    posture: [
      { label: 'Fixação cotovelo', angle: 5, ideal: 0, tolerance: 8 },
      { label: 'Balanço tronco', angle: 3, ideal: 0, tolerance: 5 },
      { label: 'ROM completo', angle: 140, ideal: 145, tolerance: 10 },
    ],
  },
  'Tríceps Pulley': {
    primary: ['Tríceps'],
    secondary: ['Antebraços', 'Core'],
    tips: ['Cotovelos colados ao corpo', 'Extensão completa', 'Contração no final'],
    posture: [
      { label: 'Fixação cotovelo', angle: 3, ideal: 0, tolerance: 8 },
      { label: 'Postura tronco', angle: 5, ideal: 0, tolerance: 8 },
      { label: 'Extensão completa', angle: 172, ideal: 180, tolerance: 10 },
    ],
  },
  'Elevação Lateral': {
    primary: ['Deltóide Lateral', 'Deltóides'],
    secondary: ['Trapézio', 'Core'],
    tips: ['Leve inclinação no tronco', 'Cotovelos levemente flexionados', 'Eleve até a linha do ombro'],
    posture: [
      { label: 'Ângulo elevação', angle: 88, ideal: 90, tolerance: 10 },
      { label: 'Inclinação tronco', angle: 8, ideal: 5, tolerance: 8 },
      { label: 'Rotação ombro', angle: 85, ideal: 90, tolerance: 10 },
    ],
  },
  'Leg Press': {
    primary: ['Quadríceps', 'Glúteos'],
    secondary: ['Isquiotibiais', 'Panturrilha'],
    tips: ['Costas bem apoiadas', 'Não trave os joelhos', 'Pés na largura dos ombros'],
    posture: [
      { label: 'Ângulo joelho', angle: 88, ideal: 90, tolerance: 10 },
      { label: 'Apoio lombar', angle: 2, ideal: 0, tolerance: 5 },
      { label: 'Amplitude', angle: 92, ideal: 100, tolerance: 15 },
    ],
  },
  'Puxada Frontal': {
    primary: ['Dorsais'],
    secondary: ['Bíceps Braquial', 'Rombóides', 'Trapézio', 'Deltóide Posterior'],
    tips: ['Peito para cima', 'Puxe com os cotovelos', 'Desça até o queixo'],
    posture: [
      { label: 'Retração escapular', angle: 82, ideal: 90, tolerance: 12 },
      { label: 'Inclinação tronco', angle: 12, ideal: 10, tolerance: 8 },
      { label: 'ROM completo', angle: 165, ideal: 170, tolerance: 10 },
    ],
  },
  'Panturrilha em Pé': {
    primary: ['Panturrilha'],
    secondary: ['Core'],
    tips: ['Extensão completa no topo', 'Desça lentamente', 'Mantenha joelhos estendidos'],
    posture: [
      { label: 'Extensão plantar', angle: 42, ideal: 45, tolerance: 8 },
      { label: 'Alinhamento joelho', angle: 2, ideal: 0, tolerance: 5 },
      { label: 'Amplitude', angle: 88, ideal: 90, tolerance: 10 },
    ],
  },
  'Stiff': {
    primary: ['Isquiotibiais', 'Posteriores de Coxa', 'Glúteos'],
    secondary: ['Eretores', 'Core'],
    tips: ['Joelhos levemente flexionados', 'Lombar neutra', 'Sinta o alongamento posterior'],
    posture: [
      { label: 'Curvatura lombar', angle: 4, ideal: 0, tolerance: 8 },
      { label: 'Flexão joelho', angle: 12, ideal: 10, tolerance: 8 },
      { label: 'Amplitude quadril', angle: 82, ideal: 90, tolerance: 12 },
    ],
  },
};

function PostureIndicator({ label, angle, ideal, tolerance }: { label: string; angle: number; ideal: number; tolerance: number }) {
  const diff = Math.abs(angle - ideal);
  const grade = diff <= tolerance * 0.4 ? 'excellent' : diff <= tolerance ? 'good' : 'adjust';
  const color = grade === 'excellent' ? 'text-green-400' : grade === 'good' ? 'text-yellow-400' : 'text-red-400';
  const bg = grade === 'excellent' ? 'bg-green-400/10' : grade === 'good' ? 'bg-yellow-400/10' : 'bg-red-400/10';
  const Icon = grade === 'excellent' ? CheckCircle : grade === 'good' ? AlertTriangle : XCircle;
  
  return (
    <div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg", bg)}>
      <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-foreground truncate">{label}</span>
          <span className={cn("text-[10px] font-bold", color)}>{angle}°</span>
        </div>
        <div className="h-1 bg-muted rounded-full mt-0.5 overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", grade === 'excellent' ? 'bg-green-400' : grade === 'good' ? 'bg-yellow-400' : 'bg-red-400')}
            style={{ width: `${Math.max(10, 100 - (diff / tolerance) * 60)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Animated human body with muscle highlights and posture lines — now uses AnatomicalBody

function AnimationClock({ onUpdate }: { onUpdate: (t: number) => void }) {
  useFrame(({ clock }) => onUpdate(clock.getElapsedTime()));
  return null;
}

interface MobileExercise3DProps {
  exerciseName?: string;
}

export function MobileExercise3D({ exerciseName }: MobileExercise3DProps) {
  const exercises = Object.keys(EXERCISE_MUSCLES);
  const [currentIndex, setCurrentIndex] = useState(
    exerciseName ? Math.max(0, exercises.indexOf(exerciseName)) : 0
  );
  const [showTips, setShowTips] = useState(false);
  const [showPosture, setShowPosture] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);

  const current = exercises[currentIndex];
  const data = EXERCISE_MUSCLES[current];

  const overallScore = data.posture.reduce((acc, p) => {
    const diff = Math.abs(p.angle - p.ideal);
    const s = diff <= p.tolerance * 0.4 ? 100 : diff <= p.tolerance ? 75 : 40;
    return acc + s;
  }, 0) / data.posture.length;

  const overallGrade = overallScore >= 90 ? 'Excelente' : overallScore >= 65 ? 'Bom' : 'Ajustar';
  const gradeColor = overallScore >= 90 ? 'text-green-400' : overallScore >= 65 ? 'text-yellow-400' : 'text-red-400';
  const gradeBg = overallScore >= 90 ? 'bg-green-400/15' : overallScore >= 65 ? 'bg-yellow-400/15' : 'bg-red-400/15';

  const prev = () => setCurrentIndex(i => (i - 1 + exercises.length) % exercises.length);
  const next = () => setCurrentIndex(i => (i + 1) % exercises.length);

  return (
    <div className="mx-4 mt-3 space-y-3">
      {/* 3D Viewer Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-[360px] relative bg-gradient-to-b from-muted/30 via-background to-muted/20">
          <Canvas camera={{ position: [0, 0.4, 3.2], fov: 42 }} dpr={[1, 2]}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 3]} intensity={1.4} castShadow />
            <directionalLight position={[-2, 2, -2]} intensity={0.4} color="#93c5fd" />
            <pointLight position={[-3, 1, 4]} intensity={0.3} color="#a78bfa" />
            <pointLight position={[3, -1, 2]} intensity={0.2} color="#fb923c" />
            <Suspense fallback={null}>
              <AnatomicalBody primaryMuscles={data.primary} secondaryMuscles={data.secondary} animationPhase={animPhase} />
              <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.6} minDistance={2} maxDistance={6} />
              <AnimationClock onUpdate={setAnimPhase} />
            </Suspense>
          </Canvas>

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            <button onClick={prev} className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm font-bold text-foreground px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border">
              {current}
            </span>
            <button onClick={next} className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Grade badge */}
          <div className={cn("absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm border border-border", gradeBg)}>
            <div className={cn("w-2 h-2 rounded-full", overallScore >= 90 ? 'bg-green-400' : overallScore >= 65 ? 'bg-yellow-400' : 'bg-red-400')} />
            <span className={cn("text-[10px] font-bold", gradeColor)}>{overallGrade}</span>
            <span className="text-[10px] text-muted-foreground">{Math.round(overallScore)}pts</span>
          </div>

          {/* Legend */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-border">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-[9px] text-muted-foreground">Primário</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              <span className="text-[9px] text-muted-foreground">Secundário</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#64748b] opacity-40" />
              <span className="text-[9px] text-muted-foreground">Inativo</span>
            </div>
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={() => { setShowPosture(!showPosture); setShowTips(false); }}
              className={cn("p-2 rounded-full backdrop-blur-sm border border-border", showPosture ? 'bg-primary/20' : 'bg-background/80')}
            >
              <Eye className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => { setShowTips(!showTips); setShowPosture(false); }}
              className={cn("p-2 rounded-full backdrop-blur-sm border border-border", showTips ? 'bg-primary/20' : 'bg-background/80')}
            >
              <Info className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="absolute bottom-14 left-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border">
            <RotateCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

          {/* Grade badge */}
          <div className={cn("absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm border border-border", gradeBg)}>
            <div className={cn("w-2 h-2 rounded-full", overallScore >= 90 ? 'bg-green-400' : overallScore >= 65 ? 'bg-yellow-400' : 'bg-red-400')} />
            <span className={cn("text-[10px] font-bold", gradeColor)}>{overallGrade}</span>
            <span className="text-[10px] text-muted-foreground">{Math.round(overallScore)}pts</span>
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={() => { setShowPosture(!showPosture); setShowTips(false); }}
              className={cn("p-2 rounded-full backdrop-blur-sm border border-border", showPosture ? 'bg-primary/20' : 'bg-background/80')}
            >
              <Eye className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => { setShowTips(!showTips); setShowPosture(false); }}
              className={cn("p-2 rounded-full backdrop-blur-sm border border-border", showTips ? 'bg-primary/20' : 'bg-background/80')}
            >
              <Info className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="absolute bottom-14 left-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border">
            <RotateCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Muscle tags */}
        <div className="p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {data.primary.map(m => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                {m}
              </span>
            ))}
            {data.secondary.map(m => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {m}
              </span>
            ))}
          </div>

          {/* Posture analysis */}
          <AnimatePresence>
            {showPosture && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Análise de postura</p>
                  {data.posture.map((p, i) => (
                    <PostureIndicator key={i} {...p} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Dicas de execução</p>
                  {data.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] text-primary font-bold mt-0.5">•</span>
                      <span className="text-xs text-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
