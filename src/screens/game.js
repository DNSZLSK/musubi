// ============================================================================
// GAME SCREEN - Écran de jeu principal
// ============================================================================

import { state, resetGame, resetChrono } from '../state.js';
import { getColor, formatScore, formatTime } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';
import { drawAllIcons } from '../renderer/icons.js';
import { drawPuzzle } from '../puzzle/renderer.js';
import { generatePuzzle, checkWin, toggleCircle, triggerAnimation, updateAnimations, startMelt, updateMelt } from '../puzzle/generator.js';
import { startMusicWithFade, stopMusic } from '../audio/manager.js';
import { submitScore } from '../api/leaderboard.js';
import { showScreen } from './index.js';
import { completeDaily } from './daily.js';
import { CHRONO_CONFIG, GAME_MODES } from '../constants.js';

// Pénalité de score par indice révélé (fraction du gain d'un puzzle)
const HINT_PENALTY_RATIO = 0.25;

/**
 * Dessine l'écran de jeu
 */
export function drawGameScreen() {
    drawAllIcons(state.starsEnabled, state.musicMuted);
    drawPuzzle();
    drawModeAndScore();
    drawHintButton();

    const showTimer = state.chronoEnabled || state.dailyMode;
    const timerCanvas = document.getElementById('timer-canvas');
    if (timerCanvas) {
        timerCanvas.style.display = showTimer ? 'block' : 'none';
    }
    if (showTimer) drawTimer();
}

/**
 * Dessine le bouton d'indice
 */
function drawHintButton() {
    const canvas = document.getElementById('hint-btn');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenteredText(ctx, 'HINT', canvas.width, 10, 3, getColor());
}

/**
 * Dessine le mode et le score
 */
export function drawModeAndScore() {
    const canvas = document.getElementById('mode-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mode daily : pas de score cumulé, on affiche juste le label
    if (state.dailyMode) {
        drawCenteredText(ctx, 'DAILY PUZZLE', canvas.width, 10, 3, getColor());
        return;
    }

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

    // Mode daily : le temps monte (chrono d'effort), sans couleur d'alerte
    if (state.dailyMode) {
        drawCenteredText(ctx, formatTime(state.dailyElapsed), canvas.width, 8, 4, getColor());
        return;
    }

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
 * @param {number} gridSize
 * @param {{ daily?: boolean, rng?: () => number }} [options]
 */
export function startGame(gridSize, options = {}) {
    const { daily = false, rng } = options;

    state.gridSize = gridSize;
    state.dailyMode = daily;
    resetGame();
    generatePuzzle(rng);
    showScreen('game');
    startMusicWithFade();

    if (daily) {
        startDailyTimer();
    } else if (state.chronoEnabled) {
        startChrono();
    }

    // Lance la boucle d'animation
    requestAnimationFrame(gameLoop);
}

/**
 * Démarre le chrono d'effort du mode daily (compte vers le haut)
 */
function startDailyTimer() {
    stopDailyTimer();
    state.dailyElapsed = 0;
    state.dailyInterval = setInterval(() => {
        state.dailyElapsed++;
        drawTimer();
    }, 1000);
}

/**
 * Arrête le chrono d'effort du mode daily
 */
export function stopDailyTimer() {
    if (state.dailyInterval) {
        clearInterval(state.dailyInterval);
        state.dailyInterval = null;
    }
}

/**
 * Boucle de jeu pour les animations
 */
function gameLoop() {
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen || !gameScreen.classList.contains('active')) {
        return;
    }

    let needsRedraw = false;

    // Update melt animation
    if (state.meltActive) {
        const meltDone = updateMelt();
        needsRedraw = true;

        if (meltDone) {
            generatePuzzle();
        }
    }

    // Update click animations
    if (updateAnimations()) {
        needsRedraw = true;
    }

    if (needsRedraw) {
        drawPuzzle();
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Gère le clic sur le puzzle
 */
export function handlePuzzleClick(event) {
    // Ignore les clics pendant l'animation de victoire (évite le re-comptage de score)
    if (state.meltActive) return;

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
    // Mode daily : puzzle unique → on termine au lieu d'enchaîner
    if (state.dailyMode) {
        stopDailyTimer();
        stopMusic();
        completeDaily();
        return;
    }

    const base = state.gridSize * state.gridSize * 100;
    const penalty = state.hintsUsed * Math.floor(base * HINT_PENALTY_RATIO);
    const points = Math.max(Math.floor(base * 0.1), base - penalty);
    state.currentScore += points;
    state.puzzlesSolved++;

    // Bonus de temps en mode chrono
    if (state.chronoEnabled && state.chronoActive) {
        state.chronoRemaining += CHRONO_CONFIG.bonus[state.gridSize] || 10;
        drawTimer();
    }

    drawModeAndScore();

    // Lance l'animation melt (puis génère le puzzle suivant)
    startMelt();
}

/**
 * Révèle une case correcte (indice). Pénalise le score.
 */
export function useHint() {
    if (state.meltActive || state.currentScreen !== 'game') return;

    const size = state.gridSize;
    const wrong = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (state.circles[y][x].filled !== state.circles[y][x].solution) {
                wrong.push({ x, y });
            }
        }
    }
    if (wrong.length === 0) return; // déjà résolu correctement

    const pick = wrong[Math.floor(Math.random() * wrong.length)];
    state.circles[pick.y][pick.x].filled = state.circles[pick.y][pick.x].solution;
    state.hintsUsed++;
    triggerAnimation(pick.x, pick.y);
    drawPuzzle();

    if (checkWin()) handleWin();
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

    stopMusic();
    showScreen('gameover');
}

/**
 * Quitte la partie et retourne au menu
 */
export function exitGame() {
    stopChrono();
    stopDailyTimer();

    // Sauvegarde seulement en mode endless sans chrono (le daily a son propre score)
    if (!state.chronoEnabled && !state.dailyMode && state.currentScore > 0) {
        submitScore(state.currentScore, state.gridSize);
    }

    state.dailyMode = false;
    resetGame();
    resetChrono();
    stopMusic();
    showScreen('menu');
}