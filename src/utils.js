// ============================================================================
// UTILS - Fonctions utilitaires
// ============================================================================

/**
 * Récupère la couleur du thème actuel
 */
export function getColor() {
    return getComputedStyle(document.body).getPropertyValue('--color').trim() || '#5c5';
}

/**
 * Récupère la couleur claire du thème actuel
 */
export function getBrightColor() {
    return getComputedStyle(document.body).getPropertyValue('--color-bright').trim() || '#7f7';
}

/**
 * Convertit une couleur hex en RGB
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(hex);

    if (!result) {
        return { r: 92, g: 204, b: 92 };
    }

    return {
        r: parseInt(result[1].length === 1 ? result[1] + result[1] : result[1], 16),
        g: parseInt(result[2].length === 1 ? result[2] + result[2] : result[2], 16),
        b: parseInt(result[3].length === 1 ? result[3] + result[3] : result[3], 16)
    };
}

/**
 * Formate un score avec des espaces (ex: 1000 -> "1 000")
 */
export function formatScore(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formate le temps en MM:SS
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
