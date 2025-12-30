// ============================================================================
// LEADERBOARD SCREEN - Écran des scores
// ============================================================================

import { state } from '../state.js';
import { getColor, formatScore } from '../utils.js';
import { drawCenteredText, drawScanlineText, getTextWidth } from '../renderer/scanline.js';
import { drawChronoToggle } from './difficulty.js';
import { fetchLeaderboard, getCurrentScores } from '../api/leaderboard.js';

const MODE_TITLES = ['TRAINING 4X4', 'CHALLENGE 5X5', 'EXPERT 6X6'];

/**
 * Dessine l'écran du leaderboard
 */
export function drawLeaderboardScreen() {
    const color = getColor();

    // Titre
    const titleCanvas = document.getElementById('leaderboard-title');
    if (titleCanvas) {
        const ctx = titleCanvas.getContext('2d');
        ctx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
        drawCenteredText(ctx, 'LEADERBOARD', titleCanvas.width, 10, 4, color);
    }

    // Toggle chrono
    drawChronoToggle('lb-chrono-title', state.currentLeaderboardChrono === 1);

    // Flèches de navigation
    drawArrow('lb-prev', 'left');
    drawArrow('lb-next', 'right');

    // Titre du mode
    const modeCanvas = document.getElementById('lb-mode-title');
    if (modeCanvas) {
        const ctx = modeCanvas.getContext('2d');
        ctx.clearRect(0, 0, modeCanvas.width, modeCanvas.height);
        drawCenteredText(
            ctx,
            MODE_TITLES[state.currentLeaderboardMode],
            modeCanvas.width,
            5,
            3,
            color
        );
    }

    // Liste des scores
    drawScoresList();

    // Bouton retour
    const backCanvas = document.getElementById('leaderboard-back');
    if (backCanvas) {
        const ctx = backCanvas.getContext('2d');
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
        drawCenteredText(ctx, 'BACK', backCanvas.width, 10, 3, color);
    }
}

/**
 * Dessine une flèche
 */
function drawArrow(canvasId, direction) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenteredText(ctx, direction === 'left' ? '<' : '>', canvas.width, 8, 4, getColor());
}

/**
 * Dessine la liste des scores
 */
async function drawScoresList() {
    const canvas = document.getElementById('leaderboard-list');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = getColor();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenteredText(ctx, 'LOADING...', canvas.width, 160, 3, color);

    await fetchLeaderboard();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scores = getCurrentScores();

    if (scores.length === 0) {
        drawCenteredText(ctx, 'NO SCORES YET', canvas.width, 160, 3, color);
        return;
    }

    // Layout: rang aligné à droite sur 40px, puis nickname, puis score aligné à droite
    const rankEndX = 55;      // Position fin du rang
    const nicknameX = 65;     // Position début nickname
    const scoreEndX = 365;    // Position fin du score

    scores.slice(0, 10).forEach((entry, index) => {
        const y = 10 + index * 34;

        // Rang (aligné à droite)
        const rank = `${index + 1}.`;
        const rankWidth = getTextWidth(rank, 3);
        drawScanlineText(ctx, rank, rankEndX - rankWidth, y, 3, color);

        // Nickname (tronqué si trop long)
        const maxNicknameLength = 10;
        const nickname = entry.nickname.length > maxNicknameLength 
            ? entry.nickname.substring(0, maxNicknameLength) 
            : entry.nickname;
        drawScanlineText(ctx, nickname, nicknameX, y, 3, color);

        // Score (aligné à droite)
        const scoreText = formatScore(entry.score);
        const scoreWidth = getTextWidth(scoreText, 3);
        drawScanlineText(ctx, scoreText, scoreEndX - scoreWidth, y, 3, color);
    });
}

/**
 * Change le mode du leaderboard
 */
export function nextLeaderboardMode() {
    state.currentLeaderboardMode = (state.currentLeaderboardMode + 1) % 3;
    drawLeaderboardScreen();
}

/**
 * Change le mode du leaderboard (précédent)
 */
export function prevLeaderboardMode() {
    state.currentLeaderboardMode = (state.currentLeaderboardMode - 1 + 3) % 3;
    drawLeaderboardScreen();
}

/**
 * Toggle le filtre chrono du leaderboard
 */
export function toggleLeaderboardChrono() {
    state.currentLeaderboardChrono = (state.currentLeaderboardChrono + 1) % 2;
    drawLeaderboardScreen();
}