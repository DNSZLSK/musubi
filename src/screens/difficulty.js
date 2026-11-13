// ============================================================================
// DIFFICULTY SCREEN - Écran de sélection du mode
// ============================================================================

import { state } from '../state.js';
import { getColor } from '../utils.js';
import { DIFFICULTIES } from '../puzzle/difficulty.js';
import {
    drawCenteredText,
    drawScanlineText,
    getTextWidth,
    drawScanlineRect
} from '../renderer/scanline.js';

/**
 * Dessine l'écran de sélection de difficulté
 */
export function drawDifficultyScreen() {
    const color = getColor();

    // Titre
    const titleCanvas = document.getElementById('diff-title');
    if (titleCanvas) {
        const ctx = titleCanvas.getContext('2d');
        ctx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
        drawCenteredText(ctx, 'SELECT MODE', titleCanvas.width, 10, 4, color);
    }

    // Libellé au-dessus des tailles : ce sont des boutons qui LANCENT la partie
    const playLabel = document.getElementById('diff-play-label');
    if (playLabel) {
        const ctx = playLabel.getContext('2d');
        ctx.clearRect(0, 0, playLabel.width, playLabel.height);
        drawCenteredText(ctx, 'PLAY', playLabel.width, 4, 3, color);
    }

    // Boutons de taille (encadrés)
    const sizes = [
        { id: 'diff-training', text: '4X4' },
        { id: 'diff-challenge', text: '5X5' },
        { id: 'diff-expert', text: '6X6' }
    ];
    sizes.forEach((btn) => {
        const canvas = document.getElementById(btn.id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrame(ctx, canvas.width, canvas.height, color);
        drawCenteredText(ctx, btn.text, canvas.width, 21, 4, color);
    });

    const back = document.getElementById('diff-back');
    if (back) {
        const ctx = back.getContext('2d');
        ctx.clearRect(0, 0, back.width, back.height);
        drawCenteredText(ctx, 'BACK', back.width, 12, 3, color);
    }

    // Toggle chrono
    drawChronoToggle('chrono-toggle', state.chronoEnabled);

    // Sélecteur de difficulté (niveau de raisonnement)
    drawCluesToggle('diff-level', state.difficulty);
}

/**
 * Cadre scanline (contour de 3 px) autour d'un bouton
 */
function drawFrame(ctx, w, h, color) {
    ctx.fillStyle = color;
    const t = 3;
    for (let y = 0; y < h; y++) {
        if (y % 2 !== 0) continue;
        if (y < t || y >= h - t) {
            ctx.fillRect(0, y, w, 1);
        } else {
            ctx.fillRect(0, y, t, 1);
            ctx.fillRect(w - t, y, t, 1);
        }
    }
}

/**
 * Dessine le toggle chrono (réutilisable)
 */
export function drawChronoToggle(canvasId, isOn) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = getColor();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelSize = 3;
    const offWidth = getTextWidth('OFF', pixelSize);
    const onWidth = getTextWidth('ON', pixelSize);
    const boxPad = 4;
    const textHeight = 7 * pixelSize;
    const chronoLabelWidth = getTextWidth('CHRONO', pixelSize);
    const gap = 18;

    const totalWidth = chronoLabelWidth + gap + offWidth + boxPad * 2 + gap + onWidth + boxPad * 2;
    const startX = (canvas.width - totalWidth) / 2;
    const y = 12;

    // Label "CHRONO"
    drawScanlineText(ctx, 'CHRONO', startX, y, pixelSize, color);

    const offBoxX = startX + chronoLabelWidth + gap;
    const onBoxX = offBoxX + offWidth + boxPad * 2 + gap;

    if (!isOn) {
        // OFF sélectionné
        drawScanlineRect(
            ctx,
            offBoxX - boxPad,
            y - boxPad,
            offWidth + boxPad * 2,
            textHeight + boxPad * 2,
            color
        );
        drawScanlineText(ctx, 'OFF', offBoxX, y, pixelSize, '#000');
        drawScanlineText(ctx, 'ON', onBoxX, y, pixelSize, color);
    } else {
        // ON sélectionné
        drawScanlineText(ctx, 'OFF', offBoxX, y, pixelSize, color);
        drawScanlineRect(
            ctx,
            onBoxX - boxPad,
            y - boxPad,
            onWidth + boxPad * 2,
            textHeight + boxPad * 2,
            color
        );
        drawScanlineText(ctx, 'ON', onBoxX, y, pixelSize, '#000');
    }
}

/**
 * Dessine le sélecteur de difficulté "EASY NORMAL HARD" (option sélectionnée
 * encadrée). Le niveau = le type de raisonnement exigé par la grille.
 */
export function drawCluesToggle(canvasId, level) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = getColor();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelSize = 3;
    const boxPad = 4;
    const textHeight = 7 * pixelSize;
    const gap = 14;
    const y = 12;

    const optWidths = DIFFICULTIES.map((d) => getTextWidth(d.label, pixelSize));

    // Largeur totale pour centrer : label + gap + (boîtes + gaps)
    let optionsWidth = 0;
    optWidths.forEach((w, i) => {
        optionsWidth += w + boxPad * 2;
        if (i < optWidths.length - 1) optionsWidth += gap;
    });
    const startX = (canvas.width - optionsWidth) / 2;

    let x = startX + boxPad;
    DIFFICULTIES.forEach((d, i) => {
        const w = optWidths[i];
        if (i === level) {
            drawScanlineRect(ctx, x - boxPad, y - boxPad, w + boxPad * 2, textHeight + boxPad * 2, color);
            drawScanlineText(ctx, d.label, x, y, pixelSize, '#000');
        } else {
            drawScanlineText(ctx, d.label, x, y, pixelSize, color);
        }
        x += w + boxPad * 2 + gap;
    });
}
