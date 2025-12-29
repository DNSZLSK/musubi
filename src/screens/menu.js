// ============================================================================
// MENU SCREEN - Écran du menu principal
// ============================================================================

import { getColor } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';

/**
 * Dessine l'écran du menu principal
 */
export function drawMenuScreen() {
    const color = getColor();

    const items = [
        { id: 'menu-newgame', text: 'NEW GAME' },
        { id: 'menu-leaderboard', text: 'LEADERBOARD' },
        { id: 'menu-nickname', text: 'YOUR NICKNAME' },
        { id: 'menu-howto', text: 'HOW TO PLAY' },
        { id: 'menu-color', text: 'COLOR' }
    ];

    items.forEach((item) => {
        const canvas = document.getElementById(item.id);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenteredText(ctx, item.text, canvas.width, 12, 3, color);
    });
}
