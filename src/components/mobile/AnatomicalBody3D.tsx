import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Helpers ────────────────────────────────────────────────

function getMuscleState(muscle: string, primary: string[], secondary: string[]): 'primary' | 'secondary' | 'inactive' {
  if (primary.some(p => muscle.includes(p) || p.includes(muscle))) return 'primary';
  if (secondary.some(s => muscle.includes(s) || s.includes(muscle))) return 'secondary';
  return 'inactive';
}

// ─── Materials ──────────────────────────────────────────────

/** Realistic muscle red/brown material with highlight states */
function MuscleMat({ state, pulse }: { state: 'primary' | 'secondary' | 'inactive'; pulse: number }) {
  const baseColors = {
    primary: '#ff2020',
    secondary: '#ff6030',
    inactive: '#b85450',
  };
  const emissiveColors = {
    primary: '#ff0000',
    secondary: '#ff4400',
    inactive: '#3a1510',
  };
  const emissiveIntensity =
    state === 'primary' ? 0.5 + Math.sin(pulse * 2.5) * 0.25
    : state === 'secondary' ? 0.2
    : 0.04;
  const opacity = state === 'primary' ? 1 : state === 'secondary' ? 0.92 : 0.82;

  return (
    <meshPhysicalMaterial
      color={baseColors[state]}
      emissive={emissiveColors[state]}
      emissiveIntensity={emissiveIntensity}
      transparent
      opacity={opacity}
      roughness={state === 'inactive' ? 0.65 : 0.35}
      metalness={0.05}
      clearcoat={state !== 'inactive' ? 0.15 : 0}
      clearcoatRoughness={0.5}
    />
  );
}

/** Tendon / connective tissue */
function TendonMat() {
  return (
    <meshPhysicalMaterial
      color="#e8d5c4"
      roughness={0.7}
      metalness={0}
      transparent
      opacity={0.85}
    />
  );
}

/** Skin-like translucent material for head */
function SkinMat({ opacity = 0.7 }: { opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color="#c4897a"
      roughness={0.55}
      metalness={0}
      transparent
      opacity={opacity}
    />
  );
}

// ─── Muscle Part ────────────────────────────────────────────

function M({ p, r, s, st, pulse }: {
  p: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
  st: 'primary' | 'secondary' | 'inactive';
  pulse: number;
}) {
  return (
    <mesh position={p} rotation={r || [0, 0, 0]} scale={s || [1, 1, 1]}>
      <capsuleGeometry args={[1, 1.2, 8, 16]} />
      <MuscleMat state={st} pulse={pulse} />
    </mesh>
  );
}

/** Tendon connector */
function T({ p, r, s }: {
  p: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
}) {
  return (
    <mesh position={p} rotation={r || [0, 0, 0]} scale={s || [1, 1, 1]}>
      <capsuleGeometry args={[1, 2, 6, 8]} />
      <TendonMat />
    </mesh>
  );
}

// ─── Anatomical Body ────────────────────────────────────────

interface AnatomicalBodyProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  animationPhase: number;
}

export function AnatomicalBody({ primaryMuscles, secondaryMuscles, animationPhase }: AnatomicalBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ms = (name: string) => getMuscleState(name, primaryMuscles, secondaryMuscles);
  const pulse = animationPhase;
  const breathe = Math.sin(pulse * 0.5) * 0.012;

  const hasChest = primaryMuscles.some(m => m.includes('Peitoral'));
  const hasLegs = primaryMuscles.some(m => m.includes('Quadríceps') || m.includes('Glúteos') || m.includes('Isquiotibiais') || m.includes('Posteriores'));
  const hasArms = primaryMuscles.some(m => m.includes('Bíceps'));
  const armAnim = hasChest ? Math.sin(pulse * 0.8) * 0.06 : hasArms ? Math.sin(pulse * 1.2) * 0.12 : 0;
  const legAnim = hasLegs ? Math.sin(pulse * 0.6) * 0.08 : 0;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = breathe - legAnim * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ═══════════════ HEAD ═══════════════ */}
      {/* Skull */}
      <mesh position={[0, 1.78, 0]} scale={[0.19, 0.22, 0.2]}>
        <sphereGeometry args={[1, 20, 20]} />
        <SkinMat opacity={0.55} />
      </mesh>
      {/* Face muscles - frontalis */}
      <M p={[0, 1.88, 0.08]} s={[0.16, 0.06, 0.03]} st={ms('Core')} pulse={pulse} />
      {/* Temporalis L/R */}
      <M p={[-0.15, 1.82, 0.04]} s={[0.05, 0.06, 0.04]} st={ms('Core')} pulse={pulse} />
      <M p={[0.15, 1.82, 0.04]} s={[0.05, 0.06, 0.04]} st={ms('Core')} pulse={pulse} />
      {/* Masseter L/R */}
      <M p={[-0.12, 1.7, 0.1]} s={[0.04, 0.05, 0.03]} st={ms('Core')} pulse={pulse} />
      <M p={[0.12, 1.7, 0.1]} s={[0.04, 0.05, 0.03]} st={ms('Core')} pulse={pulse} />
      {/* Jaw */}
      <mesh position={[0, 1.62, 0.06]} scale={[0.14, 0.06, 0.11]}>
        <sphereGeometry args={[1, 14, 14]} />
        <SkinMat opacity={0.5} />
      </mesh>

      {/* ═══════════════ NECK ═══════════════ */}
      {/* Sternocleidomastoid L/R */}
      <M p={[-0.08, 1.48, 0.05]} r={[0.15, 0, 0.2]} s={[0.045, 0.14, 0.035]} st={ms('Core')} pulse={pulse} />
      <M p={[0.08, 1.48, 0.05]} r={[0.15, 0, -0.2]} s={[0.045, 0.14, 0.035]} st={ms('Core')} pulse={pulse} />
      {/* Neck cylinder */}
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.22, 14]} />
        <SkinMat opacity={0.35} />
      </mesh>
      {/* Neck tendon center */}
      <T p={[0, 1.48, 0.08]} s={[0.015, 0.08, 0.01]} />

      {/* ═══════════════ TRAPEZIUS ═══════════════ */}
      {/* Upper trapezius */}
      <M p={[-0.18, 1.38, -0.06]} r={[0.1, 0, 0.6]} s={[0.1, 0.16, 0.055]} st={ms('Trapézio')} pulse={pulse} />
      <M p={[0.18, 1.38, -0.06]} r={[0.1, 0, -0.6]} s={[0.1, 0.16, 0.055]} st={ms('Trapézio')} pulse={pulse} />
      {/* Mid trapezius */}
      <M p={[-0.14, 1.08, -0.22]} r={[0.15, 0, 0.25]} s={[0.12, 0.2, 0.04]} st={ms('Trapézio')} pulse={pulse} />
      <M p={[0.14, 1.08, -0.22]} r={[0.15, 0, -0.25]} s={[0.12, 0.2, 0.04]} st={ms('Trapézio')} pulse={pulse} />
      {/* Lower trapezius */}
      <M p={[-0.08, 0.85, -0.22]} r={[0, 0, 0.15]} s={[0.08, 0.12, 0.035]} st={ms('Trapézio')} pulse={pulse} />
      <M p={[0.08, 0.85, -0.22]} r={[0, 0, -0.15]} s={[0.08, 0.12, 0.035]} st={ms('Trapézio')} pulse={pulse} />

      {/* ═══════════════ SHOULDERS / DELTOIDS ═══════════════ */}
      {/* Anterior deltoid */}
      <M p={[-0.48, 1.22, 0.1]} r={[0.25, 0.1, 0.35]} s={[0.1, 0.14, 0.075]} st={ms('Deltóide Anterior')} pulse={pulse} />
      <M p={[0.48, 1.22, 0.1]} r={[0.25, -0.1, -0.35]} s={[0.1, 0.14, 0.075]} st={ms('Deltóide Anterior')} pulse={pulse} />
      {/* Lateral deltoid - the cap of the shoulder */}
      <M p={[-0.54, 1.24, 0]} r={[0, 0, 0.65]} s={[0.11, 0.16, 0.09]} st={ms('Deltóides')} pulse={pulse} />
      <M p={[0.54, 1.24, 0]} r={[0, 0, -0.65]} s={[0.11, 0.16, 0.09]} st={ms('Deltóides')} pulse={pulse} />
      {/* Posterior deltoid */}
      <M p={[-0.48, 1.2, -0.1]} r={[-0.2, 0, 0.4]} s={[0.09, 0.13, 0.065]} st={ms('Deltóide Posterior')} pulse={pulse} />
      <M p={[0.48, 1.2, -0.1]} r={[-0.2, 0, -0.4]} s={[0.09, 0.13, 0.065]} st={ms('Deltóide Posterior')} pulse={pulse} />
      {/* Shoulder tendon (acromion area) */}
      <T p={[-0.42, 1.32, 0]} r={[0, 0, 0.5]} s={[0.025, 0.06, 0.03]} />
      <T p={[0.42, 1.32, 0]} r={[0, 0, -0.5]} s={[0.025, 0.06, 0.03]} />

      {/* ═══════════════ PECTORALS ═══════════════ */}
      {/* Pec major upper fibers */}
      <M p={[-0.18, 1.05, 0.22]} r={[0.35, 0.2, 0.2]} s={[0.18, 0.1, 0.065]} st={ms('Peitoral Maior')} pulse={pulse} />
      <M p={[0.18, 1.05, 0.22]} r={[0.35, -0.2, -0.2]} s={[0.18, 0.1, 0.065]} st={ms('Peitoral Maior')} pulse={pulse} />
      {/* Pec major mid fibers */}
      <M p={[-0.22, 0.95, 0.22]} r={[0.3, 0.15, 0.25]} s={[0.2, 0.12, 0.07]} st={ms('Peitoral Maior')} pulse={pulse} />
      <M p={[0.22, 0.95, 0.22]} r={[0.3, -0.15, -0.25]} s={[0.2, 0.12, 0.07]} st={ms('Peitoral Maior')} pulse={pulse} />
      {/* Pec major lower fibers */}
      <M p={[-0.2, 0.82, 0.2]} r={[0.4, 0.1, 0.35]} s={[0.17, 0.08, 0.055]} st={ms('Peitoral Maior')} pulse={pulse} />
      <M p={[0.2, 0.82, 0.2]} r={[0.4, -0.1, -0.35]} s={[0.17, 0.08, 0.055]} st={ms('Peitoral Maior')} pulse={pulse} />
      {/* Pec minor (deeper) */}
      <M p={[-0.15, 0.98, 0.15]} r={[0.2, 0.15, 0.3]} s={[0.1, 0.08, 0.04]} st={ms('Peitoral Menor')} pulse={pulse} />
      <M p={[0.15, 0.98, 0.15]} r={[0.2, -0.15, -0.3]} s={[0.1, 0.08, 0.04]} st={ms('Peitoral Menor')} pulse={pulse} />
      {/* Sternum tendon line */}
      <T p={[0, 0.95, 0.24]} s={[0.015, 0.18, 0.012]} />
      {/* Nipple area tendons */}
      <T p={[-0.18, 0.92, 0.24]} s={[0.012, 0.012, 0.012]} />
      <T p={[0.18, 0.92, 0.24]} s={[0.012, 0.012, 0.012]} />

      {/* ═══════════════ RIBCAGE (Base structure) ═══════════════ */}
      <mesh position={[0, 0.88, 0]} scale={[0.4, 0.48, 0.23]}>
        <sphereGeometry args={[1, 18, 18]} />
        <meshPhysicalMaterial color="#8b5e56" transparent opacity={0.12} roughness={0.7} />
      </mesh>

      {/* ═══════════════ SERRATUS ANTERIOR ═══════════════ */}
      {[-0.36, 0.36].map((x, xi) => (
        [0.78, 0.72, 0.66].map((y, i) => (
          <M key={`ser-${xi}-${i}`} p={[x, y, 0.08]} r={[0, 0, x < 0 ? 0.1 : -0.1]} s={[0.04, 0.04, 0.06]} st={ms('Core')} pulse={pulse} />
        ))
      ))}

      {/* ═══════════════ ABS / RECTUS ABDOMINIS ═══════════════ */}
      {/* 8-pack: 4 rows x 2 columns */}
      {[-0.065, 0.065].map(x => (
        [0.65, 0.55, 0.45, 0.35].map((y, i) => (
          <M key={`abs-${x}-${i}`} p={[x, y, 0.22]} s={[0.055, 0.04, 0.035]} st={ms('Core')} pulse={pulse} />
        ))
      ))}
      {/* Linea alba (center tendon line) */}
      <T p={[0, 0.5, 0.23]} s={[0.01, 0.22, 0.008]} />
      {/* Tendinous inscriptions (horizontal lines between abs) */}
      {[0.6, 0.5, 0.4].map((y, i) => (
        <T key={`tl-${i}`} p={[0, y, 0.23]} r={[0, 0, Math.PI / 2]} s={[0.008, 0.05, 0.006]} />
      ))}

      {/* ═══════════════ OBLIQUES ═══════════════ */}
      <M p={[-0.26, 0.58, 0.14]} r={[0.1, 0, 0.3]} s={[0.08, 0.14, 0.05]} st={ms('Core')} pulse={pulse} />
      <M p={[0.26, 0.58, 0.14]} r={[0.1, 0, -0.3]} s={[0.08, 0.14, 0.05]} st={ms('Core')} pulse={pulse} />
      <M p={[-0.3, 0.48, 0.1]} r={[0, 0, 0.35]} s={[0.065, 0.12, 0.045]} st={ms('Core')} pulse={pulse} />
      <M p={[0.3, 0.48, 0.1]} r={[0, 0, -0.35]} s={[0.065, 0.12, 0.045]} st={ms('Core')} pulse={pulse} />

      {/* ═══════════════ LATS ═══════════════ */}
      <M p={[-0.3, 0.82, -0.14]} r={[0.1, 0.15, 0.2]} s={[0.2, 0.26, 0.06]} st={ms('Dorsais')} pulse={pulse} />
      <M p={[0.3, 0.82, -0.14]} r={[0.1, -0.15, -0.2]} s={[0.2, 0.26, 0.06]} st={ms('Dorsais')} pulse={pulse} />
      {/* Lower lats */}
      <M p={[-0.22, 0.6, -0.12]} r={[0, 0.1, 0.25]} s={[0.12, 0.14, 0.045]} st={ms('Dorsais')} pulse={pulse} />
      <M p={[0.22, 0.6, -0.12]} r={[0, -0.1, -0.25]} s={[0.12, 0.14, 0.045]} st={ms('Dorsais')} pulse={pulse} />

      {/* ═══════════════ RHOMBOIDS ═══════════════ */}
      <M p={[-0.1, 1.02, -0.2]} s={[0.08, 0.14, 0.04]} st={ms('Rombóides')} pulse={pulse} />
      <M p={[0.1, 1.02, -0.2]} s={[0.08, 0.14, 0.04]} st={ms('Rombóides')} pulse={pulse} />

      {/* ═══════════════ ERECTOR SPINAE ═══════════════ */}
      <M p={[-0.07, 0.6, -0.2]} s={[0.045, 0.35, 0.04]} st={ms('Eretores')} pulse={pulse} />
      <M p={[0.07, 0.6, -0.2]} s={[0.045, 0.35, 0.04]} st={ms('Eretores')} pulse={pulse} />
      {/* Spinal tendon */}
      <T p={[0, 0.7, -0.22]} s={[0.012, 0.35, 0.01]} />

      {/* ═══════════════ LEFT ARM ═══════════════ */}
      <group position={[-0.52, 0.72 + armAnim, 0]}>
        {/* Biceps long head */}
        <M p={[-0.07, 0.18, 0.05]} r={[0.1, 0, 0]} s={[0.06, 0.15, 0.055]} st={ms('Bíceps Braquial')} pulse={pulse} />
        {/* Biceps short head */}
        <M p={[-0.03, 0.16, 0.05]} r={[0.05, 0, -0.1]} s={[0.05, 0.13, 0.045]} st={ms('Bíceps Braquial')} pulse={pulse} />
        {/* Brachialis */}
        <M p={[-0.06, 0.1, 0]} s={[0.055, 0.1, 0.05]} st={ms('Braquial')} pulse={pulse} />
        {/* Triceps long head */}
        <M p={[-0.06, 0.22, -0.06]} s={[0.055, 0.16, 0.05]} st={ms('Tríceps')} pulse={pulse} />
        {/* Triceps lateral head */}
        <M p={[-0.1, 0.18, -0.04]} s={[0.04, 0.12, 0.045]} st={ms('Tríceps')} pulse={pulse} />
        {/* Triceps medial head */}
        <M p={[-0.06, 0.12, -0.05]} s={[0.035, 0.08, 0.035]} st={ms('Tríceps')} pulse={pulse} />
        {/* Bicep tendon upper */}
        <T p={[-0.05, 0.32, 0.04]} s={[0.015, 0.04, 0.012]} />
        {/* Tricep tendon (elbow) */}
        <T p={[-0.06, 0.02, -0.04]} s={[0.018, 0.04, 0.015]} />

        {/* Forearm extensors */}
        <M p={[-0.08, -0.06, -0.02]} s={[0.045, 0.16, 0.04]} st={ms('Antebraços')} pulse={pulse} />
        {/* Forearm flexors */}
        <M p={[-0.04, -0.06, 0.02]} s={[0.04, 0.16, 0.038]} st={ms('Antebraços')} pulse={pulse} />
        {/* Brachioradialis */}
        <M p={[-0.09, -0.02, 0.02]} r={[0, 0, 0.1]} s={[0.035, 0.14, 0.035]} st={ms('Braquiorradial')} pulse={pulse} />
        {/* Pronator teres */}
        <M p={[-0.03, -0.02, 0.01]} r={[0, 0, -0.15]} s={[0.03, 0.08, 0.03]} st={ms('Antebraços')} pulse={pulse} />
        {/* Wrist tendon area */}
        <T p={[-0.06, -0.24, 0]} s={[0.03, 0.03, 0.025]} />
        {/* Hand */}
        <mesh position={[-0.06, -0.33, 0]} scale={[0.045, 0.06, 0.025]}>
          <sphereGeometry args={[1, 10, 10]} />
          <SkinMat opacity={0.5} />
        </mesh>
        {/* Fingers */}
        {[-0.08, -0.065, -0.05, -0.035].map((fx, i) => (
          <mesh key={`lf-${i}`} position={[fx, -0.4, 0]} scale={[0.01, 0.04, 0.01]}>
            <capsuleGeometry args={[1, 1.5, 4, 6]} />
            <SkinMat opacity={0.45} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════ RIGHT ARM ═══════════════ */}
      <group position={[0.52, 0.72 + armAnim, 0]}>
        <M p={[0.07, 0.18, 0.05]} r={[0.1, 0, 0]} s={[0.06, 0.15, 0.055]} st={ms('Bíceps Braquial')} pulse={pulse} />
        <M p={[0.03, 0.16, 0.05]} r={[0.05, 0, 0.1]} s={[0.05, 0.13, 0.045]} st={ms('Bíceps Braquial')} pulse={pulse} />
        <M p={[0.06, 0.1, 0]} s={[0.055, 0.1, 0.05]} st={ms('Braquial')} pulse={pulse} />
        <M p={[0.06, 0.22, -0.06]} s={[0.055, 0.16, 0.05]} st={ms('Tríceps')} pulse={pulse} />
        <M p={[0.1, 0.18, -0.04]} s={[0.04, 0.12, 0.045]} st={ms('Tríceps')} pulse={pulse} />
        <M p={[0.06, 0.12, -0.05]} s={[0.035, 0.08, 0.035]} st={ms('Tríceps')} pulse={pulse} />
        <T p={[0.05, 0.32, 0.04]} s={[0.015, 0.04, 0.012]} />
        <T p={[0.06, 0.02, -0.04]} s={[0.018, 0.04, 0.015]} />
        <M p={[0.08, -0.06, -0.02]} s={[0.045, 0.16, 0.04]} st={ms('Antebraços')} pulse={pulse} />
        <M p={[0.04, -0.06, 0.02]} s={[0.04, 0.16, 0.038]} st={ms('Antebraços')} pulse={pulse} />
        <M p={[0.09, -0.02, 0.02]} r={[0, 0, -0.1]} s={[0.035, 0.14, 0.035]} st={ms('Braquiorradial')} pulse={pulse} />
        <M p={[0.03, -0.02, 0.01]} r={[0, 0, 0.15]} s={[0.03, 0.08, 0.03]} st={ms('Antebraços')} pulse={pulse} />
        <T p={[0.06, -0.24, 0]} s={[0.03, 0.03, 0.025]} />
        <mesh position={[0.06, -0.33, 0]} scale={[0.045, 0.06, 0.025]}>
          <sphereGeometry args={[1, 10, 10]} />
          <SkinMat opacity={0.5} />
        </mesh>
        {[0.035, 0.05, 0.065, 0.08].map((fx, i) => (
          <mesh key={`rf-${i}`} position={[fx, -0.4, 0]} scale={[0.01, 0.04, 0.01]}>
            <capsuleGeometry args={[1, 1.5, 4, 6]} />
            <SkinMat opacity={0.45} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════ HIP / PELVIS ═══════════════ */}
      <mesh position={[0, 0.2, 0]} scale={[0.36, 0.13, 0.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial color="#8b6b60" transparent opacity={0.18} roughness={0.7} />
      </mesh>
      {/* Inguinal ligament tendons */}
      <T p={[-0.18, 0.22, 0.14]} r={[0.3, 0, 0.5]} s={[0.012, 0.1, 0.01]} />
      <T p={[0.18, 0.22, 0.14]} r={[0.3, 0, -0.5]} s={[0.012, 0.1, 0.01]} />
      {/* Navel area */}
      <T p={[0, 0.28, 0.22]} s={[0.008, 0.008, 0.008]} />

      {/* ═══════════════ HIP FLEXORS / ILIACUS ═══════════════ */}
      <M p={[-0.14, 0.22, 0.12]} r={[0.35, 0, 0.15]} s={[0.06, 0.1, 0.04]} st={ms('Core')} pulse={pulse} />
      <M p={[0.14, 0.22, 0.12]} r={[0.35, 0, -0.15]} s={[0.06, 0.1, 0.04]} st={ms('Core')} pulse={pulse} />

      {/* ═══════════════ GLUTES ═══════════════ */}
      {/* Gluteus maximus */}
      <M p={[-0.14, 0.06, -0.14]} s={[0.15, 0.13, 0.11]} st={ms('Glúteos')} pulse={pulse} />
      <M p={[0.14, 0.06, -0.14]} s={[0.15, 0.13, 0.11]} st={ms('Glúteos')} pulse={pulse} />
      {/* Gluteus medius */}
      <M p={[-0.24, 0.15, -0.08]} s={[0.09, 0.09, 0.07]} st={ms('Glúteos')} pulse={pulse} />
      <M p={[0.24, 0.15, -0.08]} s={[0.09, 0.09, 0.07]} st={ms('Glúteos')} pulse={pulse} />
      {/* TFL */}
      <M p={[-0.28, 0.12, 0.02]} r={[0, 0, 0.1]} s={[0.04, 0.08, 0.04]} st={ms('Glúteos')} pulse={pulse} />
      <M p={[0.28, 0.12, 0.02]} r={[0, 0, -0.1]} s={[0.04, 0.08, 0.04]} st={ms('Glúteos')} pulse={pulse} />

      {/* ═══════════════ LEFT LEG ═══════════════ */}
      <group position={[-0.17, -0.55 - legAnim, 0]}>
        {/* Rectus femoris */}
        <M p={[0, 0.22, 0.09]} s={[0.075, 0.24, 0.065]} st={ms('Quadríceps')} pulse={pulse} />
        {/* Vastus lateralis */}
        <M p={[-0.08, 0.16, 0.04]} s={[0.065, 0.22, 0.06]} st={ms('Quadríceps')} pulse={pulse} />
        {/* Vastus medialis (teardrop) */}
        <M p={[0.06, 0.04, 0.06]} s={[0.06, 0.12, 0.055]} st={ms('Quadríceps')} pulse={pulse} />
        {/* Vastus intermedius (deep) */}
        <M p={[0, 0.14, 0.04]} s={[0.06, 0.18, 0.05]} st={ms('Quadríceps')} pulse={pulse} />
        {/* Sartorius (diagonal strap) */}
        <M p={[0.03, 0.14, 0.1]} r={[0, 0, -0.2]} s={[0.025, 0.2, 0.02]} st={ms('Quadríceps')} pulse={pulse} />

        {/* Hamstrings - biceps femoris */}
        <M p={[-0.04, 0.18, -0.08]} s={[0.055, 0.22, 0.05]} st={ms('Isquiotibiais')} pulse={pulse} />
        {/* Hamstrings - semitendinosus */}
        <M p={[0.02, 0.18, -0.08]} s={[0.045, 0.2, 0.045]} st={ms('Isquiotibiais')} pulse={pulse} />
        {/* Hamstrings - semimembranosus */}
        <M p={[0.04, 0.16, -0.06]} s={[0.04, 0.18, 0.04]} st={ms('Isquiotibiais')} pulse={pulse} />

        {/* Adductors */}
        <M p={[0.07, 0.24, 0.01]} s={[0.04, 0.16, 0.055]} st={ms('Core')} pulse={pulse} />
        <M p={[0.06, 0.16, -0.01]} s={[0.035, 0.14, 0.045]} st={ms('Core')} pulse={pulse} />

        {/* IT Band (lateral) */}
        <T p={[-0.1, 0.1, 0.01]} s={[0.02, 0.24, 0.015]} />

        {/* Knee tendons */}
        <T p={[0, -0.1, 0.06]} s={[0.04, 0.04, 0.03]} />
        <T p={[-0.03, -0.1, -0.03]} s={[0.025, 0.03, 0.02]} />
        <T p={[0.03, -0.1, -0.03]} s={[0.025, 0.03, 0.02]} />
        {/* Patella */}
        <mesh position={[0, -0.1, 0.07]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <TendonMat />
        </mesh>

        {/* Gastrocnemius medial */}
        <M p={[0.02, -0.28, -0.04]} s={[0.06, 0.15, 0.055]} st={ms('Panturrilha')} pulse={pulse} />
        {/* Gastrocnemius lateral */}
        <M p={[-0.04, -0.28, -0.04]} s={[0.055, 0.14, 0.05]} st={ms('Panturrilha')} pulse={pulse} />
        {/* Soleus */}
        <M p={[0, -0.38, -0.02]} s={[0.05, 0.12, 0.045]} st={ms('Panturrilha')} pulse={pulse} />
        {/* Tibialis anterior */}
        <M p={[0.03, -0.3, 0.04]} s={[0.035, 0.14, 0.035]} st={ms('Panturrilha')} pulse={pulse} />
        {/* Peroneus */}
        <M p={[-0.06, -0.34, 0.01]} s={[0.025, 0.12, 0.025]} st={ms('Panturrilha')} pulse={pulse} />

        {/* Achilles tendon */}
        <T p={[0, -0.5, -0.03]} s={[0.02, 0.06, 0.015]} />

        {/* Ankle tendons */}
        <T p={[0, -0.55, 0.02]} r={[0.3, 0, 0]} s={[0.035, 0.02, 0.025]} />

        {/* Foot */}
        <mesh position={[0, -0.58, 0.04]} scale={[0.06, 0.02, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <SkinMat opacity={0.45} />
        </mesh>
        {/* Toes */}
        {[-0.02, -0.005, 0.01, 0.025, 0.04].map((tx, i) => (
          <mesh key={`lt-${i}`} position={[tx, -0.58, 0.12]} scale={[0.01, 0.012, 0.015]}>
            <sphereGeometry args={[1, 6, 6]} />
            <SkinMat opacity={0.4} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════ RIGHT LEG ═══════════════ */}
      <group position={[0.17, -0.55 - legAnim, 0]}>
        <M p={[0, 0.22, 0.09]} s={[0.075, 0.24, 0.065]} st={ms('Quadríceps')} pulse={pulse} />
        <M p={[0.08, 0.16, 0.04]} s={[0.065, 0.22, 0.06]} st={ms('Quadríceps')} pulse={pulse} />
        <M p={[-0.06, 0.04, 0.06]} s={[0.06, 0.12, 0.055]} st={ms('Quadríceps')} pulse={pulse} />
        <M p={[0, 0.14, 0.04]} s={[0.06, 0.18, 0.05]} st={ms('Quadríceps')} pulse={pulse} />
        <M p={[-0.03, 0.14, 0.1]} r={[0, 0, 0.2]} s={[0.025, 0.2, 0.02]} st={ms('Quadríceps')} pulse={pulse} />

        <M p={[0.04, 0.18, -0.08]} s={[0.055, 0.22, 0.05]} st={ms('Isquiotibiais')} pulse={pulse} />
        <M p={[-0.02, 0.18, -0.08]} s={[0.045, 0.2, 0.045]} st={ms('Isquiotibiais')} pulse={pulse} />
        <M p={[-0.04, 0.16, -0.06]} s={[0.04, 0.18, 0.04]} st={ms('Isquiotibiais')} pulse={pulse} />

        <M p={[-0.07, 0.24, 0.01]} s={[0.04, 0.16, 0.055]} st={ms('Core')} pulse={pulse} />
        <M p={[-0.06, 0.16, -0.01]} s={[0.035, 0.14, 0.045]} st={ms('Core')} pulse={pulse} />

        <T p={[0.1, 0.1, 0.01]} s={[0.02, 0.24, 0.015]} />

        <T p={[0, -0.1, 0.06]} s={[0.04, 0.04, 0.03]} />
        <T p={[-0.03, -0.1, -0.03]} s={[0.025, 0.03, 0.02]} />
        <T p={[0.03, -0.1, -0.03]} s={[0.025, 0.03, 0.02]} />
        <mesh position={[0, -0.1, 0.07]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <TendonMat />
        </mesh>

        <M p={[-0.02, -0.28, -0.04]} s={[0.06, 0.15, 0.055]} st={ms('Panturrilha')} pulse={pulse} />
        <M p={[0.04, -0.28, -0.04]} s={[0.055, 0.14, 0.05]} st={ms('Panturrilha')} pulse={pulse} />
        <M p={[0, -0.38, -0.02]} s={[0.05, 0.12, 0.045]} st={ms('Panturrilha')} pulse={pulse} />
        <M p={[-0.03, -0.3, 0.04]} s={[0.035, 0.14, 0.035]} st={ms('Panturrilha')} pulse={pulse} />
        <M p={[0.06, -0.34, 0.01]} s={[0.025, 0.12, 0.025]} st={ms('Panturrilha')} pulse={pulse} />

        <T p={[0, -0.5, -0.03]} s={[0.02, 0.06, 0.015]} />
        <T p={[0, -0.55, 0.02]} r={[0.3, 0, 0]} s={[0.035, 0.02, 0.025]} />

        <mesh position={[0, -0.58, 0.04]} scale={[0.06, 0.02, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <SkinMat opacity={0.45} />
        </mesh>
        {[-0.04, -0.025, -0.01, 0.005, 0.02].map((tx, i) => (
          <mesh key={`rt-${i}`} position={[tx, -0.58, 0.12]} scale={[0.01, 0.012, 0.015]}>
            <sphereGeometry args={[1, 6, 6]} />
            <SkinMat opacity={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
