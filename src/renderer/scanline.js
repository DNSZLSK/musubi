// ============================================================================
// SCANLINE - Moteur de rendu texte CRT
// ============================================================================

import { BLOCK_FONT } from '../constants.js';

/**
 * Dessine du texte avec effet scanline
 */
export function drawScanlineText(ctx, text, x, y, pixelSize, color) {
    const chars = text.toUpperCase().split('');
    let offsetX = 0;

    ctx.fillStyle = color;

    chars.forEach((char) => {
        const pattern = BLOCK_FONT[char] || BLOCK_FONT[' '];

        pattern.forEach((row, rowIndex) => {
            for (let col = 0; col < row.length; col++) {
                if (row[col] === '1') {
                    for (let py = 0; py < pixelSize; py++) {
                        // Effet scanline : une ligne sur deux
                        if (py % 2 === 0) {
                            ctx.fillRect(
                                x + offsetX + col * pixelSize,
                                y + rowIndex * pixelSize + py,
                                pixelSize,
                                1
                            );
                        }
                    }
                }
            }
        });

        offsetX += 6 * pixelSize;
    });

    return offsetX;
}

/**
 * Calcule la largeur d'un texte
 */
export function getTextWidth(text, pixelSize) {
    return text.length * 6 * pixelSize;
}

/**
 * Dessine du texte centré
 */
export function drawCenteredText(ctx, text, canvasWidth, y, pixelSize, color) {
    const textWidth = getTextWidth(text, pixelSize);
    const x = (canvasWidth - textWidth) / 2;
    drawScanlineText(ctx, text, x, y, pixelSize, color);
}

/**
 * Dessine un rectangle avec effet scanline
 */
export function drawScanlineRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;

    for (let py = 0; py < height; py++) {
        if (py % 2 === 0) {
            ctx.fillRect(x, y + py, width, 1);
        }
    }
}
