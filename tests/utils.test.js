import { describe, it, expect } from 'vitest';
import { formatScore, formatTime, hexToRgb } from '../src/utils.js';

describe('formatScore', () => {
    it('formate les petits nombres sans espace', () => {
        expect(formatScore(100)).toBe('100');
        expect(formatScore(999)).toBe('999');
    });

    it('formate les milliers avec espace', () => {
        expect(formatScore(1000)).toBe('1 000');
        expect(formatScore(12345)).toBe('12 345');
        expect(formatScore(1000000)).toBe('1 000 000');
    });

    it('gère zéro', () => {
        expect(formatScore(0)).toBe('0');
    });
});

describe('formatTime', () => {
    it('formate les secondes en MM:SS', () => {
        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(5)).toBe('0:05');
        expect(formatTime(30)).toBe('0:30');
        expect(formatTime(60)).toBe('1:00');
        expect(formatTime(90)).toBe('1:30');
        expect(formatTime(120)).toBe('2:00');
    });
});

describe('hexToRgb', () => {
    it('convertit les couleurs hex 3 caractères', () => {
        expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#5c5')).toEqual({ r: 85, g: 204, b: 85 });
    });

    it('convertit les couleurs hex 6 caractères', () => {
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#5cc55c')).toEqual({ r: 92, g: 197, b: 92 });
    });

    it('retourne une couleur par défaut si invalide', () => {
        expect(hexToRgb('invalid')).toEqual({ r: 92, g: 204, b: 92 });
    });
});