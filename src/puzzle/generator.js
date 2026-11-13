// ============================================================================
// GENERATOR - Génération des puzzles
// ============================================================================

import { state } from '../state.js';
import { solve, grade, TIER_FOR_LEVEL, HIDE_RATIO_FOR_LEVEL } from './logic.js';

// Proportion de cercles remplis dans la solution (le nœud)
const FILL_DENSITY = 0.42;
// Garde-fou : nombre max de tentatives pour atteindre le niveau visé
const MAX_ATTEMPTS = 40;
// Difficulté imposée au puzzle du jour (fixe pour tous : NORMAL)
const DAILY_DIFFICULTY = 1;

/** Voisins orthogonaux d'un index à plat */
function neighbors(i, size) {
    const x = i % size;
    const y = (i - x) / size;
    const out = [];
    if (x > 0) out.push(i - 1);
    if (x < size - 1) out.push(i + 1);
    if (y > 0) out.push(i - size);
    if (y < size - 1) out.push(i + size);
    return out;
}

/**
 * Tire un nœud aléatoire : un groupe de cercles relié, plutôt filiforme
 * (on favorise les cases qui ne touchent qu'un seul rempli -> branches,
 * moins de gros pâtés de 4) pour varier les indices.
 * @returns {number[]} 0/1 à plat
 */
export function randomKnot(size, rng) {
    const n = size * size;
    const target = Math.round(n * FILL_DENSITY);
    const f = new Array(n).fill(0);
    f[Math.floor(rng() * n)] = 1;

    for (let count = 1; count < target; count++) {
        const frontier = [];
        let total = 0;
        for (let i = 0; i < n; i++) {
            if (f[i]) continue;
            const deg = neighbors(i, size).filter((j) => f[j]).length;
            if (deg === 0) continue;
            const w = deg === 1 ? 4 : deg === 2 ? 0.7 : 0.1;
            frontier.push([i, w]);
            total += w;
        }
        let t = rng() * total;
        let pick = frontier[frontier.length - 1][0];
        for (const [i, w] of frontier) {
            t -= w;
            if (t <= 0) {
                pick = i;
                break;
            }
        }
        f[pick] = 1;
    }
    return f;
}

/** Indices complets d'une solution (somme de chaque bloc 2x2) */
export function computeNumbers(sol, size) {
    const numbers = [];
    for (let y = 0; y < size - 1; y++) {
        numbers[y] = [];
        for (let x = 0; x < size - 1; x++) {
            const i = y * size + x;
            numbers[y][x] = sol[i] + sol[i + 1] + sol[i + size] + sol[i + size + 1];
        }
    }
    return numbers;
}

/**
 * Masque des indices tant que le puzzle reste résoluble avec le niveau de
 * raisonnement `maxTier` (donc à solution unique), sans dépasser la part
 * `maxRatio` d'indices cachés.
 */
export function hideClues(numbers, size, rng, maxTier, maxRatio = 1) {
    const visible = numbers.map((row) => row.map(() => true));
    const maxHidden = Math.round(numbers.length * numbers.length * maxRatio);
    let hidden = 0;
    const order = [];
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) order.push([y, x]);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    for (const [y, x] of order) {
        if (hidden >= maxHidden) break;
        visible[y][x] = false;
        if (solve(numbers, visible, size, maxTier).solved) hidden++;
        else visible[y][x] = true;
    }
    return visible;
}

/**
 * Génère un puzzle à solution unique dont la difficulté réelle (niveau de
 * raisonnement nécessaire) correspond au niveau choisi.
 *
 * @param {() => number} [rng=Math.random] - source aléatoire (déterministe pour le daily)
 */
export function generatePuzzle(rng = Math.random) {
    const size = state.gridSize;
    const level = state.dailyMode ? DAILY_DIFFICULTY : state.difficulty;
    const target = TIER_FOR_LEVEL[level] ?? 2;
    const ratio = HIDE_RATIO_FOR_LEVEL[level] ?? 1;
    state.history = [];

    let best = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const sol = randomKnot(size, rng);
        const numbers = computeNumbers(sol, size);
        const all = numbers.map((row) => row.map(() => true));
        // Même avec tous les indices, la solution doit être déductible
        // (dernière tentative : on garde quoi qu'il arrive pour ne jamais échouer)
        if (grade(numbers, all, size) > target && (best || attempt < MAX_ATTEMPTS - 1)) continue;

        const visible = hideClues(numbers, size, rng, target, ratio);
        const candidate = { sol, numbers, visible, tier: grade(numbers, visible, size) };
        if (candidate.tier === target) {
            best = candidate;
            break;
        }
        if (!best || candidate.tier > best.tier) best = candidate;
    }

    state.numbers = best.numbers;
    state.clueVisible = best.visible;
    state.circles = [];
    for (let y = 0; y < size; y++) {
        state.circles[y] = [];
        for (let x = 0; x < size; x++) {
            state.circles[y][x] = { filled: false, solution: best.sol[y * size + x] === 1 };
        }
    }
}

/**
 * Vérifie si le puzzle est résolu.
 * La solution est unique (indices visibles + règle du nœud) : gagner = la retrouver.
 */
export function checkWin() {
    const size = state.gridSize;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (state.circles[y][x].filled !== state.circles[y][x].solution) return false;
        }
    }
    return true;
}

/**
 * Bascule l'état d'un cercle
 */
export function toggleCircle(x, y) {
    if (x >= 0 && x < state.gridSize && y >= 0 && y < state.gridSize) {
        state.circles[y][x].filled = !state.circles[y][x].filled;
        state.history?.push({ x, y });
        triggerAnimation(x, y);
        return true;
    }
    return false;
}

/**
 * Annule le dernier coup. @returns {boolean} vrai si un coup a été annulé
 */
export function undoMove() {
    const last = state.history.pop();
    if (!last) return false;
    state.circles[last.y][last.x].filled = !state.circles[last.y][last.x].filled;
    triggerAnimation(last.x, last.y);
    return true;
}

/**
 * Vide la grille (recommencer le puzzle en cours).
 * @returns {boolean} vrai si quelque chose a changé
 */
export function resetBoard() {
    let changed = false;
    for (const row of state.circles) {
        for (const c of row) {
            if (c.filled) {
                c.filled = false;
                changed = true;
            }
        }
    }
    state.history = [];
    return changed;
}

/**
 * Déclenche une animation sur un cercle
 */
export function triggerAnimation(x, y) {
    state.animations = state.animations.filter((a) => !(a.x === x && a.y === y));
    state.animations.push({ x, y, progress: 0 });
}

/**
 * Met à jour les animations
 */
export function updateAnimations() {
    if (state.animations.length > 0) {
        state.animations.forEach((a) => (a.progress += 0.08));
        state.animations = state.animations.filter((a) => a.progress < 1);
        return true; // Indique qu'il faut redessiner
    }
    return false;
}

/**
 * Démarre l'animation melt (victoire)
 */
export function startMelt() {
    state.meltActive = true;
    state.meltProgress = 0;
    state.meltPhase = 0;
}

/**
 * Met à jour l'animation melt
 * Retourne true si l'animation est terminée
 */
export function updateMelt() {
    if (!state.meltActive) return false;

    state.meltProgress += 0.05;

    if (state.meltPhase === 0 && state.meltProgress >= 1) {
        // Passe au fade out
        state.meltPhase = 1;
        state.meltProgress = 0;
    } else if (state.meltPhase === 1 && state.meltProgress >= 1) {
        // Animation terminée
        state.meltActive = false;
        state.meltProgress = 0;
        state.meltPhase = 0;
        return true;
    }

    return false;
}
