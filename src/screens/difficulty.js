// ============================================================================
// DIFFICULTY SCREEN - Écran de sélection du mode
// ============================================================================

import { state } from '../state.js';
import { getColor } from '../utils.js';
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

    // Boutons de mode
    const buttons = [
        { id: 'diff-training', text: 'TRAINING  4X4' },
        { id: 'diff-challenge', text: 'CHALLENGE  5X5' },
        { id: 'diff-expert', text: 'EXPERT  6X6' },
        { id: 'diff-back', text: 'BACK' }
    ];

    buttons.forEach((btn) => {
        const canvas = document.getElementById(btn.id);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenteredText(ctx, btn.text, canvas.width, 12, 3, color);
    });

    // Toggle chrono
    drawChronoToggle('chrono-toggle', state.chronoEnabled);
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
