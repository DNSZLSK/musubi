import { describe, it, expect } from 'vitest';
import { hashSeed, mulberry32, seededRng } from '../src/puzzle/rng.js';

describe('hashSeed', () => {
    it('est déterministe', () => {
        expect(hashSeed('2026-06-28')).toBe(hashSeed('2026-06-28'));
    });

    it('diffère selon l\'entrée', () => {
        expect(hashSeed('2026-06-28')).not.toBe(hashSeed('2026-06-29'));
    });

    it('renvoie un entier non signé 32 bits', () => {
        const h = hashSeed('hello');
        expect(Number.isInteger(h)).toBe(true);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(0xffffffff);
    });
});

describe('mulberry32', () => {
    it('produit la même suite pour la même graine', () => {
        const a = mulberry32(12345);
        const b = mulberry32(12345);
        const seqA = [a(), a(), a(), a()];
        const seqB = [b(), b(), b(), b()];
        expect(seqA).toEqual(seqB);
    });

    it('reste dans [0, 1)', () => {
        const r = mulberry32(1);
        for (let i = 0; i < 1000; i++) {
            const v = r();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });
});

describe('seededRng', () => {
    it('même clé => même première valeur', () => {
        expect(seededRng('2026-06-28')()).toBe(seededRng('2026-06-28')());
    });
});
