import { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RotateCw, Info, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

const EXERCISE_MUSCLES: Record<string, { primary: string[]; secondary: string[]; tips: string[]; posture: { label: string; angle: number; ideal: number; tolerance: number }[] }> = {
  'Supino Reto': {
    primary: ['Peitoral Maior'],
    secondary: ['Tríceps', 'Deltóide Anterior'],
    tips: ['Mantenha escápulas retraídas', 'Pés firmes no chão', 'Desça a barra até o peito'],
    posture: [
      { label: 'Arco lombar', angle: 15, ideal: 15, tolerance: 10 },
      { label: 'Ângulo cotovelo', angle: 75, ideal: 75, tolerance: 15 },
      { label: 'Retração escapular', angle: 90, ideal: 90, tolerance: 10 },
    ],
  },
  'Agachamento': {
    primary: ['Quadríceps', 'Glúteos'],
    secondary: ['Isquiotibiais', 'Core', 'Eretores'],
    tips: ['Joelhos alinhados com os pés', 'Tronco neutro', 'Desça até paralelo ou abaixo'],
    posture: [
      { label: 'Profundidade', angle: 95, ideal: 100, tolerance: 15 },
      { label: 'Inclinação tronco', angle: 45, ideal: 45, tolerance: 10 },
      { label: 'Valgismo joelho', angle: 0, ideal: 0, tolerance: 5 },
    ],
  },
  'Levantamento Terra': {
    primary: ['Posteriores de Coxa', 'Eretores', 'Glúteos'],
    secondary: ['Trapézio', 'Core', 'Antebraços'],
    tips: ['Barra próxima ao corpo', 'Lombar neutra', 'Empurre o chão com os pés'],
    posture: [
      { label: 'Curvatura lombar', angle: 5, ideal: 0, tolerance: 8 },
      { label: 'Ângulo quadril', angle: 60, ideal: 55, tolerance: 10 },
      { label: 'Distância barra-corpo', angle: 2, ideal: 0, tolerance: 5 },
    ],
  },
  'Desenvolvimento': {
    primary: ['Deltóides'],
    secondary: ['Tríceps', 'Trapézio Superior'],
    tips: ['Cotovelos levemente à frente', 'Core contraído', 'Extensão completa acima'],
    posture: [
      { label: 'Extensão overhead', angle: 170, ideal: 180, tolerance: 10 },
      { label: 'Ativação core', angle: 85, ideal: 90, tolerance: 10 },
      { label: 'Posição cotovelo', angle: 85, ideal: 90, tolerance: 10 },
    ],
  },
  'Remada Curvada': {
    primary: ['Dorsais', 'Rombóides'],
    secondary: ['Bíceps', 'Eretores', 'Trapézio'],
    tips: ['Inclinação de 45°', 'Puxe para o abdômen', 'Escápulas juntas no topo'],
    posture: [
      { label: 'Inclinação tronco', angle: 48, ideal: 45, tolerance: 10 },
      { label: 'Retração escapular', angle: 80, ideal: 90, tolerance: 15 },
      { label: 'Curvatura lombar', angle: 3, ideal: 0, tolerance: 8 },
    ],
  },
  'Rosca Direta': {
    primary: ['Bíceps Braquial'],
    secondary: ['Braquiorradial', 'Antebraços'],
    tips: ['Cotovelos fixos', 'Sem balanço do tronco', 'Contração controlada'],
    posture: [
      { label: 'Fixação cotovelo', angle: 5, ideal: 0, tolerance: 8 },
      { label: 'Balanço tronco', angle: 3, ideal: 0, tolerance: 5 },
      { label: 'ROM completo', angle: 140, ideal: 145, tolerance: 10 },
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

// Animated human body with muscle highlights and posture lines
function HumanBody({ primaryMuscles, animationPhase }: { primaryMuscles: string[]; animationPhase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const isChest = primaryMuscles.some(m => m.includes('Peitoral'));
  const isLegs = primaryMuscles.some(m => m.includes('Quadríceps') || m.includes('Glúteos') || m.includes('Isquiotibiais') || m.includes('Posteriores'));
  const isBack = primaryMuscles.some(m => m.includes('Dorsais') || m.includes('Eretores') || m.includes('Rombóides'));
  const isShoulders = primaryMuscles.some(m => m.includes('Deltóide'));
  const isArms = primaryMuscles.some(m => m.includes('Bíceps'));

  const breathe = Math.sin(animationPhase * 0.5) * 0.02;
  const armLift = isChest ? Math.sin(animationPhase * 0.8) * 0.15 : isArms ? Math.sin(animationPhase * 1.2) * 0.3 : 0;
  const squat = isLegs ? Math.sin(animationPhase * 0.6) * 0.2 : 0;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = breathe - squat * 0.5;
    }
  });

  const primaryColor = '#ef4444';
  const secondaryColor = '#f97316';
  const inactiveColor = '#4b5563';

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.6]} />
        <meshStandardMaterial color={isChest || isBack ? primaryColor : inactiveColor} transparent opacity={isChest || isBack ? 0.9 : 0.35} />
      </mesh>
      {/* Chest detail */}
      {isChest && (
        <mesh position={[0, 0.8, 0.31]}>
          <boxGeometry args={[1.0, 0.6, 0.05]} />
          <meshStandardMaterial color={primaryColor} transparent opacity={0.95} emissive={primaryColor} emissiveIntensity={0.3} />
        </mesh>
      )}
      {/* Back detail */}
      {isBack && (
        <mesh position={[0, 0.6, -0.31]}>
          <boxGeometry args={[1.0, 1.0, 0.05]} />
          <meshStandardMaterial color={primaryColor} transparent opacity={0.95} emissive={primaryColor} emissiveIntensity={0.3} />
        </mesh>
      )}
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={inactiveColor} transparent opacity={0.35} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 8]} />
        <meshStandardMaterial color={inactiveColor} transparent opacity={0.35} />
      </mesh>
      {/* Left arm */}
      <group position={[-0.85, 0.5 + armLift, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
          <meshStandardMaterial color={isArms || isShoulders ? primaryColor : inactiveColor} transparent opacity={isArms || isShoulders ? 0.9 : 0.35} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.1, 0.4, 8, 16]} />
          <meshStandardMaterial color={isArms ? secondaryColor : inactiveColor} transparent opacity={isArms ? 0.8 : 0.3} />
        </mesh>
      </group>
      {/* Right arm */}
      <group position={[0.85, 0.5 + armLift, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
          <meshStandardMaterial color={isArms || isShoulders ? primaryColor : inactiveColor} transparent opacity={isArms || isShoulders ? 0.9 : 0.35} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.1, 0.4, 8, 16]} />
          <meshStandardMaterial color={isArms ? secondaryColor : inactiveColor} transparent opacity={isArms ? 0.8 : 0.3} />
        </mesh>
      </group>
      {/* Shoulders */}
      <mesh position={[-0.65, 1.2, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={isShoulders ? primaryColor : inactiveColor} transparent opacity={isShoulders ? 0.9 : 0.35} emissive={isShoulders ? primaryColor : '#000'} emissiveIntensity={isShoulders ? 0.2 : 0} />
      </mesh>
      <mesh position={[0.65, 1.2, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={isShoulders ? primaryColor : inactiveColor} transparent opacity={isShoulders ? 0.9 : 0.35} emissive={isShoulders ? primaryColor : '#000'} emissiveIntensity={isShoulders ? 0.2 : 0} />
      </mesh>
      {/* Hip */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.5]} />
        <meshStandardMaterial color={isLegs ? secondaryColor : inactiveColor} transparent opacity={isLegs ? 0.7 : 0.3} />
      </mesh>
      {/* Left leg - upper */}
      <mesh position={[-0.3, -0.85 - squat, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={isLegs ? primaryColor : inactiveColor} transparent opacity={isLegs ? 0.9 : 0.35} emissive={isLegs ? primaryColor : '#000'} emissiveIntensity={isLegs ? 0.2 : 0} />
      </mesh>
      {/* Left leg - lower */}
      <mesh position={[-0.3, -1.6 - squat * 0.5, 0]}>
        <capsuleGeometry args={[0.14, 0.6, 8, 16]} />
        <meshStandardMaterial color={isLegs ? secondaryColor : inactiveColor} transparent opacity={isLegs ? 0.8 : 0.3} />
      </mesh>
      {/* Right leg - upper */}
      <mesh position={[0.3, -0.85 - squat, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 8, 16]} />
        <meshStandardMaterial color={isLegs ? primaryColor : inactiveColor} transparent opacity={isLegs ? 0.9 : 0.35} emissive={isLegs ? primaryColor : '#000'} emissiveIntensity={isLegs ? 0.2 : 0} />
      </mesh>
      {/* Right leg - lower */}
      <mesh position={[0.3, -1.6 - squat * 0.5, 0]}>
        <capsuleGeometry args={[0.14, 0.6, 8, 16]} />
        <meshStandardMaterial color={isLegs ? secondaryColor : inactiveColor} transparent opacity={isLegs ? 0.8 : 0.3} />
      </mesh>
      {/* Core highlight ring */}
      {(isBack || isLegs) && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.03, 8, 32]} />
          <meshStandardMaterial color={secondaryColor} transparent opacity={0.6} emissive={secondaryColor} emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

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
        <div className="h-[260px] relative bg-gradient-to-b from-muted/50 to-background">
          <Canvas camera={{ position: [0, 0.5, 4.5], fov: 38 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 3, 2]} intensity={1.2} />
            <pointLight position={[-2, 1, 3]} intensity={0.4} color="#8b5cf6" />
            <Suspense fallback={null}>
              <HumanBody primaryMuscles={data.primary} animationPhase={animPhase} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
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
