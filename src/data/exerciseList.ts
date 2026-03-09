export interface ExerciseCategory {
  name: string;
  exercises: string[];
}

export const exerciseCategories: ExerciseCategory[] = [
  {
    name: 'Peito',
    exercises: [
      'Supino reto barra', 'Supino reto halteres', 'Supino inclinado barra', 'Supino inclinado halteres',
      'Supino declinado barra', 'Supino declinado halteres', 'Crucifixo reto halteres', 'Crucifixo inclinado halteres',
      'Crucifixo na máquina (Peck Deck)', 'Peck Deck', 'Flexão de braço tradicional', 'Flexão com pés elevados',
      'Supino na máquina', 'Supino articulado', 'Supino reto com parada', 'Cross-over na polia',
      'Cross-over baixa na polia', 'Cross-over alta na polia', 'Flexão diamante', 'Flexão de braço com batida',
      'Flexão com elástico', 'Pullover halteres', 'Pullover polia', 'Flexão declinada', 'Flexão inclinada',
      'Supino com pegada aberta', 'Supino com pegada neutra', 'Flexão archer', 'Flexão pseudo-planche',
      'Supino com banda elástica', 'Supino com pegada fechada', 'Supino com barra trap', 'Supino com kettlebell',
      'Flexão com resistência elástica', 'Flexão de braço unilateral', 'Supino neutro halteres',
      'Supino em máquina Hammer', 'Supino em máquina Smith', 'Supino em máquina guiada',
      'Flexão de braço hindu', 'Flexão tipo Spiderman', 'Flexão com rotação', 'Flexão explosiva',
      'Chest press máquina', 'Flexão com joelhos no chão', 'Flexão com mini-band',
    ],
  },
  {
    name: 'Costas',
    exercises: [
      'Puxada frente barra aberta', 'Puxada frente pegada fechada', 'Puxada frente pegada neutra',
      'Puxada atrás da nuca', 'Remada baixa na polia', 'Remada curvada barra', 'Remada curvada halteres',
      'Remada unilateral cabo', 'Remada unilateral halteres', 'Remada alta polia', 'Pull-down com triângulo',
      'Pull-down pegada supinada', 'Pull-down pegada pronada', 'Pull-up assistido', 'Pull-up barra aberta',
      'Chin-up barra supinada', 'Pull-ups weighted', 'Pull-ups pegada neutra',
      'Remada na máquina Hammer', 'Remada sentado máquina', 'T-bar row', 'Landmine row',
      'Deadlift tradicional', 'Deadlift sumô', 'Deadlift romeno', 'Romanian deadlift',
      'Stiff leg deadlift', 'Snatch grip deadlift', 'Trap bar deadlift',
      'Good mornings', 'Encolhimento de ombros barra', 'Encolhimento halteres',
      'Face pull', 'Face pull alta rotação', 'Hyperextensions', 'Hyperextensions com peso',
      'Pull-over na polia', 'Pull-over halteres', 'Remada invertida TRX', 'Remada invertida barra',
      'Barbell row Yates', 'Remada cavalinho', 'Superman', 'Cobra extension', 'Bird-dog',
      'Wide grip pulldown', 'Cable pull-over', 'Renegade row',
      'Levantamento terra com kettlebell',
    ],
  },
  {
    name: 'Ombros',
    exercises: [
      'Desenvolvimento militar barra', 'Desenvolvimento militar halteres', 'Desenvolvimento na máquina',
      'Desenvolvimento Arnold', 'Elevação lateral halteres', 'Elevação lateral polia', 'Elevação lateral máquina',
      'Elevação frontal halteres', 'Elevação frontal barra', 'Elevação frontal polia', 'Elevação frontal com disco',
      'Elevação 45° inclinado', 'Elevação posterior halteres', 'Elevação posterior polia', 'Reverse fly',
      'Shrugs barra', 'Shrugs halteres', 'Desenvolvimento barra Smith',
      'Push press', 'Dumbbell snatch', 'Upright row barra', 'Upright row polia', 'Upright row halteres',
      'Cuban press', 'Handstand push-ups', 'Pike push-ups', 'Kettlebell press', 'Landmine press',
      'Rotação externa halteres', 'Rotação externa com banda', 'Rotação interna com polia',
      'Shoulder press sentado',
    ],
  },
  {
    name: 'Bíceps',
    exercises: [
      'Rosca direta barra', 'Rosca direta halteres', 'Rosca direta barra EZ',
      'Rosca martelo', 'Rosca alternada', 'Rosca concentrada', 'Rosca 21',
      'Rosca Scott barra', 'Rosca Scott halteres', 'Rosca no cabo baixa', 'Rosca no cabo alta',
      'Rosca inversa barra', 'Rosca inversa halteres', 'Chin-up bíceps foco',
      'Zottman curl', 'Preacher curl na máquina', 'Cross-body hammer curl',
      'Incline dumbbell curl', 'Drag curl', 'Barbell curl grip inverso',
    ],
  },
  {
    name: 'Tríceps',
    exercises: [
      'Tríceps testa barra', 'Tríceps testa halteres', 'Tríceps testa na corda',
      'Tríceps corda polia alta', 'Tríceps corda polia baixa', 'Tríceps francês barra',
      'Tríceps francês halteres', 'Tríceps supinado', 'Tríceps kickback',
      'Tríceps banco (bench dips)', 'Tríceps cadeira (machine)', 'Close grip bench press',
      'Close grip push-ups', 'Tríceps overhead halteres', 'Tríceps overhead cable',
      'Rope overhead', 'Dips paralela', 'Dips máquina', 'Dips weighted',
      'Tríceps na polia alta com barra', 'Tríceps com pegada pronada', 'Bench dips com peso',
      'Reverse grip triceps',
    ],
  },
  {
    name: 'Pernas & Glúteos',
    exercises: [
      'Agachamento livre', 'Agachamento livre barra', 'Agachamento frontal', 'Agachamento sumô',
      'Agachamento Smith', 'Agachamento goblet', 'Agachamento com halteres', 'Agachamento com salto',
      'Agachamento com miniband', 'Agachamento com miniband lateral',
      'Hack squat', 'Leg press', 'Leg press 45°',
      'Avanço (Lunge)', 'Avanço com halteres', 'Avanço lateral', 'Afundo livre', 'Afundo Smith',
      'Bulgarian split squat', 'Step-up', 'Step-up com halteres', 'Step lateral',
      'Cadeira extensora', 'Cadeira flexora', 'Flexora deitada', 'Flexora sentado',
      'Adutor na máquina', 'Abdutor na máquina', 'Abdução de quadril na polia',
      'Stiff', 'Stiff com halteres', 'Deadlift romeno', 'Deadlift sumô',
      'Hip thrust', 'Hip thrust barra', 'Hip thrust halteres',
      'Glute bridge', 'Glute bridge barra', 'Glute bridge com halteres',
      'Elevação pélvica com paralela', 'Ponte unilateral de glúteo',
      'Single leg deadlift', 'Single leg deadlift com halteres',
      'Kettlebell swing', 'Sumo deadlift com kettlebell',
      'Good morning', 'Good mornings',
      'Nordic hamstring', 'Sissy squat', 'Zercher squat', 'Box squat',
      'Box jumps', 'Jump squat', 'Wall sit',
      'Calf raise em pé', 'Calf raise sentado', 'Calf raise unilateral',
      'Calf press no leg press', 'Donkey calf raise',
      'Donkey kicks', 'Fire hydrant com miniband', 'Kickback na polia',
      'Donkey kick com caneleira', 'Clamshell com miniband', 'Monster walk (miniband)',
      'Marcha de glúteo', 'Side-lying leg lift',
    ],
  },
  {
    name: 'Core / Abdômen',
    exercises: [
      'Abdominal crunch', 'Abdominal inverso', 'Abdominal bicicleta', 'Abdominal com bola suíça',
      'Prancha frontal', 'Prancha lateral', 'Prancha com elevação de braço', 'Prancha com elevação de perna',
      'Prancha com toque no ombro', 'Hollow hold', 'V-sit', 'L-sit', 'Jackknife',
      'Elevação de pernas suspensa', 'Elevação de pernas no banco', 'Elevação de pernas chão',
      'Hanging leg raise', 'Hanging knee raise', 'Leg raise hanging',
      'Cable crunch', 'Rope crunch', 'Abdominal na polia alta',
      'Ab-roller (roda abdominal)', 'Ab rollout barra',
      'Russian twist', 'Mountain climber', 'Mountain climber cruzado',
      'Side bend halteres', 'Side bend cabos',
      'Sit-up com peso', 'Sit-up bola suíça', 'Toe touch abdominal',
      'Snake plank', 'Side plank reach under',
    ],
  },
  {
    name: 'Panturrilhas',
    exercises: [
      'Calf raise em pé', 'Calf raise sentado', 'Calf raise unilateral',
      'Calf press leg press', 'Donkey calf raise', 'Smith calf raise',
      'Box calf raise', 'Pular corda', 'Saltos pliométricos',
      'Farmer walk na ponta dos pés',
    ],
  },
  {
    name: 'Antebraço / Punho',
    exercises: [
      'Wrist curl barra', 'Wrist curl halteres', 'Reverse wrist curl barra',
      'Reverse wrist curl halteres', 'Hammer curl foco antebraço', 'Farmer carry',
      'Plate pinch', 'Fingertip push-ups', 'Wrist roller', 'Cable wrist curl', 'Finger curls',
    ],
  },
  {
    name: 'Acessórios / Funcional',
    exercises: [
      'Band pull-apart', 'Band lateral walk', 'Glute kickback cabo',
      'Cable abduction', 'Cable adduction', 'Battle rope', 'Sled push/pull',
      'TRX row', 'TRX push-up', 'TRX single leg squat',
      'Turkish get-up', 'Kettlebell swing', 'Burpees', 'Jumping jacks',
      'Step touches no step', 'Pular corda',
    ],
  },
];

// Flat list for search
export const allExercises: string[] = Array.from(
  new Set(exerciseCategories.flatMap(c => c.exercises))
).sort((a, b) => a.localeCompare(b, 'pt-BR'));
