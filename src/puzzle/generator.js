// ============================================================================
// GENERATOR - Génération des puzzles
// ============================================================================

import { state } from '../state.js';

/**
 * Génère un nouveau puzzle
 */
export function generatePuzzle() {
    const size = state.gridSize;
    state.circles = [];
    state.numbers = [];

    // Génère les cercles avec une solution aléatoire
    for (let y = 0; y < size; y++) {
        state.circles[y] = [];
        for (let x = 0; x < size; x++) {
            state.circles[y][x] = {
                filled: false,
                solution: Math.random() < 0.35
            };
        }
    }

    // Calcule les nombres (somme des voisins remplis)
    for (let y = 0; y < size - 1; y++) {
        state.numbers[y] = [];
        for (let x = 0; x < size - 1; x++) {
            let count = 0;
            if (state.circles[y][x].solution) count++;
            if (state.circles[y][x + 1].solution) count++;
            if (state.circles[y + 1][x].solution) count++;
            if (state.circles[y + 1][x + 1].solution) count++;
            state.numbers[y][x] = count;
        }
    }
}

/**
 * Vérifie si le puzzle est résolu
 */
export function checkWin() {
    const size = state.gridSize;

    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            let count = 0;
            if (state.circles[y][x].filled) count++;
            if (state.circles[y][x + 1].filled) count++;
            if (state.circles[y + 1][x].filled) count++;
            if (state.circles[y + 1][x + 1].filled) count++;

            if (count !== state.numbers[y][x]) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Bascule l'état d'un cercle
 */
export function toggleCircle(x, y) {
    if (x >= 0 && x < state.gridSize && y >= 0 && y < state.gridSize) {
        state.circles[y][x].filled = !state.circles[y][x].filled;
        triggerAnimation(x, y);
        return true;
    }
    return false;
}

/**
 * Déclenche une animation sur un cercle
 */
export function triggerAnimation(x, y) {
    state.animations = state.animations.filter((a) => !(a.x === x && a.y === y));
    state.animations.push({ x, y, progress: 0 });
}

/**
 * Met à jour les animations
 */
export function updateAnimations() {
    if (state.animations.length > 0) {
        state.animations.forEach((a) => (a.progress += 0.08));
        state.animations = state.animations.filter((a) => a.progress < 1);
        return true; // Indique qu'il faut redessiner
    }
    return false;
}
