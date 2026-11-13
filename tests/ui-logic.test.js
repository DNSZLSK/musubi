import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../src/state.js';
import { toggleCircle, undoMove, resetBoard, computeNumbers } from '../src/puzzle/generator.js';
import { mainGroup, grade } from '../src/puzzle/logic.js';
import { loadTutorialStep, TUTORIAL_LENGTH } from '../src/screens/tutorial.js';

function emptyGrid(size) {
    state.gridSize = size;
    state.animations = [];
    state.history = [];
    state.circles = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ filled: false, solution: false }))
    );
}

describe('undo / reset', () => {
    beforeEach(() => emptyGrid(3));

    it('annule les coups dans l’ordre inverse', () => {
        toggleCircle(0, 0);
        toggleCircle(1, 1);
        expect(undoMove()).toBe(true);
        expect(state.circles[1][1].filled).toBe(false);
        expect(state.circles[0][0].filled).toBe(true);
        expect(undoMove()).toBe(true);
        expect(state.circles[0][0].filled).toBe(false);
        expect(undoMove()).toBe(false);
    });

    it('reset vide la grille et l’historique', () => {
        toggleCircle(2, 2);
        expect(resetBoard()).toBe(true);
        expect(state.circles.flat().some((c) => c.filled)).toBe(false);
        expect(state.history).toEqual([]);
        expect(resetBoard()).toBe(false);
    });
});

describe('mainGroup', () => {
    it('garde le plus grand morceau du nœud', () => {
        const g = mainGroup([
            [true, true, false],
            [false, false, false],
            [false, false, true]
        ]);
        expect(g[0][0] && g[0][1]).toBe(true);
        expect(g[2][2]).toBe(false);
    });
});

// Compte les solutions par force brute, avec ou sans la règle du nœud
function bruteCount(numbers, visible, size, knot) {
    let count = 0;
    for (let m = 1; m < 1 << (size * size); m++) {
        const sol = Array.from({ length: size * size }, (_, i) => (m >> i) & 1);
        const n = computeNumbers(sol, size);
        if (!n.every((row, y) => row.every((v, x) => !visible[y][x] || v === numbers[y][x]))) continue;
        if (knot) {
            const rows = Array.from({ length: size }, (_, y) => sol.slice(y * size, y * size + size).map(Boolean));
            const g = mainGroup(rows);
            if (rows.some((r, y) => r.some((f, x) => f && !g[y][x]))) continue;
        }
        count++;
    }
    return count;
}

describe('tutoriel', () => {
    it('chaque étape a une solution unique, trouvable sans deviner', () => {
        for (let step = 0; step < TUTORIAL_LENGTH; step++) {
            loadTutorialStep(step);
            const size = state.gridSize;
            expect(bruteCount(state.numbers, state.clueVisible, size, true)).toBe(1);
            expect(grade(state.numbers, state.clueVisible, size)).toBeLessThanOrEqual(2);
        }
        state.tutorialStep = -1;
    });

    it('la dernière étape a besoin de la règle du nœud', () => {
        loadTutorialStep(TUTORIAL_LENGTH - 1);
        expect(bruteCount(state.numbers, state.clueVisible, state.gridSize, false)).toBeGreaterThan(1);
        state.tutorialStep = -1;
    });
});
