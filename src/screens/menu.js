// ============================================================================
// MENU SCREEN - Écran du menu principal
// ============================================================================

import { state } from '../state.js';
import { getColor, hexToRgb } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';

/**
 * Dessine l'écran du menu principal
 */
export function drawMenuScreen() {
    const color = getColor();
    const rgb = hexToRgb(color);
    const dimColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`;

    // scale 4 = actions principales, 3 = secondaires, 2 = réglages (estompés)
    const items = [
        { id: 'menu-daily', text: 'DAILY PUZZLE', scale: 4, y: 12 },
        { id: 'menu-newgame', text: 'NEW GAME', scale: 4, y: 12 },
        { id: 'menu-leaderboard', text: 'LEADERBOARD', scale: 3, y: 12 },
        { id: 'menu-howto', text: 'HOW TO PLAY', scale: 3, y: 12 },
        { id: 'menu-nickname', text: `NAME ${state.nickname}`, scale: 2, y: 9, dim: true },
        { id: 'menu-color', text: 'COLOR', scale: 2, y: 9, dim: true }
    ];

    items.forEach((item) => {
        const canvas = document.getElementById(item.id);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenteredText(ctx, item.text, canvas.width, item.y, item.scale, item.dim ? dimColor : color);
    });
}
