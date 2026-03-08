import { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Play, Pause, SkipBack, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const REPLAY_EXERCISES = [
  {
    name: 'Agachamento',
    frames: 60,
    getUserPose: (t: number) => ({
      squat: Math.sin(t * Math.PI) * 0.35,
      torsoLean: Math.sin(t * Math.PI) * 12,
      kneeAngle: 90 + Math.sin(t * Math.PI) * 20,
    }),
    getIdealPose: (t: number) => ({
      squat: Math.sin(t * Math.PI) * 0.35,
      torsoLean: Math.sin(t * Math.PI) * 8,
      kneeAngle: 90 + Math.sin(t * Math.PI) * 15,
    }),
  },
  {
    name: 'Supino Reto',
    frames: 50,
    getUserPose: (t: number) => ({
      squat: 0,
      torsoLean: 0,
      kneeAngle: 90,
      armLift: Math.sin(t * Math.PI) * 0.4,
    }),
    getIdealPose: (t: number) => ({
      squat: 0,
      torsoLean: 0,
      kneeAngle: 90,
      armLift: Math.sin(t * Math.PI) * 0.35,
    }),
  },
  {
    name: 'Levantamento Terra',
    frames: 55,
    getUserPose: (t: number) => ({
      squat: Math.sin(t * Math.PI) * 0.25,
      torsoLean: Math.sin(t * Math.PI) * 30,
      kneeAngle: 90 + Math.sin(t * Math.PI) * 25,
    }),
    getIdealPose: (t: number) => ({
      squat: Math.sin(t * Math.PI) * 0.25,
      torsoLean: Math.sin(t * Math.PI) * 25,
      kneeAngle: 90 + Math.sin(t * Math.PI) * 20,
    }),
  },
];

function ReplayBody({ pose, color, xOffset }: { pose: any; color: string; xOffset: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const squat = pose.squat || 0;
  const armLift = pose.armLift || 0;

  return (
    <group ref={groupRef} position={[xOffset, -squat * 0.5, 0]}>
      {/* Torso */}
      <mesh position={[0, 0.5, 0]} rotation={[-(pose.torsoLean || 0) * Math.PI / 180, 0, 0]}>
        <boxGeometry args={[0.9, 1.3, 0.45]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.65, 0.5 + armLift, 0]}>
        <capsuleGeometry args={[0.09, 0.65, 8, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.65, 0.5 + armLift, 0]}>
        <capsuleGeometry args={[0.09, 0.65, 8, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.22, -0.7 - squat, 0]}>
        <capsuleGeometry args={[0.14, 0.6, 8, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.22, -0.7 - squat, 0]}>
        <capsuleGeometry args={[0.14, 0.6, 8, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function ReplayScene({ exercise, progress, playing }: { exercise: typeof REPLAY_EXERCISES[0]; progress: number; playing: boolean }) {
  const t = progress;
  const userPose = exercise.getUserPose(t);
  const idealPose = exercise.getIdealPose(t);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 2]} intensity={1} />
      <pointLight position={[-2, 1, 3]} intensity={0.3} color="#8b5cf6" />
      
      {/* User (left, red-ish) */}
      <ReplayBody pose={userPose} color="#ef4444" xOffset={-0.8} />
      
      {/* Ideal (right, green) */}
      <ReplayBody pose={idealPose} color="#22c55e" xOffset={0.8} />

      {/* Floor grid */}
      <gridHelper args={[6, 12, '#333', '#222']} position={[0, -1.5, 0]} />
      
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

export function MobileReplay3D() {
  const [exIndex, setExIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);

  const exercise = REPLAY_EXERCISES[exIndex];

  const startPlayback = () => {
    setPlaying(true);
    let start = Date.now();
    const duration = 3000;
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      setProgress(t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    setPlaying(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const reset = () => {
    stopPlayback();
    setProgress(0);
  };

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <RotateCw className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Replay 3D</h2>
          <p className="text-xs text-muted-foreground">Compare sua execução com o modelo ideal</p>
        </div>
      </div>

      {/* Exercise selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {REPLAY_EXERCISES.map((e, i) => (
          <button
            key={e.name}
            onClick={() => { setExIndex(i); reset(); }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              exIndex === i ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
            )}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* 3D Viewer */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-[280px] relative bg-gradient-to-b from-muted/30 to-background">
          <Canvas camera={{ position: [0, 0.5, 5], fov: 35 }}>
            <Suspense fallback={null}>
              <ReplayScene exercise={exercise} progress={progress} playing={playing} />
            </Suspense>
          </Canvas>

          {/* Legend */}
          <div className="absolute top-3 left-3 flex gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-red-400 font-medium">Você</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[9px] text-green-400 font-medium">Ideal</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 space-y-2">
          {/* Progress bar */}
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={e => { stopPlayback(); setProgress(Number(e.target.value)); }}
            className="w-full h-1 opacity-0 absolute"
          />

          <div className="flex items-center justify-center gap-4">
            <button onClick={reset} className="p-2 rounded-full bg-muted hover:bg-secondary transition-colors">
              <SkipBack className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={playing ? stopPlayback : startPlayback}
              className="p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors"
            >
              {playing ? <Pause className="w-5 h-5 text-primary-foreground" /> : <Play className="w-5 h-5 text-primary-foreground" />}
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Arraste a timeline ou pressione play para comparar
          </p>
        </div>
      </div>

      {/* Deviation analysis */}
      <div className="bg-card rounded-xl border border-border p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Análise de Desvio</p>
        {[
          { label: 'Inclinação do tronco', userVal: '12°', idealVal: '8°', diff: 4, status: 'warn' },
          { label: 'Profundidade', userVal: '95%', idealVal: '100%', diff: 5, status: 'ok' },
          { label: 'Alinhamento joelhos', userVal: '3°', idealVal: '0°', diff: 3, status: 'ok' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-foreground">{item.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-red-400">{item.userVal}</span>
              <span className="text-[10px] text-muted-foreground">vs</span>
              <span className="text-[10px] text-green-400">{item.idealVal}</span>
              <div className={cn(
                "w-2 h-2 rounded-full",
                item.status === 'ok' ? 'bg-green-400' : 'bg-yellow-400'
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
