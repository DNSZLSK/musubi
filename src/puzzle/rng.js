// ============================================================================
// RNG - Générateur pseudo-aléatoire déterministe (puzzles « daily »)
// ============================================================================
//
// Permet de produire une suite aléatoire reproductible à partir d'une graine.
// Combiné au solveur d'unicité, deux joueurs avec la même date obtiennent
// exactement le même puzzle.

/**
 * Hash 32 bits d'une chaîne (variante xmur3).
 * @param {string} str
 * @returns {number} entier non signé 32 bits
 */
export function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
}

/**
 * PRNG mulberry32 : renvoie une fonction () => float dans [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * RNG déterministe à partir d'une clé texte (ex. une date 'YYYY-MM-DD').
 * @param {string} key
 * @returns {() => number}
 */
export function seededRng(key) {
    return mulberry32(hashSeed('musubi-' + key));
}
