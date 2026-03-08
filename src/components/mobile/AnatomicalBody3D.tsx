import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// All muscle groups mapped to highlight states
const ALL_MUSCLES = [
  'Peitoral Maior', 'Peitoral Menor',
  'Deltóide Anterior', 'Deltóide Lateral', 'Deltóide Posterior', 'Deltóides',
  'Bíceps Braquial', 'Braquial', 'Braquiorradial',
  'Tríceps',
  'Trapézio', 'Trapézio Superior',
  'Dorsais', 'Rombóides', 'Eretores',
  'Core', 'Oblíquos', 'Reto Abdominal',
  'Quadríceps', 'Reto Femoral', 'Vasto Lateral', 'Vasto Medial',
  'Isquiotibiais', 'Posteriores de Coxa',
  'Glúteos', 'Glúteo Médio',
  'Panturrilha', 'Sóleo', 'Gastrocnêmio',
  'Antebraços',
] as const;

function getMuscleState(muscle: string, primary: string[], secondary: string[]): 'primary' | 'secondary' | 'inactive' {
  if (primary.some(p => muscle.includes(p) || p.includes(muscle))) return 'primary';
  if (secondary.some(s => muscle.includes(s) || s.includes(muscle))) return 'secondary';
  return 'inactive';
}

function MuscleMaterial({ state, pulse }: { state: 'primary' | 'secondary' | 'inactive'; pulse: number }) {
  const colors = {
    primary: '#ef4444',
    secondary: '#f97316',
    inactive: '#64748b',
  };
  const emissiveIntensity = state === 'primary' ? 0.35 + Math.sin(pulse * 2) * 0.15 : state === 'secondary' ? 0.15 : 0;
  const opacity = state === 'primary' ? 0.92 : state === 'secondary' ? 0.75 : 0.25;

  return (
    <meshPhysicalMaterial
      color={colors[state]}
      transparent
      opacity={opacity}
      emissive={colors[state]}
      emissiveIntensity={emissiveIntensity}
      roughness={state === 'inactive' ? 0.8 : 0.4}
      metalness={state === 'inactive' ? 0 : 0.15}
      clearcoat={state !== 'inactive' ? 0.3 : 0}
      clearcoatRoughness={0.4}
    />
  );
}

// Smooth capsule-like shape for muscles using lathe geometry
function MusclePart({ position, rotation, scale, state, pulse }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  state: 'primary' | 'secondary' | 'inactive';
  pulse: number;
}) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]} scale={scale || [1, 1, 1]}>
      <capsuleGeometry args={[1, 1, 12, 24]} />
      <MuscleMaterial state={state} pulse={pulse} />
    </mesh>
  );
}

interface AnatomicalBodyProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  animationPhase: number;
}

export function AnatomicalBody({ primaryMuscles, secondaryMuscles, animationPhase }: AnatomicalBodyProps) {
  const groupRef = useRef<THREE.Group>(null);

  const ms = (name: string) => getMuscleState(name, primaryMuscles, secondaryMuscles);
  const pulse = animationPhase;
  const breathe = Math.sin(pulse * 0.5) * 0.015;

  // Exercise-specific subtle animations
  const hasChest = primaryMuscles.some(m => m.includes('Peitoral'));
  const hasLegs = primaryMuscles.some(m => m.includes('Quadríceps') || m.includes('Glúteos') || m.includes('Isquiotibiais') || m.includes('Posteriores'));
  const hasArms = primaryMuscles.some(m => m.includes('Bíceps'));

  const armAnim = hasChest ? Math.sin(pulse * 0.8) * 0.08 : hasArms ? Math.sin(pulse * 1.2) * 0.15 : 0;
  const legAnim = hasLegs ? Math.sin(pulse * 0.6) * 0.1 : 0;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = breathe - legAnim * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ========== HEAD ========== */}
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.3} roughness={0.5} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 1.55, 0.04]} scale={[0.18, 0.1, 0.14]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.25} roughness={0.5} />
      </mesh>

      {/* ========== NECK ========== */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 12]} />
        <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.28} roughness={0.6} />
      </mesh>
      {/* Sternocleidomastoid L */}
      <mesh position={[-0.07, 1.4, 0.03]} rotation={[0.1, 0, 0.15]} scale={[0.04, 0.12, 0.035]}>
        <capsuleGeometry args={[1, 1, 8, 12]} />
        <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.3} roughness={0.5} />
      </mesh>
      {/* Sternocleidomastoid R */}
      <mesh position={[0.07, 1.4, 0.03]} rotation={[0.1, 0, -0.15]} scale={[0.04, 0.12, 0.035]}>
        <capsuleGeometry args={[1, 1, 8, 12]} />
        <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.3} roughness={0.5} />
      </mesh>

      {/* ========== TRAPEZIUS ========== */}
      {/* Upper traps */}
      <MusclePart position={[-0.2, 1.32, -0.06]} rotation={[0, 0, 0.5]} scale={[0.08, 0.14, 0.06]} state={ms('Trapézio')} pulse={pulse} />
      <MusclePart position={[0.2, 1.32, -0.06]} rotation={[0, 0, -0.5]} scale={[0.08, 0.14, 0.06]} state={ms('Trapézio')} pulse={pulse} />
      {/* Mid traps */}
      <MusclePart position={[-0.12, 1.05, -0.2]} rotation={[0.2, 0, 0.3]} scale={[0.1, 0.18, 0.04]} state={ms('Trapézio')} pulse={pulse} />
      <MusclePart position={[0.12, 1.05, -0.2]} rotation={[0.2, 0, -0.3]} scale={[0.1, 0.18, 0.04]} state={ms('Trapézio')} pulse={pulse} />

      {/* ========== SHOULDERS / DELTOIDS ========== */}
      {/* Anterior deltoid L */}
      <MusclePart position={[-0.52, 1.2, 0.08]} rotation={[0.2, 0, 0.3]} scale={[0.09, 0.13, 0.07]} state={ms('Deltóide Anterior')} pulse={pulse} />
      <MusclePart position={[0.52, 1.2, 0.08]} rotation={[0.2, 0, -0.3]} scale={[0.09, 0.13, 0.07]} state={ms('Deltóide Anterior')} pulse={pulse} />
      {/* Lateral deltoid */}
      <MusclePart position={[-0.58, 1.2, 0]} rotation={[0, 0, 0.6]} scale={[0.1, 0.14, 0.08]} state={ms('Deltóides')} pulse={pulse} />
      <MusclePart position={[0.58, 1.2, 0]} rotation={[0, 0, -0.6]} scale={[0.1, 0.14, 0.08]} state={ms('Deltóides')} pulse={pulse} />
      {/* Posterior deltoid */}
      <MusclePart position={[-0.5, 1.18, -0.1]} rotation={[-0.2, 0, 0.4]} scale={[0.08, 0.12, 0.06]} state={ms('Deltóide Posterior')} pulse={pulse} />
      <MusclePart position={[0.5, 1.18, -0.1]} rotation={[-0.2, 0, -0.4]} scale={[0.08, 0.12, 0.06]} state={ms('Deltóide Posterior')} pulse={pulse} />

      {/* ========== PECTORALS ========== */}
      {/* Pec major L */}
      <MusclePart position={[-0.2, 0.95, 0.2]} rotation={[0.3, 0.2, 0.25]} scale={[0.2, 0.14, 0.07]} state={ms('Peitoral Maior')} pulse={pulse} />
      <MusclePart position={[0.2, 0.95, 0.2]} rotation={[0.3, -0.2, -0.25]} scale={[0.2, 0.14, 0.07]} state={ms('Peitoral Maior')} pulse={pulse} />
      {/* Pec lower fibers */}
      <MusclePart position={[-0.18, 0.82, 0.18]} rotation={[0.4, 0.15, 0.35]} scale={[0.16, 0.08, 0.055]} state={ms('Peitoral Maior')} pulse={pulse} />
      <MusclePart position={[0.18, 0.82, 0.18]} rotation={[0.4, -0.15, -0.35]} scale={[0.16, 0.08, 0.055]} state={ms('Peitoral Maior')} pulse={pulse} />

      {/* ========== RIBCAGE / TORSO BASE ========== */}
      <mesh position={[0, 0.85, 0]} scale={[0.42, 0.5, 0.24]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshPhysicalMaterial color="#475569" transparent opacity={0.12} roughness={0.7} />
      </mesh>

      {/* Serratus anterior */}
      <MusclePart position={[-0.38, 0.72, 0.06]} rotation={[0, 0, 0.1]} scale={[0.05, 0.2, 0.08]} state={ms('Core')} pulse={pulse} />
      <MusclePart position={[0.38, 0.72, 0.06]} rotation={[0, 0, -0.1]} scale={[0.05, 0.2, 0.08]} state={ms('Core')} pulse={pulse} />

      {/* ========== ABS ========== */}
      {/* Rectus abdominis - 6 pack segments */}
      {[-0.08, 0.08].map(x => (
        [0.62, 0.48, 0.34].map((y, i) => (
          <MusclePart key={`abs-${x}-${i}`} position={[x, y, 0.2]} scale={[0.065, 0.055, 0.04]} state={ms('Core')} pulse={pulse} />
        ))
      ))}
      {/* Obliques */}
      <MusclePart position={[-0.28, 0.5, 0.12]} rotation={[0, 0, 0.25]} scale={[0.08, 0.18, 0.05]} state={ms('Core')} pulse={pulse} />
      <MusclePart position={[0.28, 0.5, 0.12]} rotation={[0, 0, -0.25]} scale={[0.08, 0.18, 0.05]} state={ms('Core')} pulse={pulse} />

      {/* ========== LATS / BACK ========== */}
      <MusclePart position={[-0.28, 0.78, -0.16]} rotation={[0.1, 0.2, 0.2]} scale={[0.18, 0.25, 0.06]} state={ms('Dorsais')} pulse={pulse} />
      <MusclePart position={[0.28, 0.78, -0.16]} rotation={[0.1, -0.2, -0.2]} scale={[0.18, 0.25, 0.06]} state={ms('Dorsais')} pulse={pulse} />

      {/* Rhomboids */}
      <MusclePart position={[-0.1, 1.0, -0.2]} scale={[0.08, 0.14, 0.04]} state={ms('Rombóides')} pulse={pulse} />
      <MusclePart position={[0.1, 1.0, -0.2]} scale={[0.08, 0.14, 0.04]} state={ms('Rombóides')} pulse={pulse} />

      {/* Erector spinae */}
      <MusclePart position={[-0.08, 0.55, -0.2]} scale={[0.05, 0.35, 0.04]} state={ms('Eretores')} pulse={pulse} />
      <MusclePart position={[0.08, 0.55, -0.2]} scale={[0.05, 0.35, 0.04]} state={ms('Eretores')} pulse={pulse} />

      {/* ========== ARMS ========== */}
      {/* Left arm group */}
      <group position={[-0.55, 0.7 + armAnim, 0]}>
        {/* Biceps */}
        <MusclePart position={[-0.06, 0.18, 0.04]} rotation={[0.1, 0, 0]} scale={[0.065, 0.14, 0.06]} state={ms('Bíceps Braquial')} pulse={pulse} />
        {/* Brachialis */}
        <MusclePart position={[-0.06, 0.14, -0.02]} scale={[0.055, 0.1, 0.05]} state={ms('Braquial')} pulse={pulse} />
        {/* Triceps long head */}
        <MusclePart position={[-0.06, 0.2, -0.06]} scale={[0.06, 0.15, 0.055]} state={ms('Tríceps')} pulse={pulse} />
        {/* Triceps lateral head */}
        <MusclePart position={[-0.09, 0.17, -0.04]} scale={[0.04, 0.1, 0.045]} state={ms('Tríceps')} pulse={pulse} />
        {/* Forearm */}
        <MusclePart position={[-0.06, -0.1, 0.01]} scale={[0.05, 0.16, 0.045]} state={ms('Antebraços')} pulse={pulse} />
        <MusclePart position={[-0.06, -0.12, -0.02]} scale={[0.04, 0.14, 0.04]} state={ms('Braquiorradial')} pulse={pulse} />
        {/* Hand */}
        <mesh position={[-0.06, -0.32, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.2} roughness={0.6} />
        </mesh>
      </group>

      {/* Right arm group */}
      <group position={[0.55, 0.7 + armAnim, 0]}>
        <MusclePart position={[0.06, 0.18, 0.04]} rotation={[0.1, 0, 0]} scale={[0.065, 0.14, 0.06]} state={ms('Bíceps Braquial')} pulse={pulse} />
        <MusclePart position={[0.06, 0.14, -0.02]} scale={[0.055, 0.1, 0.05]} state={ms('Braquial')} pulse={pulse} />
        <MusclePart position={[0.06, 0.2, -0.06]} scale={[0.06, 0.15, 0.055]} state={ms('Tríceps')} pulse={pulse} />
        <MusclePart position={[0.09, 0.17, -0.04]} scale={[0.04, 0.1, 0.045]} state={ms('Tríceps')} pulse={pulse} />
        <MusclePart position={[0.06, -0.1, 0.01]} scale={[0.05, 0.16, 0.045]} state={ms('Antebraços')} pulse={pulse} />
        <MusclePart position={[0.06, -0.12, -0.02]} scale={[0.04, 0.14, 0.04]} state={ms('Braquiorradial')} pulse={pulse} />
        <mesh position={[0.06, -0.32, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.2} roughness={0.6} />
        </mesh>
      </group>

      {/* ========== HIP / PELVIS ========== */}
      <mesh position={[0, 0.18, 0]} scale={[0.38, 0.12, 0.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial color="#475569" transparent opacity={0.15} roughness={0.7} />
      </mesh>

      {/* ========== GLUTES ========== */}
      <MusclePart position={[-0.15, 0.08, -0.14]} scale={[0.14, 0.12, 0.1]} state={ms('Glúteos')} pulse={pulse} />
      <MusclePart position={[0.15, 0.08, -0.14]} scale={[0.14, 0.12, 0.1]} state={ms('Glúteos')} pulse={pulse} />
      {/* Gluteus medius */}
      <MusclePart position={[-0.24, 0.14, -0.1]} scale={[0.09, 0.08, 0.07]} state={ms('Glúteos')} pulse={pulse} />
      <MusclePart position={[0.24, 0.14, -0.1]} scale={[0.09, 0.08, 0.07]} state={ms('Glúteos')} pulse={pulse} />

      {/* Hip flexors */}
      <MusclePart position={[-0.14, 0.18, 0.12]} rotation={[0.3, 0, 0.1]} scale={[0.06, 0.1, 0.04]} state={ms('Core')} pulse={pulse} />
      <MusclePart position={[0.14, 0.18, 0.12]} rotation={[0.3, 0, -0.1]} scale={[0.06, 0.1, 0.04]} state={ms('Core')} pulse={pulse} />

      {/* ========== LEFT LEG ========== */}
      <group position={[-0.18, -0.55 - legAnim, 0]}>
        {/* Rectus femoris */}
        <MusclePart position={[0, 0.2, 0.08]} scale={[0.08, 0.22, 0.065]} state={ms('Quadríceps')} pulse={pulse} />
        {/* Vastus lateralis */}
        <MusclePart position={[-0.07, 0.15, 0.03]} scale={[0.065, 0.2, 0.06]} state={ms('Quadríceps')} pulse={pulse} />
        {/* Vastus medialis */}
        <MusclePart position={[0.06, 0.08, 0.05]} scale={[0.06, 0.12, 0.055]} state={ms('Quadríceps')} pulse={pulse} />
        {/* Hamstrings */}
        <MusclePart position={[-0.02, 0.18, -0.08]} scale={[0.06, 0.2, 0.055]} state={ms('Isquiotibiais')} pulse={pulse} />
        <MusclePart position={[0.04, 0.18, -0.07]} scale={[0.055, 0.18, 0.05]} state={ms('Isquiotibiais')} pulse={pulse} />
        {/* Adductors */}
        <MusclePart position={[0.06, 0.22, 0]} scale={[0.04, 0.15, 0.06]} state={ms('Core')} pulse={pulse} />
        {/* IT Band */}
        <MusclePart position={[-0.1, 0.12, 0]} scale={[0.025, 0.22, 0.03]} state={ms('Quadríceps')} pulse={pulse} />

        {/* Knee */}
        <mesh position={[0, -0.12, 0.03]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial color="#64748b" transparent opacity={0.15} roughness={0.6} />
        </mesh>

        {/* Calf - gastrocnemius */}
        <MusclePart position={[-0.02, -0.32, -0.04]} scale={[0.065, 0.16, 0.06]} state={ms('Panturrilha')} pulse={pulse} />
        {/* Calf - soleus */}
        <MusclePart position={[0, -0.4, -0.02]} scale={[0.05, 0.12, 0.045]} state={ms('Panturrilha')} pulse={pulse} />
        {/* Tibialis anterior */}
        <MusclePart position={[0.02, -0.34, 0.04]} scale={[0.035, 0.14, 0.035]} state={ms('Panturrilha')} pulse={pulse} />

        {/* Foot */}
        <mesh position={[0, -0.58, 0.04]} scale={[0.06, 0.025, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.2} roughness={0.6} />
        </mesh>
      </group>

      {/* ========== RIGHT LEG ========== */}
      <group position={[0.18, -0.55 - legAnim, 0]}>
        <MusclePart position={[0, 0.2, 0.08]} scale={[0.08, 0.22, 0.065]} state={ms('Quadríceps')} pulse={pulse} />
        <MusclePart position={[0.07, 0.15, 0.03]} scale={[0.065, 0.2, 0.06]} state={ms('Quadríceps')} pulse={pulse} />
        <MusclePart position={[-0.06, 0.08, 0.05]} scale={[0.06, 0.12, 0.055]} state={ms('Quadríceps')} pulse={pulse} />
        <MusclePart position={[0.02, 0.18, -0.08]} scale={[0.06, 0.2, 0.055]} state={ms('Isquiotibiais')} pulse={pulse} />
        <MusclePart position={[-0.04, 0.18, -0.07]} scale={[0.055, 0.18, 0.05]} state={ms('Isquiotibiais')} pulse={pulse} />
        <MusclePart position={[-0.06, 0.22, 0]} scale={[0.04, 0.15, 0.06]} state={ms('Core')} pulse={pulse} />
        <MusclePart position={[0.1, 0.12, 0]} scale={[0.025, 0.22, 0.03]} state={ms('Quadríceps')} pulse={pulse} />

        <mesh position={[0, -0.12, 0.03]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial color="#64748b" transparent opacity={0.15} roughness={0.6} />
        </mesh>

        <MusclePart position={[0.02, -0.32, -0.04]} scale={[0.065, 0.16, 0.06]} state={ms('Panturrilha')} pulse={pulse} />
        <MusclePart position={[0, -0.4, -0.02]} scale={[0.05, 0.12, 0.045]} state={ms('Panturrilha')} pulse={pulse} />
        <MusclePart position={[-0.02, -0.34, 0.04]} scale={[0.035, 0.14, 0.035]} state={ms('Panturrilha')} pulse={pulse} />

        <mesh position={[0, -0.58, 0.04]} scale={[0.06, 0.025, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#94a3b8" transparent opacity={0.2} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
