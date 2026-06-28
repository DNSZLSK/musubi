// ============================================================================
// GAMEOVER SCREEN - Écran de fin de partie
// ============================================================================

import { state, resetGame, resetChrono } from '../state.js';
import { getColor, formatScore } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';
import { submitScore } from '../api/leaderboard.js';
import { startGame } from './game.js';
import { showScreen } from './index.js';

/**
 * Dessine l'écran de game over
 */
export function drawGameoverScreen() {
    const color = getColor();

    // Titre
    const titleCanvas = document.getElementById('gameover-title');
    if (titleCanvas) {
        const ctx = titleCanvas.getContext('2d');
        ctx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
        drawCenteredText(ctx, 'TIME UP', titleCanvas.width, 10, 4, color);
    }

    // Score
    const scoreCanvas = document.getElementById('gameover-score');
    if (scoreCanvas) {
        const ctx = scoreCanvas.getContext('2d');
        ctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
        drawCenteredText(
            ctx,
            `${formatScore(state.currentScore)} PTS`,
            scoreCanvas.width,
            20,
            4,
            color
        );
        drawCenteredText(
            ctx,
            `${state.puzzlesSolved} PUZZLES`,
            scoreCanvas.width,
            70,
            3,
            color
        );
    }

    // Bouton restart
    const restartCanvas = document.getElementById('gameover-restart');
    if (restartCanvas) {
        const ctx = restartCanvas.getContext('2d');
        ctx.clearRect(0, 0, restartCanvas.width, restartCanvas.height);
        drawCenteredText(ctx, 'RESTART', restartCanvas.width, 12, 3, color);
    }

    // Bouton menu
    const menuCanvas = document.getElementById('gameover-menu');
    if (menuCanvas) {
        const ctx = menuCanvas.getContext('2d');
        ctx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
        drawCenteredText(ctx, 'MENU', menuCanvas.width, 12, 3, color);
    }

    // Sauvegarder le score UNE SEULE FOIS quand l'écran s'affiche
    if (state.currentScore > 0 && !state.scoreSubmitted) {
        state.scoreSubmitted = true;
        submitScore(state.currentScore, state.gridSize);
    }
}

/**
 * Gère le restart depuis game over
 */
export function handleRestart() {
    const gridSize = state.gridSize;
    resetGame();
    resetChrono();

    startGame(gridSize);
}

/**
 * Gère le retour au menu depuis game over
 */
export function handleBackToMenu() {
    resetGame();
    resetChrono();

    showScreen('menu');
}