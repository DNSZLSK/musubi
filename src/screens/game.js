// ============================================================================
// GAME SCREEN - Écran de jeu principal
// ============================================================================

import { state, resetGame, resetChrono } from '../state.js';
import { getColor, formatScore, formatTime } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';
import { drawAllIcons } from '../renderer/icons.js';
import { drawPuzzle } from '../puzzle/renderer.js';
import { generatePuzzle, checkWin, toggleCircle, updateAnimations } from '../puzzle/generator.js';
import { startMusicWithFade, stopMusic } from '../audio/manager.js';
import { submitScore } from '../api/leaderboard.js';
import { showScreen } from './index.js';
import { CHRONO_CONFIG, GAME_MODES } from '../constants.js';

/**
 * Dessine l'écran de jeu
 */
export function drawGameScreen() {
    drawAllIcons(state.starsEnabled, state.musicMuted);
    drawPuzzle();
    drawModeAndScore();

    if (state.chronoEnabled) {
        const timerCanvas = document.getElementById('timer-canvas');
        if (timerCanvas) {
            timerCanvas.style.display = 'block';
        }
        drawTimer();
    } else {
        const timerCanvas = document.getElementById('timer-canvas');
        if (timerCanvas) {
            timerCanvas.style.display = 'none';
        }
    }
}

/**
 * Dessine le mode et le score
 */
export function drawModeAndScore() {
    const canvas = document.getElementById('mode-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mode = GAME_MODES[state.gridSize];
    const text = `${mode.name}  ${formatScore(state.currentScore)} PTS`;
    
    // Réduire la taille si le texte est trop long
    const scale = text.length > 20 ? 2 : 3;
    
    drawCenteredText(ctx, text, canvas.width, 10, scale, getColor());
}

/**
 * Dessine le timer
 */
export function drawTimer() {
    const canvas = document.getElementById('timer-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let color = getColor();
    if (state.chronoRemaining <= 10) {
        color = '#f55';
    } else if (state.chronoRemaining <= 30) {
        color = '#fa5';
    }

    drawCenteredText(ctx, formatTime(state.chronoRemaining), canvas.width, 8, 4, color);
}

/**
 * Démarre une nouvelle partie
 */
export function startGame(gridSize) {
    state.gridSize = gridSize;
    resetGame();
    generatePuzzle();
    showScreen('game');
    startMusicWithFade();

    if (state.chronoEnabled) {
        startChrono();
    }

    // Lance la boucle d'animation
    requestAnimationFrame(gameLoop);
}

/**
 * Boucle de jeu pour les animations
 */
function gameLoop() {
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen || !gameScreen.classList.contains('active')) {
        return;
    }

    if (updateAnimations()) {
        drawPuzzle();
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Gère le clic sur le puzzle
 */
export function handlePuzzleClick(event) {
    const canvas = document.getElementById('puzzle-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const cellSize = canvas.width / state.gridSize;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (toggleCircle(gridX, gridY)) {
        drawPuzzle();

        if (checkWin()) {
            handleWin();
        }
    }
}

/**
 * Gère la victoire d'un puzzle
 */
function handleWin() {
    const points = state.gridSize * state.gridSize * 100;
    state.currentScore += points;
    state.puzzlesSolved++;

    // Bonus de temps en mode chrono
    if (state.chronoEnabled && state.chronoActive) {
        state.chronoRemaining += CHRONO_CONFIG.bonus[state.gridSize] || 10;
        drawTimer();
    }

    drawModeAndScore();

    // Génère un nouveau puzzle après un délai
    setTimeout(() => {
        generatePuzzle();
        drawPuzzle();
    }, 500);
}

/**
 * Démarre le chrono
 */
function startChrono() {
    state.chronoRemaining = CHRONO_CONFIG.startTime;
    state.chronoActive = true;

    state.chronoInterval = setInterval(() => {
        state.chronoRemaining--;
        drawTimer();

        if (state.chronoRemaining <= 0) {
            endChrono();
        }
    }, 1000);
}

/**
 * Arrête le chrono
 */
export function stopChrono() {
    if (state.chronoInterval) {
        clearInterval(state.chronoInterval);
        state.chronoInterval = null;
    }
    state.chronoActive = false;
}

/**
 * Fin du chrono (temps écoulé)
 */
function endChrono() {
    stopChrono();

    if (state.currentScore > 0) {
        submitScore(state.currentScore, state.gridSize);
    }

    stopMusic();
    showScreen('gameover');
}

/**
 * Quitte la partie et retourne au menu
 */
export function exitGame() {
    stopChrono();

    if (state.currentScore > 0) {
        submitScore(state.currentScore, state.gridSize);
    }

    resetGame();
    resetChrono();
    stopMusic();
    showScreen('menu');
}
