// ============================================================================
// HOWTO SCREEN - Écran d'aide
// ============================================================================

import { getColor } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';

/**
 * Dessine l'écran d'aide
 */
export function drawHowtoScreen() {
    const color = getColor();

    // Titre
    const titleCanvas = document.getElementById('howto-title');
    if (titleCanvas) {
        const ctx = titleCanvas.getContext('2d');
        ctx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
        drawCenteredText(ctx, 'HOW TO PLAY', titleCanvas.width, 10, 4, color);
    }

    // Contenu
    const contentCanvas = document.getElementById('howto-content');
    if (contentCanvas) {
        const ctx = contentCanvas.getContext('2d');
        ctx.clearRect(0, 0, contentCanvas.width, contentCanvas.height);

        const lines = [
            'TAP CIRCLES TO',
            'FILL THEM',
            '',
            'EACH NUMBER SHOWS',
            'HOW MANY NEIGHBORS',
            'ARE FILLED',
            '',
            'MATCH ALL NUMBERS',
            'TO WIN'
        ];

        lines.forEach((line, index) => {
            if (line) {
                drawCenteredText(ctx, line, contentCanvas.width, 5 + index * 34, 3, color);
            }
        });
    }

    // Bouton retour
    const backCanvas = document.getElementById('howto-back');
    if (backCanvas) {
        const ctx = backCanvas.getContext('2d');
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
        drawCenteredText(ctx, 'BACK', backCanvas.width, 10, 3, color);
    }
}
