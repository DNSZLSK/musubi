// ============================================================================
// PUZZLE RENDERER - Dessin du puzzle
// ============================================================================

import { state } from '../state.js';
import { getColor, getBrightColor, hexToRgb } from '../utils.js';
import { drawScanlineText, getTextWidth } from '../renderer/scanline.js';
import { mainGroup } from './logic.js';

// Hauteur réservée hors grille (barre du haut, score, UNDO/RESET, marges)
const RESERVED_HEIGHT = 240;
// Hauteur en plus quand la consigne du tutoriel est affichée
const TUTORIAL_HEIGHT = 90;

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

    // Taille responsive (mobile portrait comme PC) : la grille prend la place
    // disponible sans jamais pousser les boutons hors de l'écran
    const reserved = RESERVED_HEIGHT + (state.tutorialStep >= 0 ? TUTORIAL_HEIGHT : 0);
    const maxSize = Math.min(500, window.innerWidth - 32, window.innerHeight - reserved);
    const canvasSize = Math.floor(Math.max(240, maxSize));
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const cellSize = canvasSize / size;
    const circleRadius = cellSize * 0.22;
    const lineWidth = Math.max(4, Math.floor(canvasSize / 100));

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Dessine les lignes (les liens entre cercles remplis s'allument : le nœud)
    drawLines(ctx, size, cellSize, circleRadius, lineWidth, color, brightColor);

    // Dessine les nombres
    drawNumbers(ctx, size, cellSize, brightColor);

    // Dessine les cercles
    drawCircles(ctx, size, cellSize, circleRadius, color);
}

function isFilled(x, y) {
    return !state.meltActive && state.circles[y][x].filled;
}

function drawLines(ctx, size, cellSize, circleRadius, lineWidth, color, brightColor) {
    const rgb = hexToRgb(color);
    const dimLine = `rgba(${rgb.r},${rgb.g},${rgb.b},0.45)`;
    const linkWidth = lineWidth * 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;

            // Ligne horizontale
            if (x < size - 1) {
                const nextCx = (x + 1) * cellSize + cellSize / 2;
                const link = isFilled(x, y) && isFilled(x + 1, y);
                ctx.fillStyle = link ? brightColor : dimLine;
                const w = link ? linkWidth : lineWidth;
                for (let py = 0; py < w; py++) {
                    if (py % 2 === 0) {
                        ctx.fillRect(
                            cx + circleRadius,
                            cy - w / 2 + py,
                            nextCx - cx - circleRadius * 2,
                            1
                        );
                    }
                }
            }

            // Ligne verticale
            if (y < size - 1) {
                const nextCy = (y + 1) * cellSize + cellSize / 2;
                const link = isFilled(x, y) && isFilled(x, y + 1);
                ctx.fillStyle = link ? brightColor : dimLine;
                const w = link ? linkWidth : lineWidth;
                for (let px = 0; px < w; px++) {
                    if (px % 2 === 0) {
                        ctx.fillRect(
                            cx - w / 2 + px,
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
    const rgb = hexToRgb(color);
    const dimColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.22)`;
    const hiddenColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`;
    const errorColor = '#f55';
    // En HARD, aucune aide visuelle sur les indices respectés
    const dimSatisfied = state.dailyMode || state.difficulty < 2;

    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            const cx = (x + 1) * cellSize;
            const cy = (y + 1) * cellSize;

            // Indice masqué : à déduire
            if (state.clueVisible?.[y]?.[x] === false) {
                const w = getTextWidth('?', 4);
                drawScanlineText(ctx, '?', cx - w / 2, cy - 14, 4, hiddenColor);
                continue;
            }

            let count = 0;
            if (state.circles[y][x].filled) count++;
            if (state.circles[y][x + 1].filled) count++;
            if (state.circles[y + 1][x].filled) count++;
            if (state.circles[y + 1][x + 1].filled) count++;
            const clue = state.numbers[y][x];

            // Trop de cercles : erreur visible. Atteint : estompé (sauf 0, qui
            // serait "satisfait" dès le départ et ne vérifie rien).
            let c = color;
            if (count > clue) c = errorColor;
            else if (dimSatisfied && clue > 0 && count === clue) c = dimColor;

            const num = clue.toString();
            const textWidth = getTextWidth(num, 4);
            drawScanlineText(ctx, num, cx - textWidth / 2, cy - 14, 4, c);
        }
    }
}

function drawCircles(ctx, size, cellSize, circleRadius, color) {
    const group = mainGroup(state.circles.map((row) => row.map((c) => c.filled)));
    const rgb = hexToRgb(color);
    const detachedColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;

            // Animation click
            const anim = state.animations.find((a) => a.x === x && a.y === y);
            let scale = 1;
            let glowAlpha = 0;

            if (anim) {
                scale = 1 + Math.sin(anim.progress * Math.PI) * 0.2;
                glowAlpha = Math.sin(anim.progress * Math.PI) * 0.6;
            }

            const radius = circleRadius * scale;

            // Melt animation
            if (state.meltActive) {
                if (state.meltPhase === 0) {
                    // Phase fill : tous les cercles se remplissent
                    const fillAmount = state.meltProgress;
                    drawMeltingCircle(ctx, cx, cy, radius, color, fillAmount);
                } else {
                    // Phase fade : tout disparaît
                    const alpha = 1 - state.meltProgress;
                    drawFilledCircleWithAlpha(ctx, cx, cy, radius, color, alpha);
                }
            } else if (state.circles[y][x].filled) {
                // Victoire : tout le nœud pulse. Sinon, morceau détaché = estompé.
                if (state.celebrating) {
                    glowAlpha = Math.max(glowAlpha, Math.sin(state.celebrateProgress * Math.PI) * 0.8);
                }
                const attached = group[y][x];
                drawFilledCircle(ctx, cx, cy, radius, attached ? color : detachedColor, glowAlpha);
            } else {
                drawEmptyCircle(ctx, cx, cy, radius, color);
            }
        }
    }
}

function drawMeltingCircle(ctx, cx, cy, radius, color, fillAmount) {
    // Contour
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

    // Remplissage progressif (de haut en bas)
    const fillHeight = radius * 2 * fillAmount;
    const startY = cy - radius;

    ctx.fillStyle = color;
    for (let dy = 0; dy < fillHeight; dy++) {
        const currentY = startY + dy;
        if (Math.floor(currentY) % 2 === 0) {
            const distFromCenter = currentY - cy;
            const width = Math.sqrt(Math.max(0, radius * radius - distFromCenter * distFromCenter));
            ctx.fillRect(cx - width, currentY, width * 2, 1);
        }
    }
}

function drawFilledCircleWithAlpha(ctx, cx, cy, radius, color, alpha) {
    const rgb = hexToRgb(color);
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;

    for (let dy = -radius; dy <= radius; dy++) {
        if (Math.floor(cy + dy) % 2 === 0) {
            const width = Math.sqrt(radius * radius - dy * dy);
            ctx.fillRect(cx - width, cy + dy, width * 2, 1);
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

    // Glow animation (couleur du thème : `color` peut être estompée en rgba)
    if (glowAlpha > 0) {
        const rgb = hexToRgb(getColor());
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
