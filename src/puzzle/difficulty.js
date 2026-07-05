// ============================================================================
// DIFFICULTY - Rareté des indices (le vrai levier de difficulté)
// ============================================================================
//
// Le jeu de base montre un nombre pour CHAQUE bloc 2x2 : la grille est
// sur-indicée et se résout par simple scan local (aucun raisonnement croisé).
// Ici on masque une partie des indices tant que la solution reste UNIQUE : le
// joueur doit alors déduire les nombres cachés en croisant les indices voisins.
//
// `numbers` reste toujours complet (win/hints/solveur inchangés) ; c'est un
// masque booléen `visible` (taille (size-1)x(size-1)) qui décide de l'affichage.

// Niveaux exposés à l'UI (index = state.difficulty)
export const DIFFICULTIES = [
    { id: 'all', label: 'ALL' }, // tous les indices (jeu d'origine, détente)
    { id: 'some', label: 'SOME' }, // rareté modérée : un peu de déduction
    { id: 'few', label: 'FEW' } // minimal : déduction maximale
];

/**
 * Profondeur de déduction visée pour un niveau et une taille de grille.
 * = nombre de cellules qu'on ne peut PAS obtenir au scan local seul.
 * @returns {number} 0 = pleins, Infinity = minimal
 */
export function targetDepthFor(level, size) {
    if (level <= 0) return 0; // ALL : on ne masque rien
    if (level >= 2) return Infinity; // FEW : on masque au maximum
    return Math.max(2, size - 2); // SOME : modéré (4->2, 5->3, 6->4)
}

/**
 * Compte les solutions compatibles avec les indices VISIBLES uniquement.
 * Backtracking cellule par cellule avec élagage par bornes ; arrêt anticipé
 * à `maxCount` (2 suffit pour tester l'unicité).
 *
 * @param {number[][]} numbers - indices complets (size-1)x(size-1)
 * @param {boolean[][]} visible - masque des indices affichés
 * @param {number} size - côté de la grille de cercles
 * @param {number} [maxCount=Infinity]
 * @returns {number}
 */
export function countSolutionsMasked(numbers, visible, size, maxCount = Infinity) {
    const cells = size * size;
    const g = new Array(cells).fill(-1);

    // Contraintes actives = blocs dont l'indice est visible
    const cons = [];
    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            if (!visible[y][x]) continue;
            cons.push({
                idx: [y * size + x, y * size + x + 1, (y + 1) * size + x, (y + 1) * size + x + 1],
                clue: numbers[y][x]
            });
        }
    }
    // Contraintes touchant chaque cellule (pour élaguer dès qu'on l'assigne)
    const byCell = Array.from({ length: cells }, () => []);
    cons.forEach((c, ci) => c.idx.forEach((i) => byCell[i].push(ci)));

    let count = 0;

    function feasible(cell) {
        for (const ci of byCell[cell]) {
            const c = cons[ci];
            let sum = 0;
            let unknown = 0;
            for (const i of c.idx) {
                const v = g[i];
                if (v === -1) unknown++;
                else sum += v;
            }
            if (sum > c.clue) return false; // déjà trop de cercles pleins
            if (sum + unknown < c.clue) return false; // plus assez de cases pour atteindre l'indice
        }
        return true;
    }

    function rec(cell) {
        if (count >= maxCount) return;
        if (cell === cells) {
            count++;
            return;
        }
        for (let v = 0; v <= 1; v++) {
            g[cell] = v;
            if (feasible(cell)) rec(cell + 1);
        }
        g[cell] = -1;
    }

    rec(0);
    return count;
}

/**
 * Vrai si les indices visibles admettent exactement UNE solution.
 */
export function hasUniqueSolutionMasked(numbers, visible, size) {
    return countSolutionsMasked(numbers, visible, size, 2) === 1;
}

/**
 * Solveur "humain naïf" : pure propagation locale, un bloc à la fois.
 * Ne remplit une case que lorsqu'un bloc la force (reste = 0 ou = nb d'inconnues).
 * Aucun raisonnement croisé, aucune hypothèse. Sert à MESURER la difficulté :
 * le nombre de cases encore inconnues = ce qu'il faut déduire "pour de vrai".
 *
 * @returns {{ unknown: number, solved: boolean }}
 */
export function scanSolve(numbers, visible, size) {
    const g = Array.from({ length: size }, () => new Array(size).fill(-1));

    const cons = [];
    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            if (!visible[y][x]) continue;
            cons.push({
                cells: [[y, x], [y, x + 1], [y + 1, x], [y + 1, x + 1]],
                clue: numbers[y][x]
            });
        }
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const c of cons) {
            let sum = 0;
            const unk = [];
            for (const [yy, xx] of c.cells) {
                const v = g[yy][xx];
                if (v === -1) unk.push([yy, xx]);
                else sum += v;
            }
            if (unk.length === 0) continue;
            const need = c.clue - sum;
            if (need === 0) {
                for (const [yy, xx] of unk) g[yy][xx] = 0;
                changed = true;
            } else if (need === unk.length) {
                for (const [yy, xx] of unk) g[yy][xx] = 1;
                changed = true;
            }
        }
    }

    let unknown = 0;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (g[y][x] === -1) unknown++;
        }
    }
    return { unknown, solved: unknown === 0 };
}

/**
 * Construit un masque de visibilité : retire des indices (ordre aléatoire) tant
 * que la solution reste unique, jusqu'à ce que le scan local laisse au moins
 * `targetDepth` cases à déduire (ou jusqu'au minimal si targetDepth = Infinity).
 *
 * @param {number[][]} numbers
 * @param {number} size
 * @param {() => number} rng - source aléatoire (déterministe pour le daily)
 * @param {number} targetDepth
 * @returns {boolean[][]} masque (size-1)x(size-1)
 */
export function reduceClues(numbers, size, rng, targetDepth) {
    const n = size - 1;
    const visible = Array.from({ length: n }, () => new Array(n).fill(true));
    if (!(targetDepth > 0)) return visible; // niveau ALL : rien à masquer

    // Ordre de retrait mélangé
    const coords = [];
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) coords.push([y, x]);
    }
    for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    for (const [y, x] of coords) {
        // Assez de déduction requise ? on s'arrête (difficulté graduée)
        if (scanSolve(numbers, visible, size).unknown >= targetDepth) break;

        visible[y][x] = false;
        // On ne garde le retrait que si l'unicité est préservée
        if (!hasUniqueSolutionMasked(numbers, visible, size)) {
            visible[y][x] = true;
        }
    }

    return visible;
}
