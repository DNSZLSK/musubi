// ============================================================================
// GENERATOR - Génération des puzzles
// ============================================================================

import { state } from '../state.js';
import { hasUniqueSolution } from './solver.js';

// Densité de remplissage de la solution aléatoire
const FILL_DENSITY = 0.35;
// Garde-fou : nombre max de régénérations avant de renoncer à l'unicité
const MAX_ATTEMPTS = 200;

/**
 * Génère un nouveau puzzle à solution unique.
 * Régénère tant que le puzzle est trivial (grille vide déjà gagnante)
 * ou admet plusieurs solutions.
 */
export function generatePuzzle() {
    const size = state.gridSize;
    let attempts = 0;

    do {
        attempts++;
        state.circles = [];
        state.numbers = [];

        // Génère les cercles avec une solution aléatoire
        for (let y = 0; y < size; y++) {
            state.circles[y] = [];
            for (let x = 0; x < size; x++) {
                state.circles[y][x] = {
                    filled: false,
                    solution: Math.random() < FILL_DENSITY
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
    } while (
        (checkWin() || !hasUniqueSolution(state.numbers, size)) &&
        attempts < MAX_ATTEMPTS
    );
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

/**
 * Démarre l'animation melt (victoire)
 */
export function startMelt() {
    state.meltActive = true;
    state.meltProgress = 0;
    state.meltPhase = 0;
}

/**
 * Met à jour l'animation melt
 * Retourne true si l'animation est terminée
 */
export function updateMelt() {
    if (!state.meltActive) return false;

    state.meltProgress += 0.05;

    if (state.meltPhase === 0 && state.meltProgress >= 1) {
        // Passe au fade out
        state.meltPhase = 1;
        state.meltProgress = 0;
    } else if (state.meltPhase === 1 && state.meltProgress >= 1) {
        // Animation terminée
        state.meltActive = false;
        state.meltProgress = 0;
        state.meltPhase = 0;
        return true;
    }

    return false;
}
