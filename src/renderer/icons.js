// ============================================================================
// ICONS - Dessin des icônes du jeu
// ============================================================================

import { getColor } from '../utils.js';
import { drawCenteredText } from './scanline.js';

/**
 * Dessine une icône avec effet scanline
 */
export function drawIcon(canvasId, type, active = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = active ? getColor() : '#333';
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;

    switch (type) {
    case 'stars':
        drawStarsIcon(ctx);
        break;
    case 'music':
        drawMusicIcon(ctx);
        break;
    case 'home':
        drawHomeIcon(ctx);
        break;
    }

    applyScanlineEffect(ctx, w, h);
}

function drawStarsIcon(ctx) {
    ctx.fillRect(23, 5, 4, 4);
    ctx.fillRect(19, 9, 12, 4);
    ctx.fillRect(11, 13, 28, 4);
    ctx.fillRect(15, 17, 20, 4);
    ctx.fillRect(19, 21, 12, 4);
    ctx.fillRect(15, 25, 8, 4);
    ctx.fillRect(27, 25, 8, 4);
    ctx.fillRect(11, 29, 8, 4);
    ctx.fillRect(31, 29, 8, 4);
}

function drawMusicIcon(ctx) {
    ctx.fillRect(28, 6, 4, 24);
    ctx.fillRect(32, 6, 10, 3);
    ctx.fillRect(32, 11, 8, 3);
    ctx.fillRect(14, 24, 18, 12);
}

function drawHomeIcon(ctx) {
    ctx.fillRect(23, 5, 4, 6);
    ctx.fillRect(15, 11, 20, 4);
    ctx.fillRect(11, 15, 28, 4);
    ctx.fillRect(14, 19, 22, 16);
    ctx.fillStyle = '#000';
    ctx.fillRect(21, 25, 8, 10);
}

function applyScanlineEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);

    for (let y = 0; y < height; y++) {
        if (y % 2 === 1) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                imageData.data[i + 3] = Math.floor(imageData.data[i + 3] * 0.3);
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Dessine toutes les icônes du jeu
 */
export function drawAllIcons(starsEnabled, musicMuted) {
    drawIcon('icon-stars', 'stars', starsEnabled);
    drawIcon('icon-music', 'music', !musicMuted);
    drawIcon('icon-home', 'home', true);
}

/**
 * Dessine une flèche de navigation
 */
export function drawArrow(canvasId, direction) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenteredText(ctx, direction === 'left' ? '<' : '>', canvas.width, 8, 4, getColor());
}