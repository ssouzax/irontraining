// Exercise library with variations system for Brazilian Portuguese
export interface ExerciseVariation {
  id: string;
  name: string; // Full display name e.g. "Supino inclinado com halteres"
  equipment: string; // e.g. "halteres", "barra", "máquina"
}

export interface ExerciseBase {
  id: string;
  baseName: string; // e.g. "Supino inclinado"
  muscleGroup: string;
  category: 'compound' | 'accessory';
  variations: ExerciseVariation[];
}

export interface ExerciseGroup {
  name: string; // e.g. "Peito"
  exercises: ExerciseBase[];
}

function makeId(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

function base(baseName: string, muscleGroup: string, category: 'compound' | 'accessory', variations: [string, string][]): ExerciseBase {
  return {
    id: makeId(baseName),
    baseName,
    muscleGroup,
    category,
    variations: variations.map(([equip, fullName]) => ({
      id: makeId(fullName || `${baseName} ${equip}`),
      name: fullName || `${baseName} ${equip}`,
      equipment: equip,
    })),
  };
}

export const exerciseGroups: ExerciseGroup[] = [
  {
    name: 'Peito',
    exercises: [
      base('Supino reto', 'Peito', 'compound', [
        ['barra', 'Supino reto barra'],
        ['halteres', 'Supino reto halteres'],
        ['máquina', 'Supino reto máquina'],
        ['smith', 'Supino reto smith'],
      ]),
      base('Supino inclinado', 'Peito', 'compound', [
        ['barra', 'Supino inclinado barra'],
        ['halteres', 'Supino inclinado halteres'],
        ['máquina', 'Supino inclinado máquina'],
        ['smith', 'Supino inclinado smith'],
      ]),
      base('Supino declinado', 'Peito', 'compound', [
        ['barra', 'Supino declinado barra'],
        ['halteres', 'Supino declinado halteres'],
        ['máquina', 'Supino declinado máquina'],
        ['smith', 'Supino declinado smith'],
      ]),
      base('Crucifixo', 'Peito', 'accessory', [
        ['halteres reto', 'Crucifixo reto halteres'],
        ['halteres inclinado', 'Crucifixo inclinado halteres'],
        ['máquina (Peck Deck)', 'Crucifixo na máquina (Peck Deck)'],
      ]),
      base('Cross-over', 'Peito', 'accessory', [
        ['polia alta', 'Cross-over alta na polia'],
        ['polia média', 'Cross-over na polia'],
        ['polia baixa', 'Cross-over baixa na polia'],
      ]),
      base('Flexão de braço', 'Peito', 'compound', [
        ['tradicional', 'Flexão de braço tradicional'],
        ['pés elevados', 'Flexão com pés elevados'],
        ['diamante', 'Flexão diamante'],
        ['com elástico', 'Flexão com elástico'],
      ]),
      base('Pullover', 'Peito', 'accessory', [
        ['halteres', 'Pullover halteres'],
        ['polia', 'Pullover polia'],
      ]),
      base('Chest press', 'Peito', 'compound', [
        ['máquina', 'Chest press máquina'],
        ['hammer', 'Supino em máquina Hammer'],
      ]),
    ],
  },
  {
    name: 'Costas',
    exercises: [
      base('Puxada frontal', 'Costas', 'compound', [
        ['pegada aberta', 'Puxada frente barra aberta'],
        ['pegada fechada', 'Puxada frente pegada fechada'],
        ['pegada neutra', 'Puxada frente pegada neutra'],
        ['pegada supinada', 'Pull-down pegada supinada'],
      ]),
      base('Remada curvada', 'Costas', 'compound', [
        ['barra', 'Remada curvada barra'],
        ['halteres', 'Remada curvada halteres'],
      ]),
      base('Remada baixa', 'Costas', 'compound', [
        ['polia (triângulo)', 'Remada baixa na polia'],
        ['máquina', 'Remada sentado máquina'],
        ['hammer', 'Remada na máquina Hammer'],
      ]),
      base('Remada unilateral', 'Costas', 'compound', [
        ['halteres', 'Remada unilateral halteres'],
        ['cabo', 'Remada unilateral cabo'],
      ]),
      base('Pull-up (barra fixa)', 'Costas', 'compound', [
        ['pegada pronada', 'Barra fixa pegada pronada'],
        ['pegada supinada (chin-up)', 'Barra fixa pegada supinada'],
        ['pegada neutra', 'Barra fixa pegada neutra'],
        ['com peso', 'Barra fixa com peso'],
        ['assistido', 'Barra fixa assistida'],
      ]),
      base('T-Bar Row', 'Costas', 'compound', [
        ['máquina', 'Remada cavalinho máquina'],
        ['landmine', 'Remada cavalinho landmine'],
      ]),
      base('Levantamento terra', 'Costas', 'compound', [
        ['tradicional', 'Levantamento terra tradicional'],
        ['sumô', 'Levantamento terra sumô'],
        ['romeno', 'Levantamento terra romeno'],
        ['trap bar', 'Levantamento terra trap bar'],
        ['snatch grip', 'Levantamento terra snatch grip'],
      ]),
      base('Face pull', 'Costas', 'accessory', [
        ['polia', 'Face pull na polia'],
        ['alta rotação', 'Face pull com rotação externa'],
      ]),
      base('Pullover costas', 'Costas', 'accessory', [
        ['polia', 'Pullover na polia'],
        ['halteres', 'Pullover halteres costas'],
      ]),
      base('Hiperextensão', 'Costas', 'accessory', [
        ['corpo', 'Hiperextensão lombar'],
        ['com peso', 'Hiperextensão com peso'],
      ]),
      base('Encolhimento (trapézio)', 'Costas', 'accessory', [
        ['barra', 'Encolhimento de ombros barra'],
        ['halteres', 'Encolhimento de ombros halteres'],
        ['smith', 'Encolhimento smith'],
      ]),
      base('Remada invertida', 'Costas', 'compound', [
        ['barra', 'Remada invertida barra'],
        ['TRX', 'Remada invertida TRX'],
      ]),
      base('Good morning', 'Costas', 'accessory', [
        ['barra', 'Good morning barra'],
        ['halteres', 'Good morning halteres'],
      ]),
    ],
  },
  {
    name: 'Ombros',
    exercises: [
      base('Desenvolvimento', 'Ombros', 'compound', [
        ['barra', 'Desenvolvimento militar barra'],
        ['halteres', 'Desenvolvimento militar halteres'],
        ['máquina', 'Desenvolvimento na máquina'],
        ['arnold', 'Desenvolvimento Arnold'],
        ['smith', 'Desenvolvimento barra Smith'],
      ]),
      base('Elevação lateral', 'Ombros', 'accessory', [
        ['halteres', 'Elevação lateral halteres'],
        ['polia', 'Elevação lateral polia'],
        ['máquina', 'Elevação lateral máquina'],
        ['inclinado 45°', 'Elevação 45° inclinado'],
      ]),
      base('Elevação frontal', 'Ombros', 'accessory', [
        ['halteres', 'Elevação frontal halteres'],
        ['barra', 'Elevação frontal barra'],
        ['polia', 'Elevação frontal polia'],
        ['disco', 'Elevação frontal com disco'],
      ]),
      base('Elevação posterior', 'Ombros', 'accessory', [
        ['halteres', 'Elevação posterior halteres'],
        ['polia', 'Elevação posterior polia'],
        ['máquina (reverse fly)', 'Reverse fly'],
      ]),
      base('Remada alta', 'Ombros', 'compound', [
        ['barra', 'Upright row barra'],
        ['halteres', 'Upright row halteres'],
        ['polia', 'Upright row polia'],
      ]),
    ],
  },
  {
    name: 'Bíceps',
    exercises: [
      base('Rosca direta', 'Bíceps', 'accessory', [
        ['barra reta', 'Rosca direta barra'],
        ['barra EZ', 'Rosca direta barra EZ'],
        ['halteres', 'Rosca direta halteres'],
        ['alternada', 'Rosca alternada'],
      ]),
      base('Rosca martelo', 'Bíceps', 'accessory', [
        ['halteres', 'Rosca martelo'],
        ['cross-body', 'Cross-body hammer curl'],
      ]),
      base('Rosca concentrada', 'Bíceps', 'accessory', [
        ['halteres', 'Rosca concentrada'],
      ]),
      base('Rosca Scott', 'Bíceps', 'accessory', [
        ['barra', 'Rosca Scott barra'],
        ['halteres', 'Rosca Scott halteres'],
        ['máquina', 'Preacher curl na máquina'],
      ]),
      base('Rosca no cabo', 'Bíceps', 'accessory', [
        ['polia baixa', 'Rosca no cabo baixa'],
        ['polia alta', 'Rosca no cabo alta'],
      ]),
      base('Rosca 21', 'Bíceps', 'accessory', [
        ['barra', 'Rosca 21'],
      ]),
      base('Rosca inclinada', 'Bíceps', 'accessory', [
        ['halteres', 'Incline dumbbell curl'],
      ]),
    ],
  },
  {
    name: 'Tríceps',
    exercises: [
      base('Tríceps testa', 'Tríceps', 'accessory', [
        ['barra', 'Tríceps testa barra'],
        ['halteres', 'Tríceps testa halteres'],
        ['corda', 'Tríceps testa na corda'],
      ]),
      base('Tríceps polia', 'Tríceps', 'accessory', [
        ['corda alta', 'Tríceps corda polia alta'],
        ['barra reta', 'Tríceps na polia alta com barra'],
        ['pegada supinada', 'Tríceps supinado'],
        ['pegada pronada', 'Tríceps com pegada pronada'],
      ]),
      base('Tríceps francês', 'Tríceps', 'accessory', [
        ['barra', 'Tríceps francês barra'],
        ['halteres', 'Tríceps francês halteres'],
        ['polia (overhead)', 'Tríceps overhead cable'],
      ]),
      base('Supino pegada fechada', 'Tríceps', 'compound', [
        ['barra', 'Close grip bench press'],
      ]),
      base('Mergulho (dips)', 'Tríceps', 'compound', [
        ['paralela', 'Dips paralela'],
        ['máquina', 'Dips máquina'],
        ['com peso', 'Dips weighted'],
        ['banco', 'Tríceps banco (bench dips)'],
      ]),
      base('Kickback', 'Tríceps', 'accessory', [
        ['halteres', 'Tríceps kickback'],
      ]),
    ],
  },
  {
    name: 'Pernas',
    exercises: [
      base('Agachamento', 'Pernas', 'compound', [
        ['barra livre', 'Agachamento livre barra'],
        ['frontal', 'Agachamento frontal'],
        ['sumô', 'Agachamento sumô'],
        ['smith', 'Agachamento Smith'],
        ['goblet', 'Agachamento goblet'],
        ['halteres', 'Agachamento com halteres'],
      ]),
      base('Hack squat', 'Pernas', 'compound', [
        ['máquina', 'Hack squat'],
      ]),
      base('Leg press', 'Pernas', 'compound', [
        ['45°', 'Leg press 45°'],
        ['horizontal', 'Leg press'],
      ]),
      base('Avanço (lunge)', 'Pernas', 'compound', [
        ['livre', 'Afundo livre'],
        ['halteres', 'Avanço com halteres'],
        ['smith', 'Afundo Smith'],
        ['búlgaro', 'Bulgarian split squat'],
      ]),
      base('Cadeira extensora', 'Pernas', 'accessory', [
        ['máquina', 'Cadeira extensora'],
      ]),
      base('Cadeira flexora', 'Pernas', 'accessory', [
        ['sentado', 'Flexora sentado'],
        ['deitado', 'Flexora deitada'],
      ]),
      base('Stiff', 'Pernas', 'compound', [
        ['barra', 'Stiff'],
        ['halteres', 'Stiff com halteres'],
      ]),
      base('Adutor/Abdutor', 'Pernas', 'accessory', [
        ['adutor máquina', 'Adutor na máquina'],
        ['abdutor máquina', 'Abdutor na máquina'],
        ['abdução polia', 'Abdução de quadril na polia'],
      ]),
      base('Step-up', 'Pernas', 'compound', [
        ['corpo', 'Step-up'],
        ['halteres', 'Step-up com halteres'],
      ]),
    ],
  },
  {
    name: 'Glúteos',
    exercises: [
      base('Hip thrust', 'Glúteos', 'compound', [
        ['barra', 'Hip thrust barra'],
        ['halteres', 'Hip thrust halteres'],
      ]),
      base('Elevação pélvica', 'Glúteos', 'accessory', [
        ['barra', 'Glute bridge barra'],
        ['halteres', 'Glute bridge com halteres'],
        ['unilateral', 'Ponte unilateral de glúteo'],
      ]),
      base('Kickback glúteo', 'Glúteos', 'accessory', [
        ['polia', 'Kickback na polia'],
        ['caneleira', 'Donkey kick com caneleira'],
      ]),
      base('Abdução com miniband', 'Glúteos', 'accessory', [
        ['clamshell', 'Clamshell com miniband'],
        ['monster walk', 'Monster walk (miniband)'],
        ['fire hydrant', 'Fire hydrant com miniband'],
      ]),
    ],
  },
  {
    name: 'Panturrilhas',
    exercises: [
      base('Panturrilha', 'Panturrilhas', 'accessory', [
        ['em pé', 'Calf raise em pé'],
        ['sentado', 'Calf raise sentado'],
        ['unilateral', 'Calf raise unilateral'],
        ['no leg press', 'Calf press no leg press'],
        ['smith', 'Smith calf raise'],
      ]),
    ],
  },
  {
    name: 'Core / Abdômen',
    exercises: [
      base('Abdominal', 'Core', 'accessory', [
        ['crunch', 'Abdominal crunch'],
        ['inverso', 'Abdominal inverso'],
        ['bicicleta', 'Abdominal bicicleta'],
        ['na polia', 'Cable crunch'],
      ]),
      base('Prancha', 'Core', 'accessory', [
        ['frontal', 'Prancha frontal'],
        ['lateral', 'Prancha lateral'],
      ]),
      base('Elevação de pernas', 'Core', 'accessory', [
        ['suspensa', 'Hanging leg raise'],
        ['no banco', 'Elevação de pernas no banco'],
        ['no chão', 'Elevação de pernas chão'],
      ]),
      base('Roda abdominal', 'Core', 'accessory', [
        ['roda', 'Ab-roller (roda abdominal)'],
        ['barra', 'Ab rollout barra'],
      ]),
      base('Russian twist', 'Core', 'accessory', [
        ['corpo', 'Russian twist'],
      ]),
    ],
  },
  {
    name: 'Antebraço',
    exercises: [
      base('Wrist curl', 'Antebraço', 'accessory', [
        ['barra', 'Wrist curl barra'],
        ['halteres', 'Wrist curl halteres'],
        ['reverso barra', 'Reverse wrist curl barra'],
      ]),
      base('Farmer carry', 'Antebraço', 'accessory', [
        ['halteres', 'Farmer carry'],
      ]),
    ],
  },
];

// Flat list of all exercise names for search/compatibility
export const allExerciseNames: string[] = exerciseGroups
  .flatMap(g => g.exercises.flatMap(e => e.variations.map(v => v.name)))
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));

// Find variations for a given exercise name
export function findVariations(exerciseName: string): ExerciseVariation[] {
  for (const group of exerciseGroups) {
    for (const ex of group.exercises) {
      const match = ex.variations.find(v => v.name === exerciseName);
      if (match) {
        return ex.variations.filter(v => v.name !== exerciseName);
      }
    }
  }
  return [];
}

// Find the base exercise for a given variation name
export function findBaseExercise(exerciseName: string): ExerciseBase | null {
  for (const group of exerciseGroups) {
    for (const ex of group.exercises) {
      if (ex.variations.some(v => v.name === exerciseName)) {
        return ex;
      }
    }
  }
  return null;
}

// Search exercises by query
export function searchExercises(query: string): ExerciseVariation[] {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const results: ExerciseVariation[] = [];
  for (const group of exerciseGroups) {
    for (const ex of group.exercises) {
      for (const v of ex.variations) {
        const name = v.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (name.includes(q)) results.push(v);
      }
    }
  }
  return results;
}
