import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RotateCw, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Muscle highlight data per exercise
const EXERCISE_MUSCLES: Record<string, { primary: string[]; secondary: string[]; tips: string[] }> = {
  'Supino Reto': {
    primary: ['Peitoral Maior'],
    secondary: ['Tríceps', 'Deltóide Anterior'],
    tips: ['Mantenha escápulas retraídas', 'Pés firmes no chão', 'Desça a barra até o peito'],
  },
  'Agachamento': {
    primary: ['Quadríceps', 'Glúteos'],
    secondary: ['Isquiotibiais', 'Core', 'Eretores'],
    tips: ['Joelhos alinhados com os pés', 'Tronco neutro', 'Desça até paralelo ou abaixo'],
  },
  'Levantamento Terra': {
    primary: ['Posteriores de Coxa', 'Eretores', 'Glúteos'],
    secondary: ['Trapézio', 'Core', 'Antebraços'],
    tips: ['Barra próxima ao corpo', 'Lombar neutra', 'Empurre o chão com os pés'],
  },
  'Desenvolvimento': {
    primary: ['Deltóides'],
    secondary: ['Tríceps', 'Trapézio Superior'],
    tips: ['Cotovelos levemente à frente', 'Core contraído', 'Extensão completa acima'],
  },
  'Remada Curvada': {
    primary: ['Dorsais', 'Rombóides'],
    secondary: ['Bíceps', 'Eretores', 'Trapézio'],
    tips: ['Inclinação de 45°', 'Puxe para o abdômen', 'Escápulas juntas no topo'],
  },
  'Rosca Direta': {
    primary: ['Bíceps Braquial'],
    secondary: ['Braquiorradial', 'Antebraços'],
    tips: ['Cotovelos fixos', 'Sem balanço do tronco', 'Contração controlada'],
  },
};

// Simple 3D human body with highlighted muscles
function HumanBody({ primaryMuscles }: { primaryMuscles: string[] }) {
  const isChest = primaryMuscles.some(m => m.includes('Peitoral'));
  const isLegs = primaryMuscles.some(m => m.includes('Quadríceps') || m.includes('Glúteos') || m.includes('Isquiotibiais') || m.includes('Posteriores'));
  const isBack = primaryMuscles.some(m => m.includes('Dorsais') || m.includes('Eretores') || m.includes('Rombóides'));
  const isShoulders = primaryMuscles.some(m => m.includes('Deltóide'));
  const isArms = primaryMuscles.some(m => m.includes('Bíceps'));

  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.6]} />
        <meshStandardMaterial color={isChest || isBack ? '#ef4444' : '#6b7280'} transparent opacity={isChest || isBack ? 0.9 : 0.4} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#6b7280" transparent opacity={0.4} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.85, 0.5, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial color={isArms || isShoulders ? '#ef4444' : '#6b7280'} transparent opacity={isArms || isShoulders ? 0.9 : 0.4} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.85, 0.5, 0]}>
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial color={isArms || isShoulders ? '#ef4444' : '#6b7280'} transparent opacity={isArms || isShoulders ? 0.9 : 0.4} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[-0.65, 1.2, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={isShoulders ? '#ef4444' : '#6b7280'} transparent opacity={isShoulders ? 0.9 : 0.4} />
      </mesh>
      <mesh position={[0.65, 1.2, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={isShoulders ? '#ef4444' : '#6b7280'} transparent opacity={isShoulders ? 0.9 : 0.4} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.3, -1, 0]}>
        <capsuleGeometry args={[0.18, 1.2, 8, 16]} />
        <meshStandardMaterial color={isLegs ? '#ef4444' : '#6b7280'} transparent opacity={isLegs ? 0.9 : 0.4} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.3, -1, 0]}>
        <capsuleGeometry args={[0.18, 1.2, 8, 16]} />
        <meshStandardMaterial color={isLegs ? '#ef4444' : '#6b7280'} transparent opacity={isLegs ? 0.9 : 0.4} />
      </mesh>
    </group>
  );
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

  const current = exercises[currentIndex];
  const data = EXERCISE_MUSCLES[current];

  const prev = () => setCurrentIndex(i => (i - 1 + exercises.length) % exercises.length);
  const next = () => setCurrentIndex(i => (i + 1) % exercises.length);

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* 3D Viewer */}
        <div className="h-[220px] relative bg-gradient-to-b from-muted/50 to-background">
          <Canvas camera={{ position: [0, 0.5, 4], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 3, 2]} intensity={1} />
            <Suspense fallback={null}>
              <HumanBody primaryMuscles={data.primary} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
            </Suspense>
          </Canvas>

          {/* Navigation */}
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

          <button
            onClick={() => setShowTips(!showTips)}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border"
          >
            <Info className="w-4 h-4 text-foreground" />
          </button>

          <div className="absolute top-3 left-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border">
            <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Muscle info */}
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
