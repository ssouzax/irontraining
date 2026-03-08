import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import anatomyFront from '@/assets/anatomical-body.png';

// ─── Muscle region definitions (UV-mapped areas on the texture) ──────
// Each region maps a muscle name to a position/scale overlay on the body plane
// Coordinates are in body-local space (body is ~1.1 wide, ~2.8 tall, centered at origin)

interface MuscleRegion {
  name: string;
  pos: [number, number, number];
  scale: [number, number, number];
  rot?: [number, number, number];
}

const MUSCLE_REGIONS: MuscleRegion[] = [
  // ─── Chest ───
  { name: 'Peitoral Maior', pos: [-0.18, 0.72, 0.04], scale: [0.22, 0.12, 0.04] },
  { name: 'Peitoral Maior', pos: [0.18, 0.72, 0.04], scale: [0.22, 0.12, 0.04] },
  { name: 'Peitoral Menor', pos: [-0.14, 0.68, 0.03], scale: [0.12, 0.06, 0.03] },
  { name: 'Peitoral Menor', pos: [0.14, 0.68, 0.03], scale: [0.12, 0.06, 0.03] },

  // ─── Shoulders ───
  { name: 'Deltóide Anterior', pos: [-0.38, 0.78, 0.03], scale: [0.1, 0.1, 0.04] },
  { name: 'Deltóide Anterior', pos: [0.38, 0.78, 0.03], scale: [0.1, 0.1, 0.04] },
  { name: 'Deltóides', pos: [-0.42, 0.82, 0.02], scale: [0.12, 0.12, 0.05] },
  { name: 'Deltóides', pos: [0.42, 0.82, 0.02], scale: [0.12, 0.12, 0.05] },
  { name: 'Deltóide Lateral', pos: [-0.44, 0.8, 0.02], scale: [0.1, 0.1, 0.04] },
  { name: 'Deltóide Lateral', pos: [0.44, 0.8, 0.02], scale: [0.1, 0.1, 0.04] },
  { name: 'Deltóide Posterior', pos: [-0.4, 0.78, -0.03], scale: [0.1, 0.08, 0.04] },
  { name: 'Deltóide Posterior', pos: [0.4, 0.78, -0.03], scale: [0.1, 0.08, 0.04] },

  // ─── Traps ───
  { name: 'Trapézio', pos: [-0.15, 0.95, -0.02], scale: [0.12, 0.14, 0.04] },
  { name: 'Trapézio', pos: [0.15, 0.95, -0.02], scale: [0.12, 0.14, 0.04] },
  { name: 'Trapézio Superior', pos: [-0.12, 1.0, -0.01], scale: [0.08, 0.08, 0.03] },
  { name: 'Trapézio Superior', pos: [0.12, 1.0, -0.01], scale: [0.08, 0.08, 0.03] },

  // ─── Arms ───
  { name: 'Bíceps Braquial', pos: [-0.42, 0.52, 0.03], scale: [0.07, 0.14, 0.05] },
  { name: 'Bíceps Braquial', pos: [0.42, 0.52, 0.03], scale: [0.07, 0.14, 0.05] },
  { name: 'Braquial', pos: [-0.42, 0.48, 0.01], scale: [0.06, 0.08, 0.04] },
  { name: 'Braquial', pos: [0.42, 0.48, 0.01], scale: [0.06, 0.08, 0.04] },
  { name: 'Tríceps', pos: [-0.42, 0.55, -0.03], scale: [0.07, 0.14, 0.05] },
  { name: 'Tríceps', pos: [0.42, 0.55, -0.03], scale: [0.07, 0.14, 0.05] },

  // ─── Forearms ───
  { name: 'Antebraços', pos: [-0.44, 0.3, 0.02], scale: [0.055, 0.16, 0.04] },
  { name: 'Antebraços', pos: [0.44, 0.3, 0.02], scale: [0.055, 0.16, 0.04] },
  { name: 'Braquiorradial', pos: [-0.44, 0.35, 0.02], scale: [0.04, 0.1, 0.03] },
  { name: 'Braquiorradial', pos: [0.44, 0.35, 0.02], scale: [0.04, 0.1, 0.03] },

  // ─── Core ───
  { name: 'Core', pos: [0, 0.48, 0.04], scale: [0.16, 0.22, 0.03] },
  { name: 'Reto Abdominal', pos: [0, 0.48, 0.04], scale: [0.12, 0.2, 0.03] },
  { name: 'Oblíquos', pos: [-0.2, 0.42, 0.03], scale: [0.08, 0.14, 0.03] },
  { name: 'Oblíquos', pos: [0.2, 0.42, 0.03], scale: [0.08, 0.14, 0.03] },

  // ─── Back ───
  { name: 'Dorsais', pos: [-0.25, 0.58, -0.04], scale: [0.18, 0.22, 0.04] },
  { name: 'Dorsais', pos: [0.25, 0.58, -0.04], scale: [0.18, 0.22, 0.04] },
  { name: 'Rombóides', pos: [-0.1, 0.72, -0.04], scale: [0.08, 0.12, 0.03] },
  { name: 'Rombóides', pos: [0.1, 0.72, -0.04], scale: [0.08, 0.12, 0.03] },
  { name: 'Eretores', pos: [-0.06, 0.4, -0.04], scale: [0.05, 0.28, 0.03] },
  { name: 'Eretores', pos: [0.06, 0.4, -0.04], scale: [0.05, 0.28, 0.03] },

  // ─── Legs - Quads ───
  { name: 'Quadríceps', pos: [-0.16, -0.08, 0.04], scale: [0.14, 0.28, 0.05] },
  { name: 'Quadríceps', pos: [0.16, -0.08, 0.04], scale: [0.14, 0.28, 0.05] },
  { name: 'Reto Femoral', pos: [-0.15, -0.05, 0.05], scale: [0.08, 0.22, 0.04] },
  { name: 'Reto Femoral', pos: [0.15, -0.05, 0.05], scale: [0.08, 0.22, 0.04] },
  { name: 'Vasto Lateral', pos: [-0.22, -0.1, 0.03], scale: [0.07, 0.2, 0.04] },
  { name: 'Vasto Lateral', pos: [0.22, -0.1, 0.03], scale: [0.07, 0.2, 0.04] },
  { name: 'Vasto Medial', pos: [-0.12, -0.18, 0.04], scale: [0.06, 0.1, 0.04] },
  { name: 'Vasto Medial', pos: [0.12, -0.18, 0.04], scale: [0.06, 0.1, 0.04] },

  // ─── Legs - Hamstrings ───
  { name: 'Isquiotibiais', pos: [-0.16, -0.06, -0.04], scale: [0.12, 0.24, 0.04] },
  { name: 'Isquiotibiais', pos: [0.16, -0.06, -0.04], scale: [0.12, 0.24, 0.04] },
  { name: 'Posteriores de Coxa', pos: [-0.16, -0.06, -0.04], scale: [0.12, 0.24, 0.04] },
  { name: 'Posteriores de Coxa', pos: [0.16, -0.06, -0.04], scale: [0.12, 0.24, 0.04] },

  // ─── Glutes ───
  { name: 'Glúteos', pos: [-0.14, 0.12, -0.04], scale: [0.14, 0.12, 0.05] },
  { name: 'Glúteos', pos: [0.14, 0.12, -0.04], scale: [0.14, 0.12, 0.05] },
  { name: 'Glúteo Médio', pos: [-0.22, 0.16, -0.03], scale: [0.1, 0.08, 0.04] },
  { name: 'Glúteo Médio', pos: [0.22, 0.16, -0.03], scale: [0.1, 0.08, 0.04] },

  // ─── Calves ───
  { name: 'Panturrilha', pos: [-0.15, -0.48, -0.02], scale: [0.07, 0.16, 0.05] },
  { name: 'Panturrilha', pos: [0.15, -0.48, -0.02], scale: [0.07, 0.16, 0.05] },
  { name: 'Gastrocnêmio', pos: [-0.15, -0.45, -0.03], scale: [0.06, 0.12, 0.04] },
  { name: 'Gastrocnêmio', pos: [0.15, -0.45, -0.03], scale: [0.06, 0.12, 0.04] },
  { name: 'Sóleo', pos: [-0.14, -0.55, -0.02], scale: [0.05, 0.1, 0.03] },
  { name: 'Sóleo', pos: [0.14, -0.55, -0.02], scale: [0.05, 0.1, 0.03] },
];

function getMuscleState(muscle: string, primary: string[], secondary: string[]): 'primary' | 'secondary' | 'inactive' {
  if (primary.some(p => muscle.includes(p) || p.includes(muscle))) return 'primary';
  if (secondary.some(s => muscle.includes(s) || s.includes(muscle))) return 'secondary';
  return 'inactive';
}

// ─── Highlight overlay for a muscle region ──────
function MuscleOverlay({ region, state, pulse }: { region: MuscleRegion; state: 'primary' | 'secondary' | 'inactive'; pulse: number }) {
  if (state === 'inactive') return null;

  const color = state === 'primary' ? '#ff1a1a' : '#ff8800';
  const intensity = state === 'primary' ? 0.4 + Math.sin(pulse * 3) * 0.2 : 0.25;

  return (
    <mesh position={region.pos} rotation={region.rot || [0, 0, 0]} scale={region.scale}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─── Main body with texture ──────

interface AnatomicalBodyProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  animationPhase: number;
}

export function AnatomicalBody({ primaryMuscles, secondaryMuscles, animationPhase }: AnatomicalBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, anatomyFront);

  // Texture settings
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  const breathe = Math.sin(animationPhase * 0.5) * 0.008;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = breathe;
    }
  });

  // Body plane dimensions (aspect ratio ~0.52 from the image: ~600w x 1150h)
  const bodyWidth = 1.1;
  const bodyHeight = 2.8;

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Front-facing textured body plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[bodyWidth, bodyHeight]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.6}
          metalness={0}
        />
      </mesh>

      {/* Back side - slightly darker version */}
      <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[bodyWidth, bodyHeight]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.7}
          metalness={0}
          color="#cc9999"
        />
      </mesh>

      {/* Thin volume to give slight 3D depth */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[bodyWidth * 0.85, bodyHeight * 0.95, 0.06]} />
        <meshPhysicalMaterial
          color="#8b5e56"
          transparent
          opacity={0.08}
          roughness={0.8}
        />
      </mesh>

      {/* Muscle highlight overlays */}
      {MUSCLE_REGIONS.map((region, i) => {
        const state = getMuscleState(region.name, primaryMuscles, secondaryMuscles);
        return <MuscleOverlay key={i} region={region} state={state} pulse={animationPhase} />;
      })}
    </group>
  );
}
