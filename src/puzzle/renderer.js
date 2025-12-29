// ============================================================================
// PUZZLE RENDERER - Dessin du puzzle
// ============================================================================

import { state } from '../state.js';
import { getColor, getBrightColor, hexToRgb } from '../utils.js';
import { drawScanlineText, getTextWidth } from '../renderer/scanline.js';

/**
 * Dessine le puzzle complet
 */
export function drawPuzzle() {
    const canvas = document.getElementById('puzzle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = getColor();
    const brightColor = getBrightColor();
    const size = state.gridSize;

    // Taille responsive
    const maxSize = Math.min(500, window.innerWidth - 40, window.innerHeight - 250);
    const canvasSize = Math.max(280, maxSize);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const cellSize = canvasSize / size;
    const circleRadius = cellSize * 0.22;
    const lineWidth = Math.max(4, Math.floor(canvasSize / 100));

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Dessine les lignes
    drawLines(ctx, size, cellSize, circleRadius, lineWidth, color);

    // Dessine les nombres
    drawNumbers(ctx, size, cellSize, brightColor);

    // Dessine les cercles
    drawCircles(ctx, size, cellSize, circleRadius, color);
}

function drawLines(ctx, size, cellSize, circleRadius, lineWidth, color) {
    ctx.fillStyle = color;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;

            // Ligne horizontale
            if (x < size - 1) {
                const nextCx = (x + 1) * cellSize + cellSize / 2;
                for (let py = 0; py < lineWidth; py++) {
                    if (py % 2 === 0) {
                        ctx.fillRect(
                            cx + circleRadius,
                            cy - lineWidth / 2 + py,
                            nextCx - cx - circleRadius * 2,
                            1
                        );
                    }
                }
            }

            // Ligne verticale
            if (y < size - 1) {
                const nextCy = (y + 1) * cellSize + cellSize / 2;
                for (let px = 0; px < lineWidth; px++) {
                    if (px % 2 === 0) {
                        ctx.fillRect(
                            cx - lineWidth / 2 + px,
                            cy + circleRadius,
                            1,
                            nextCy - cy - circleRadius * 2
                        );
                    }
                }
            }
        }
    }
}

function drawNumbers(ctx, size, cellSize, color) {
    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            const cx = (x + 1) * cellSize;
            const cy = (y + 1) * cellSize;
            const num = state.numbers[y][x].toString();
            const textWidth = getTextWidth(num, 4);
            drawScanlineText(ctx, num, cx - textWidth / 2, cy - 14, 4, color);
        }
    }
}

function drawCircles(ctx, size, cellSize, circleRadius, color) {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;

            // Animation
            const anim = state.animations.find((a) => a.x === x && a.y === y);
            let scale = 1;
            let glowAlpha = 0;

            if (anim) {
                scale = 1 + Math.sin(anim.progress * Math.PI) * 0.2;
                glowAlpha = Math.sin(anim.progress * Math.PI) * 0.6;
            }

            const radius = circleRadius * scale;

            if (state.circles[y][x].filled) {
                drawFilledCircle(ctx, cx, cy, radius, color, glowAlpha);
            } else {
                drawEmptyCircle(ctx, cx, cy, radius, color);
            }
        }
    }
}

function drawFilledCircle(ctx, cx, cy, radius, color, glowAlpha) {
    ctx.fillStyle = color;

    for (let dy = -radius; dy <= radius; dy++) {
        if (Math.floor(cy + dy) % 2 === 0) {
            const width = Math.sqrt(radius * radius - dy * dy);
            ctx.fillRect(cx - width, cy + dy, width * 2, 1);
        }
    }

    // Glow animation
    if (glowAlpha > 0) {
        const rgb = hexToRgb(color);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${glowAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawEmptyCircle(ctx, cx, cy, radius, color) {
    ctx.fillStyle = color;
    const thickness = 4;

    for (let t = 0; t < thickness; t++) {
        const r = radius - t;
        for (let angle = 0; angle < Math.PI * 2; angle += 0.03) {
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (Math.floor(py) % 2 === 0) {
                ctx.fillRect(Math.floor(px), Math.floor(py), 2, 1);
            }
        }
    }
}
