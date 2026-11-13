import { describe, it, expect } from 'vitest';
import { solve, grade, isConnected } from '../src/puzzle/logic.js';
import { computeNumbers, randomKnot, hideClues } from '../src/puzzle/generator.js';

const all = (n) => n.map((r) => r.map(() => true));

// Grille 0/1 à plat -> tableau [y][x] de booléens
const toRows = (flat, size) =>
    Array.from({ length: size }, (_, y) => flat.slice(y * size, y * size + size).map(Boolean));

describe('isConnected', () => {
    it('accepte un seul groupe relié orthogonalement', () => {
        expect(isConnected([[true, true], [false, true]])).toBe(true);
    });
    it('refuse deux groupes (diagonale = pas relié)', () => {
        expect(isConnected([[true, false], [false, true]])).toBe(false);
    });
    it('refuse la grille vide', () => {
        expect(isConnected([[false, false], [false, false]])).toBe(false);
    });
});

describe('solve', () => {
    it('niveau 1 : un bloc seul suffit (0 et 4)', () => {
        // 3x3, ligne du haut pleine
        const sol = [1, 1, 1, 0, 0, 0, 0, 0, 0];
        const numbers = computeNumbers(sol, 3);
        const r = solve(numbers, all(numbers), 3, 1);
        expect(r.solved).toBe(true);
        expect(Array.from(r.grid)).toEqual(sol);
    });

    it('la règle du nœud lève une ambiguïté que les nombres seuls laissent', () => {
        // 2x2, indice 2 : 6 configurations, 4 reliées (pas les deux diagonales).
        // Sans autre info ce n'est pas unique : le solveur ne doit pas conclure.
        const r = solve([[2]], [[true]], 2, 3);
        expect(r.solved).toBe(false);
    });

    it('ne déduit jamais une valeur fausse', () => {
        for (let i = 0; i < 30; i++) {
            const size = 5;
            const sol = randomKnot(size, Math.random);
            const numbers = computeNumbers(sol, size);
            // Nœud ambigu même avec tous les indices : le générateur le rejette
            if (grade(numbers, all(numbers), size) === Infinity) continue;
            const visible = hideClues(numbers, size, Math.random, 3);
            const r = solve(numbers, visible, size, 3);
            expect(r.solved).toBe(true);
            expect(Array.from(r.grid)).toEqual(sol);
        }
    });
});

describe('randomKnot', () => {
    it('produit toujours un nœud relié', () => {
        for (let i = 0; i < 30; i++) {
            expect(isConnected(toRows(randomKnot(6, Math.random), 6))).toBe(true);
        }
    });
});

describe('grade', () => {
    it('masquer des indices ne rend jamais une grille plus facile', () => {
        for (let i = 0; i < 20; i++) {
            const size = 5;
            const sol = randomKnot(size, Math.random);
            const numbers = computeNumbers(sol, size);
            const full = grade(numbers, all(numbers), size);
            const visible = hideClues(numbers, size, Math.random, 3);
            expect(grade(numbers, visible, size)).toBeGreaterThanOrEqual(full);
        }
    });
});
