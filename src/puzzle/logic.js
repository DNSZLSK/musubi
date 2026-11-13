// ============================================================================
// LOGIC - Règles, solveur "humain" gradué et notation de difficulté
// ============================================================================
//
// Règles du puzzle :
//   1. chaque indice VISIBLE = nombre de cercles remplis dans son bloc 2x2 ;
//   2. tous les cercles remplis forment UN SEUL groupe relié (orthogonalement,
//      le long des traits) : le "nœud" (musubi).
//
// La règle 2 est globale : elle oblige à raisonner sur toute la grille et
// permet de cacher beaucoup plus d'indices en gardant une solution unique.
//
// Le solveur n'applique que des déductions sûres, classées par niveau :
//   T1  un bloc seul (reste 0 / reste = inconnues) + cercle injoignable -> vide
//   T2  deux blocs qui se chevauchent + point de passage obligé du nœud
//   T3  hypothèse sur un cercle -> contradiction via T1/T2 -> l'autre valeur
// Si le solveur termine la grille, la solution est unique (déductions sûres).

const UNKNOWN = -1;

/** Niveau de raisonnement maximal autorisé, par difficulté (index = state.difficulty) */
export const TIER_FOR_LEVEL = [1, 2, 3];

/**
 * Construit la liste des contraintes (blocs 2x2 visibles).
 * @param {number[][]} numbers - (size-1)x(size-1)
 * @param {boolean[][]} visible - même taille
 * @param {number} size
 */
export function buildConstraints(numbers, visible, size) {
    const cons = [];
    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            if (!visible[y][x]) continue;
            const i = y * size + x;
            cons.push({ cells: [i, i + 1, i + size, i + size + 1], clue: numbers[y][x], x, y });
        }
    }
    return cons;
}

/** Voisins orthogonaux (index à plat) */
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
 * Composantes de (remplis ∪ inconnus), en ignorant éventuellement une case.
 * @returns {Int32Array} id de composante par case (-1 = vide / ignorée)
 */
function components(g, size, skip = -1) {
    const n = size * size;
    const comp = new Int32Array(n).fill(-1);
    let id = 0;
    const stack = [];
    for (let s = 0; s < n; s++) {
        if (comp[s] !== -1 || g[s] === 0 || s === skip) continue;
        comp[s] = id;
        stack.push(s);
        while (stack.length) {
            const c = stack.pop();
            for (const nb of neighbors(c, size)) {
                if (comp[nb] === -1 && g[nb] !== 0 && nb !== skip) {
                    comp[nb] = id;
                    stack.push(nb);
                }
            }
        }
        id++;
    }
    return comp;
}

/** Vrai si tous les remplis connus tiennent dans une seule composante. */
function filledConnected(g, comp) {
    let id = -1;
    for (let i = 0; i < g.length; i++) {
        if (g[i] !== 1) continue;
        if (comp[i] === -1) return false;
        if (id === -1) id = comp[i];
        else if (comp[i] !== id) return false;
    }
    return true;
}

// --- Techniques -------------------------------------------------------------
// Chaque technique renvoie : -1 contradiction, 0 rien, 1 progrès.

function set(g, i, v) {
    g[i] = v;
}

/** T1 : un bloc seul */
function singleBlock(g, cons) {
    let progress = 0;
    for (const c of cons) {
        let sum = 0;
        let unk = 0;
        for (const i of c.cells) {
            if (g[i] === UNKNOWN) unk++;
            else sum += g[i];
        }
        const need = c.clue - sum;
        if (need < 0 || need > unk) return -1;
        if (unk === 0) continue;
        if (need === 0 || need === unk) {
            for (const i of c.cells) if (g[i] === UNKNOWN) set(g, i, need === 0 ? 0 : 1);
            progress = 1;
        }
    }
    return progress;
}

/** T1 : cercle qui ne peut pas rejoindre le nœud -> vide (+ détection de cassure) */
function unreachable(g, size) {
    const comp = components(g, size);
    let anchor = -1;
    for (let i = 0; i < g.length; i++) {
        if (g[i] === 1) {
            anchor = comp[i];
            break;
        }
    }
    if (!filledConnected(g, comp)) return -1;
    if (anchor === -1) {
        // Aucun rempli connu : contradiction seulement si tout est vide
        return g.every((v) => v === 0) ? -1 : 0;
    }
    let progress = 0;
    for (let i = 0; i < g.length; i++) {
        if (g[i] === UNKNOWN && comp[i] !== anchor) {
            set(g, i, 0);
            progress = 1;
        }
    }
    return progress;
}

/** T2 : deux blocs qui se chevauchent (raisonnement sur la zone commune) */
function blockPairs(g, cons, pairs) {
    let progress = 0;
    for (const [a, b] of pairs) {
        const A = cons[a];
        const B = cons[b];
        let needA = A.clue;
        let needB = B.clue;
        const onlyA = [];
        const onlyB = [];
        const shared = [];
        for (const i of A.cells) {
            if (g[i] === UNKNOWN) (B.cells.includes(i) ? shared : onlyA).push(i);
            else needA -= g[i];
        }
        for (const i of B.cells) {
            if (g[i] === UNKNOWN) {
                if (!A.cells.includes(i)) onlyB.push(i);
            } else needB -= g[i];
        }
        if (shared.length === 0) continue;
        // Bornes de la somme sur la zone commune, vues des deux blocs
        const lo = Math.max(0, needA - onlyA.length, needB - onlyB.length);
        const hi = Math.min(shared.length, needA, needB);
        if (lo > hi) return -1;
        const fill = (cells, v) => {
            for (const i of cells) set(g, i, v);
            if (cells.length) progress = 1;
        };
        if (hi === 0) fill(shared, 0);
        else if (lo === shared.length) fill(shared, 1);
        // Ce qui reste hors zone commune
        if (needA - lo <= 0) fill(onlyA, 0);
        else if (needA - hi >= onlyA.length) fill(onlyA, 1);
        if (needB - lo <= 0) fill(onlyB, 0);
        else if (needB - hi >= onlyB.length) fill(onlyB, 1);
        if (progress) return 1; // repartir des techniques simples
    }
    return progress;
}

/** T2 : point de passage obligé (le vider couperait le nœud) -> rempli */
function articulation(g, size) {
    let hasFilled = false;
    for (let i = 0; i < g.length; i++) if (g[i] === 1) hasFilled = true;
    if (!hasFilled) return 0;
    for (let i = 0; i < g.length; i++) {
        if (g[i] !== UNKNOWN) continue;
        if (!filledConnected(g, components(g, size, i))) {
            set(g, i, 1);
            return 1;
        }
    }
    return 0;
}

/** Paires de blocs visibles qui partagent au moins un cercle */
function overlappingPairs(cons) {
    const pairs = [];
    for (let a = 0; a < cons.length; a++) {
        for (let b = a + 1; b < cons.length; b++) {
            if (Math.abs(cons[a].x - cons[b].x) <= 1 && Math.abs(cons[a].y - cons[b].y) <= 1) {
                pairs.push([a, b]);
            }
        }
    }
    return pairs;
}

/**
 * Propage jusqu'au point fixe avec les techniques <= maxTier.
 * Repart toujours de la technique la plus simple après un progrès.
 * @returns {{ ok: boolean, tier: number }} tier = niveau le plus élevé réellement utilisé
 */
function propagate(g, size, cons, pairs, maxTier) {
    let tier = 0;
    for (;;) {
        let r = singleBlock(g, cons);
        if (r < 0) return { ok: false, tier };
        if (r > 0) {
            tier = Math.max(tier, 1);
            continue;
        }
        r = unreachable(g, size);
        if (r < 0) return { ok: false, tier };
        if (r > 0) {
            tier = Math.max(tier, 1);
            continue;
        }
        if (maxTier < 2) break;
        r = blockPairs(g, cons, pairs);
        if (r < 0) return { ok: false, tier };
        if (r > 0) {
            tier = 2;
            continue;
        }
        r = articulation(g, size);
        if (r > 0) {
            tier = 2;
            continue;
        }
        if (maxTier < 3) break;
        r = trial(g, size, cons, pairs);
        if (r < 0) return { ok: false, tier };
        if (r > 0) {
            tier = 3;
            continue;
        }
        break;
    }
    return { ok: true, tier };
}

/** T3 : hypothèse sur un cercle ; si elle mène à une contradiction (T1/T2), on prend l'autre */
function trial(g, size, cons, pairs) {
    for (let i = 0; i < g.length; i++) {
        if (g[i] !== UNKNOWN) continue;
        for (const v of [1, 0]) {
            const copy = g.slice();
            copy[i] = v;
            if (!propagate(copy, size, cons, pairs, 2).ok) {
                g[i] = 1 - v;
                return 1;
            }
        }
    }
    return 0;
}

/**
 * Résout avec un niveau de raisonnement maximal.
 * @returns {{ solved: boolean, ok: boolean, tier: number, grid: Int8Array }}
 */
export function solve(numbers, visible, size, maxTier = 3) {
    const cons = buildConstraints(numbers, visible, size);
    const pairs = overlappingPairs(cons);
    const g = new Int8Array(size * size).fill(UNKNOWN);
    const { ok, tier } = propagate(g, size, cons, pairs, maxTier);
    const solved = ok && !g.includes(UNKNOWN);
    return { solved, ok, tier, grid: g };
}

/**
 * Difficulté réelle d'un puzzle = plus petit niveau de raisonnement qui le termine.
 * @returns {number} 1, 2, 3 ou Infinity (non résoluble sans deviner)
 */
export function grade(numbers, visible, size) {
    for (let t = 1; t <= 3; t++) {
        if (solve(numbers, visible, size, t).solved) return t;
    }
    return Infinity;
}

/**
 * Vrai si la grille de booléens respecte la règle du nœud (un seul groupe relié, non vide).
 * @param {boolean[][]} filled - [y][x]
 */
export function isConnected(filled) {
    const size = filled.length;
    const g = new Int8Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) g[y * size + x] = filled[y][x] ? 1 : 0;
    if (!g.includes(1)) return false;
    return filledConnected(g, components(g, size));
}

/**
 * Groupe principal du nœud en cours de construction : la plus grande composante
 * de cercles remplis. Sert à montrer au joueur les morceaux détachés.
 * @param {boolean[][]} filled - [y][x]
 * @returns {boolean[][]} vrai si le cercle rempli appartient au groupe principal
 */
export function mainGroup(filled) {
    const size = filled.length;
    const out = filled.map((row) => row.map(() => false));
    const seen = filled.map((row) => row.map(() => false));
    let best = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (!filled[y][x] || seen[y][x]) continue;
            const group = [];
            const stack = [[x, y]];
            seen[y][x] = true;
            while (stack.length) {
                const [cx, cy] = stack.pop();
                group.push([cx, cy]);
                for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
                    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                    if (filled[ny][nx] && !seen[ny][nx]) {
                        seen[ny][nx] = true;
                        stack.push([nx, ny]);
                    }
                }
            }
            if (group.length > best.length) best = group;
        }
    }
    for (const [x, y] of best) out[y][x] = true;
    return out;
}
