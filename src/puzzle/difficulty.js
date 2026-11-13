// ============================================================================
// DIFFICULTY - Niveaux exposés à l'UI
// ============================================================================
//
// La difficulté monte en crescendo sur deux leviers (voir logic.js) :
//   - le raisonnement exigé : EASY = un bloc à la fois, NORMAL = croiser deux
//     blocs / suivre le nœud, HARD = faire une hypothèse et la réfuter ;
//   - la part d'indices cachés : ~20 % / ~35 % / maximum.

// index = state.difficulty
export const DIFFICULTIES = [
    { id: 'easy', label: 'EASY' },
    { id: 'normal', label: 'NORMAL' },
    { id: 'hard', label: 'HARD' }
];

// Multiplicateur de score par niveau
export const SCORE_MULTIPLIER = [1, 1.5, 2];
