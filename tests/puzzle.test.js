import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../src/state.js';
import { generatePuzzle, checkWin, toggleCircle } from '../src/puzzle/generator.js';

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
});

describe('checkWin', () => {
    beforeEach(() => {
        state.gridSize = 2;
        state.circles = [
            [{ filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }]
        ];
        state.numbers = [[0]];
    });

    it('retourne true quand le puzzle est résolu', () => {
        // Aucun cercle rempli, nombre = 0 -> victoire
        state.numbers = [[0]];
        expect(checkWin()).toBe(true);
    });

    it('retourne false quand le puzzle n\'est pas résolu', () => {
        state.numbers = [[2]]; // On attend 2 cercles remplis
        expect(checkWin()).toBe(false);
    });

    it('compte correctement les cercles remplis', () => {
        state.numbers = [[2]];
        state.circles[0][0].filled = true;
        state.circles[0][1].filled = true;
        expect(checkWin()).toBe(true);
    });

    it('vérifie les 4 coins autour de chaque nombre', () => {
        state.numbers = [[4]];
        state.circles[0][0].filled = true;
        state.circles[0][1].filled = true;
        state.circles[1][0].filled = true;
        state.circles[1][1].filled = true;
        expect(checkWin()).toBe(true);
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