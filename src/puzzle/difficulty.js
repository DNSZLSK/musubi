// ============================================================================
// DIFFICULTY - Niveaux exposés à l'UI
// ============================================================================
//
// La difficulté = le niveau de raisonnement nécessaire pour finir la grille
// (voir logic.js) : EASY = un bloc à la fois, NORMAL = croiser deux blocs /
// suivre le nœud, HARD = faire une hypothèse et la réfuter.

// index = state.difficulty
export const DIFFICULTIES = [
    { id: 'easy', label: 'EASY' },
    { id: 'normal', label: 'NORMAL' },
    { id: 'hard', label: 'HARD' }
];

// Multiplicateur de score par niveau
export const SCORE_MULTIPLIER = [1, 1.5, 2];
