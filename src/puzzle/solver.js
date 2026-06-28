// ============================================================================
// SOLVER - Comptage de solutions / vérification d'unicité d'un puzzle
// ============================================================================
//
// Un puzzle est entièrement défini par ses indices (numbers). Plusieurs
// configurations de cercles peuvent satisfaire les mêmes indices : ce module
// permet de savoir combien, afin de ne générer que des puzzles à solution unique.
//
// Méthode (pas de brute-force 2^(size²)) : la 1re rangée est libre (2^size),
// puis chaque rangée est entièrement déterminée par la rangée du dessus + 1 bit
// libre. L'espace exploré est donc borné par ~2^(2·size−1) (≤ 2048 en 6×6).

/**
 * Compte le nombre de configurations satisfaisant tous les indices.
 * S'arrête dès que `maxCount` est atteint (utile pour tester l'unicité).
 *
 * @param {number[][]} numbers - indices (size−1)×(size−1)
 * @param {number} size - côté de la grille de cercles
 * @param {number} [maxCount=Infinity] - arrêt anticipé
 * @returns {number} nombre de solutions (plafonné à maxCount)
 */
export function countSolutions(numbers, size, maxCount = Infinity) {
    const grid = Array.from({ length: size }, () => new Array(size));
    let count = 0;

    function extend(r) {
        if (r === size) {
            count++;
            return;
        }
        for (let first = 0; first <= 1 && count < maxCount; first++) {
            grid[r][0] = first;
            let ok = true;
            for (let j = 0; j < size - 1; j++) {
                // somme du carré 2×2 = numbers[r-1][j] → en déduit le cercle suivant
                const v =
                    numbers[r - 1][j] - grid[r - 1][j] - grid[r - 1][j + 1] - grid[r][j];
                if (v !== 0 && v !== 1) {
                    ok = false;
                    break;
                }
                grid[r][j + 1] = v;
            }
            if (ok) extend(r + 1);
        }
    }

    for (let row0 = 0; row0 < (1 << size) && count < maxCount; row0++) {
        for (let x = 0; x < size; x++) grid[0][x] = (row0 >> x) & 1;
        extend(1);
    }

    return count;
}

/**
 * Vrai si les indices admettent exactement UNE solution.
 */
export function hasUniqueSolution(numbers, size) {
    return countSolutions(numbers, size, 2) === 1;
}
