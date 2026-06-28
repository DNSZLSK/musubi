import { describe, it, expect } from 'vitest';
import { countSolutions, hasUniqueSolution } from '../src/puzzle/solver.js';

describe('countSolutions', () => {
    it('1 solution pour une grille 2x2 vide (indice 0)', () => {
        // seule la grille toute vide somme à 0
        expect(countSolutions([[0]], 2)).toBe(1);
    });

    it('1 solution pour une grille 2x2 pleine (indice 4)', () => {
        // seule la grille toute pleine somme à 4
        expect(countSolutions([[4]], 2)).toBe(1);
    });

    it('6 solutions pour un indice 2x2 = 2', () => {
        // C(4,2) = 6 façons de remplir 2 cercles parmi 4
        expect(countSolutions([[2]], 2)).toBe(6);
    });

    it('4 solutions pour un indice 2x2 = 1', () => {
        expect(countSolutions([[1]], 2)).toBe(4);
    });

    it('respecte maxCount (arrêt anticipé)', () => {
        expect(countSolutions([[2]], 2, 2)).toBe(2);
    });
});

describe('hasUniqueSolution', () => {
    it('vrai quand une seule solution existe', () => {
        expect(hasUniqueSolution([[0]], 2)).toBe(true);
        expect(hasUniqueSolution([[4]], 2)).toBe(true);
    });

    it('faux quand plusieurs solutions existent', () => {
        expect(hasUniqueSolution([[2]], 2)).toBe(false);
        expect(hasUniqueSolution([[1]], 2)).toBe(false);
    });
});
