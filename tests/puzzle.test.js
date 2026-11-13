import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../src/state.js';
import { generatePuzzle, checkWin, toggleCircle } from '../src/puzzle/generator.js';
import { grade, isConnected, TIER_FOR_LEVEL } from '../src/puzzle/logic.js';

describe('generatePuzzle', () => {
    beforeEach(() => {
        state.gridSize = 4;
        state.circles = [];
        state.numbers = [];
    });

    it('génère une grille de la bonne taille', () => {
        generatePuzzle();
        
        expect(state.circles.length).toBe(4);
        expect(state.circles[0].length).toBe(4);
    });

    it('génère des nombres de la bonne taille', () => {
        generatePuzzle();
        
        // Les nombres sont entre les cercles, donc gridSize - 1
        expect(state.numbers.length).toBe(3);
        expect(state.numbers[0].length).toBe(3);
    });

    it('génère des nombres entre 0 et 4', () => {
        generatePuzzle();
        
        for (let y = 0; y < state.numbers.length; y++) {
            for (let x = 0; x < state.numbers[y].length; x++) {
                expect(state.numbers[y][x]).toBeGreaterThanOrEqual(0);
                expect(state.numbers[y][x]).toBeLessThanOrEqual(4);
            }
        }
    });

    it('fonctionne avec différentes tailles de grille', () => {
        state.gridSize = 5;
        generatePuzzle();
        expect(state.circles.length).toBe(5);
        expect(state.numbers.length).toBe(4);

        state.gridSize = 6;
        generatePuzzle();
        expect(state.circles.length).toBe(6);
        expect(state.numbers.length).toBe(5);
    });

    it('génère des puzzles déductibles (donc uniques) au niveau demandé', () => {
        for (const size of [4, 5, 6]) {
            state.gridSize = size;
            for (const level of [0, 1, 2]) {
                state.difficulty = level;
                for (let i = 0; i < 5; i++) {
                    generatePuzzle();
                    const tier = grade(state.numbers, state.clueVisible, size);
                    expect(tier).toBeLessThanOrEqual(TIER_FOR_LEVEL[level]);
                    // la solution générée n'est jamais la grille vide (puzzle non trivial)
                    expect(checkWin()).toBe(false);
                }
            }
        }
    });

    it('la solution forme un seul nœud relié', () => {
        state.gridSize = 6;
        for (let i = 0; i < 20; i++) {
            generatePuzzle();
            expect(isConnected(state.circles.map((r) => r.map((c) => c.solution)))).toBe(true);
        }
    });

    it('cache des indices (sinon la règle du nœud ne sert à rien)', () => {
        state.gridSize = 6;
        state.difficulty = 1;
        let hidden = 0;
        for (let i = 0; i < 10; i++) {
            generatePuzzle();
            hidden += state.clueVisible.flat().filter((v) => !v).length;
        }
        expect(hidden / 10).toBeGreaterThan(6);
    });

    it('le daily est déterministe pour une même graine', () => {
        const seeded = (seed) => () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };
        state.gridSize = 5;
        state.dailyMode = true;
        generatePuzzle(seeded(42));
        const a = JSON.stringify([state.numbers, state.clueVisible]);
        generatePuzzle(seeded(42));
        const b = JSON.stringify([state.numbers, state.clueVisible]);
        state.dailyMode = false;
        expect(a).toBe(b);
    });
});

describe('checkWin', () => {
    beforeEach(() => {
        state.gridSize = 2;
        state.circles = [
            [{ filled: false, solution: true }, { filled: false, solution: true }],
            [{ filled: false, solution: false }, { filled: false, solution: false }]
        ];
    });

    it('retourne false tant que la grille diffère de la solution', () => {
        expect(checkWin()).toBe(false);
        state.circles[0][0].filled = true;
        expect(checkWin()).toBe(false);
    });

    it('retourne true quand la grille correspond à la solution', () => {
        state.circles[0][0].filled = true;
        state.circles[0][1].filled = true;
        expect(checkWin()).toBe(true);
    });

    it('retourne false si un cercle de trop est rempli', () => {
        state.circles[0][0].filled = true;
        state.circles[0][1].filled = true;
        state.circles[1][1].filled = true;
        expect(checkWin()).toBe(false);
    });
});

describe('toggleCircle', () => {
    beforeEach(() => {
        state.gridSize = 3;
        state.circles = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        state.animations = [];
    });

    it('bascule un cercle de false à true', () => {
        toggleCircle(0, 0);
        expect(state.circles[0][0].filled).toBe(true);
    });

    it('bascule un cercle de true à false', () => {
        state.circles[1][1].filled = true;
        toggleCircle(1, 1);
        expect(state.circles[1][1].filled).toBe(false);
    });

    it('retourne true si le clic est valide', () => {
        expect(toggleCircle(0, 0)).toBe(true);
    });

    it('retourne false si le clic est hors limites', () => {
        expect(toggleCircle(-1, 0)).toBe(false);
        expect(toggleCircle(0, -1)).toBe(false);
        expect(toggleCircle(3, 0)).toBe(false);
        expect(toggleCircle(0, 3)).toBe(false);
    });

    it('ajoute une animation', () => {
        toggleCircle(1, 2);
        expect(state.animations.length).toBe(1);
        expect(state.animations[0]).toEqual({ x: 1, y: 2, progress: 0 });
    });
});
describe('crescendo de difficulté', () => {
    it('chaque niveau cache plus d’indices que le précédent (6x6)', () => {
        state.gridSize = 6;
        state.dailyMode = false;
        const avg = [0, 1, 2].map((level) => {
            state.difficulty = level;
            let hidden = 0;
            for (let i = 0; i < 12; i++) {
                generatePuzzle();
                hidden += state.clueVisible.flat().filter((v) => !v).length;
            }
            return hidden / 12;
        });
        expect(avg[0]).toBeLessThanOrEqual(5);
        expect(avg[1]).toBeGreaterThan(avg[0]);
        expect(avg[2]).toBeGreaterThan(avg[1]);
    });
});
