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

// --- Contrôle indépendant du solveur ----------------------------------------
// Compteur de solutions écrit sans logic.js (DFS + bornes + connexité en feuille) :
// s'il trouvait une 2e solution, le joueur pourrait respecter les règles sans gagner.
function independentCount(numbers, visible, n) {
    const cons = [];
    for (let y = 0; y < n - 1; y++)
        for (let x = 0; x < n - 1; x++)
            if (visible[y][x]) {
                const i = y * n + x;
                cons.push({ c: [i, i + 1, i + n, i + n + 1], v: numbers[y][x] });
            }
    const by = Array.from({ length: n * n }, () => []);
    cons.forEach((k) => k.c.forEach((i) => by[i].push(k)));
    const g = new Int8Array(n * n).fill(-1);
    const sols = [];
    const connected = () => {
        const start = g.indexOf(1);
        if (start < 0) return false;
        const seen = new Uint8Array(n * n);
        const st = [start];
        seen[start] = 1;
        let c = 1;
        while (st.length) {
            const i = st.pop();
            const x = i % n;
            const y = (i - x) / n;
            for (const j of [x > 0 ? i - 1 : -1, x < n - 1 ? i + 1 : -1, y > 0 ? i - n : -1, y < n - 1 ? i + n : -1]) {
                if (j >= 0 && g[j] === 1 && !seen[j]) {
                    seen[j] = 1;
                    c++;
                    st.push(j);
                }
            }
        }
        return c === g.reduce((a, b) => a + b, 0);
    };
    (function rec(i) {
        if (sols.length >= 2) return;
        if (i === n * n) {
            if (connected()) sols.push(Array.from(g));
            return;
        }
        for (const v of [0, 1]) {
            g[i] = v;
            let ok = true;
            for (const k of by[i]) {
                let s = 0;
                let u = 0;
                for (const j of k.c) {
                    if (g[j] < 0) u++;
                    else s += g[j];
                }
                if (s > k.v || s + u < k.v) {
                    ok = false;
                    break;
                }
            }
            if (ok) rec(i + 1);
        }
        g[i] = -1;
    })(0);
    return sols;
}

describe('puzzles générés (contrôle indépendant)', () => {
    it('ont exactement une solution, celle attendue par le jeu', async () => {
        const { state } = await import('../src/state.js');
        const { generatePuzzle } = await import('../src/puzzle/generator.js');
        for (const size of [4, 5, 6]) {
            for (const level of [0, 1, 2]) {
                for (let k = 0; k < 4; k++) {
                    state.gridSize = size;
                    state.difficulty = level;
                    state.dailyMode = false;
                    generatePuzzle();
                    const sols = independentCount(state.numbers, state.clueVisible, size);
                    expect(sols.length).toBe(1);
                    expect(sols[0]).toEqual(state.circles.flat().map((c) => (c.solution ? 1 : 0)));
                }
            }
        }
    });
});
