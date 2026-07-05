import { describe, it, expect, beforeEach } from 'vitest';
import { countSolutions } from '../src/puzzle/solver.js';
import {
    countSolutionsMasked,
    hasUniqueSolutionMasked,
    scanSolve,
    reduceClues,
    targetDepthFor
} from '../src/puzzle/difficulty.js';
import { state } from '../src/state.js';
import { generatePuzzle } from '../src/puzzle/generator.js';

// Masque "tous visibles" de taille (size-1)x(size-1)
function fullMask(size) {
    const n = size - 1;
    return Array.from({ length: n }, () => new Array(n).fill(true));
}

// Compte les indices masqués
function hiddenCount(mask) {
    let h = 0;
    for (const row of mask) for (const v of row) if (!v) h++;
    return h;
}

describe('targetDepthFor', () => {
    it('ALL (0) ne demande aucune déduction', () => {
        expect(targetDepthFor(0, 4)).toBe(0);
        expect(targetDepthFor(0, 6)).toBe(0);
    });
    it('FEW (2) vise le minimal', () => {
        expect(targetDepthFor(2, 5)).toBe(Infinity);
    });
    it('SOME (1) est modéré et croît avec la taille', () => {
        expect(targetDepthFor(1, 4)).toBe(2);
        expect(targetDepthFor(1, 5)).toBe(3);
        expect(targetDepthFor(1, 6)).toBe(4);
    });
});

describe('countSolutionsMasked', () => {
    it('coïncide avec countSolutions quand tous les indices sont visibles', () => {
        // cas 2x2 connus
        expect(countSolutionsMasked([[2]], fullMask(2), 2)).toBe(6);
        expect(countSolutionsMasked([[0]], fullMask(2), 2)).toBe(1);
        expect(countSolutionsMasked([[4]], fullMask(2), 2)).toBe(1);

        // cas 4x4 tiré d'une solution concrète
        const numbers = [
            [3, 1, 0],
            [2, 2, 1],
            [2, 3, 3]
        ];
        expect(countSolutionsMasked(numbers, fullMask(4), 4)).toBe(
            countSolutions(numbers, 4)
        );
    });

    it('masquer un indice ne réduit jamais le nombre de solutions', () => {
        const numbers = [
            [3, 1, 0],
            [2, 2, 1],
            [2, 3, 3]
        ];
        const full = countSolutionsMasked(numbers, fullMask(4), 4);
        const mask = fullMask(4);
        mask[0][0] = false;
        expect(countSolutionsMasked(numbers, mask, 4)).toBeGreaterThanOrEqual(full);
    });

    it('respecte maxCount (arrêt anticipé)', () => {
        expect(countSolutionsMasked([[2]], fullMask(2), 2, 2)).toBe(2);
    });
});

describe('scanSolve', () => {
    it('résout au scan seul un puzzle localement forcé', () => {
        // solution 3x3 : un seul cercle plein en (0,0)
        const numbers = [
            [1, 0],
            [0, 0]
        ];
        const res = scanSolve(numbers, fullMask(3), 3);
        expect(res.solved).toBe(true);
        expect(res.unknown).toBe(0);
    });

    it('laisse une case inconnue quand son indice est masqué et non déductible localement', () => {
        const numbers = [
            [1, 0],
            [0, 0]
        ];
        const mask = fullMask(3);
        mask[0][0] = false; // on cache le "1" qui forçait (0,0)
        const res = scanSolve(numbers, mask, 3);
        expect(res.solved).toBe(false);
        expect(res.unknown).toBe(1);
    });
});

describe('reduceClues', () => {
    beforeEach(() => {
        state.circles = [];
        state.numbers = [];
    });

    it('niveau ALL (targetDepth 0) ne masque aucun indice', () => {
        const numbers = [
            [3, 1, 0],
            [2, 2, 1],
            [2, 3, 3]
        ];
        const mask = reduceClues(numbers, 4, () => 0.42, 0);
        expect(hiddenCount(mask)).toBe(0);
        expect(mask.length).toBe(3);
        expect(mask[0].length).toBe(3);
    });

    it('préserve toujours l’unicité de la solution (SOME et FEW, toutes tailles)', () => {
        const rng = () => 0.42; // déterministe
        for (const size of [4, 5, 6]) {
            for (let i = 0; i < 8; i++) {
                state.gridSize = size;
                state.difficulty = 0; // génère avec indices pleins puis on réduit à la main
                generatePuzzle();
                for (const level of [1, 2]) {
                    const mask = reduceClues(state.numbers, size, rng, targetDepthFor(level, size));
                    expect(hasUniqueSolutionMasked(state.numbers, mask, size)).toBe(true);
                }
            }
        }
    });

    it('FEW retire effectivement des indices sur une grille 6x6', () => {
        state.gridSize = 6;
        state.difficulty = 0;
        generatePuzzle();
        const mask = reduceClues(state.numbers, 6, () => 0.42, targetDepthFor(2, 6));
        expect(hiddenCount(mask)).toBeGreaterThan(0);
    });
});
