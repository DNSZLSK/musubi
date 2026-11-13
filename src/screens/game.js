// ============================================================================
// GAME SCREEN - Écran de jeu principal
// ============================================================================

import { state, resetGame, resetChrono } from '../state.js';
import { getColor, formatScore, formatTime } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';
import { drawAllIcons } from '../renderer/icons.js';
import { drawPuzzle } from '../puzzle/renderer.js';
import {
    generatePuzzle,
    checkWin,
    toggleCircle,
    updateAnimations,
    startMelt,
    updateMelt,
    undoMove,
    resetBoard
} from '../puzzle/generator.js';
import { startMusicWithFade, stopMusic } from '../audio/manager.js';
import { submitScore } from '../api/leaderboard.js';
import { showScreen } from './index.js';
import { completeDaily } from './daily.js';
import { CHRONO_CONFIG, GAME_MODES } from '../constants.js';
import { SCORE_MULTIPLIER, DIFFICULTIES } from '../puzzle/difficulty.js';
import { drawTutorialText, loadTutorialStep, TUTORIAL_LENGTH } from './tutorial.js';

// Durée de la célébration de victoire (en frames, ~60 fps)
const CELEBRATE_FRAMES = 50;

/**
 * Dessine l'écran de jeu
 */
export function drawGameScreen() {
    drawAllIcons(state.starsEnabled, state.musicMuted);
    drawPuzzle();
    drawModeAndScore();
    drawActionButtons();
    drawTutorialText();

    const showTimer = state.tutorialStep < 0 && (state.chronoEnabled || state.dailyMode);
    const timerCanvas = document.getElementById('timer-canvas');
    if (timerCanvas) {
        timerCanvas.style.display = showTimer ? 'block' : 'none';
    }
    if (showTimer) drawTimer();
}

/**
 * Dessine les boutons UNDO / RESET (estompés quand ils n'ont aucun effet)
 */
export function drawActionButtons() {
    const canUndo = state.history.length > 0;
    const canReset = state.circles.some((row) => row.some((c) => c.filled));
    const buttons = [
        ['undo-btn', 'UNDO', canUndo],
        ['reset-btn', 'RESET', canReset]
    ];
    for (const [id, label, enabled] of buttons) {
        const canvas = document.getElementById(id);
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenteredText(ctx, label, canvas.width, 10, 3, enabled ? getColor() : '#333');
        canvas.setAttribute('aria-disabled', String(!enabled));
    }
}

/**
 * Dessine le mode (taille + niveau) et le score
 */
export function drawModeAndScore() {
    const canvas = document.getElementById('mode-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let text;
    if (state.tutorialStep >= 0) {
        text = `TUTORIAL ${state.tutorialStep + 1}-${TUTORIAL_LENGTH}`;
    } else if (state.celebrating) {
        text = state.dailyMode ? 'SOLVED' : `+${formatScore(state.lastPoints)} PTS`;
    } else if (state.dailyMode) {
        // Mode daily : pas de score cumulé
        text = 'DAILY  5X5 NORMAL';
    } else {
        const grid = GAME_MODES[state.gridSize]?.grid ?? '';
        const level = DIFFICULTIES[state.difficulty]?.label ?? '';
        text = `${grid} ${level}  ${formatScore(state.currentScore)} PTS`;
    }

    // Réduire la taille si le texte est trop long
    const scale = text.length > 20 ? 2 : 3;

    drawCenteredText(ctx, text, canvas.width, 10, scale, getColor());
    canvas.setAttribute('aria-label', text);
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
    state.tutorialStep = -1;
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
 * Lance le tutoriel jouable (depuis HOW TO PLAY uniquement).
 */
export function startTutorial() {
    state.dailyMode = false;
    resetGame();
    resetChrono();
    loadTutorialStep(0);
    showScreen('game');
    startMusicWithFade();
    requestAnimationFrame(gameLoop);
}

/** Fin du tutoriel (réussi ou quitté) : retour au menu */
function endTutorial() {
    state.tutorialStep = -1;
    resetGame();
    stopMusic();
    showScreen('menu');
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

    // Célébration : le nœud complet s'illumine, puis on enchaîne
    if (state.celebrating) {
        state.celebrateProgress += 1 / CELEBRATE_FRAMES;
        needsRedraw = true;
        if (state.celebrateProgress >= 1) {
            state.celebrating = false;
            state.celebrateProgress = 0;
            afterCelebration();
            if (state.currentScreen !== 'game') return;
            drawModeAndScore();
        }
    }

    // Update melt animation
    if (state.meltActive) {
        const meltDone = updateMelt();
        needsRedraw = true;

        if (meltDone) {
            generatePuzzle();
            drawActionButtons();
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

/** Vrai si une animation de victoire bloque les actions du joueur */
function isBusy() {
    return state.meltActive || state.celebrating || state.currentScreen !== 'game';
}

/**
 * Gère le clic sur le puzzle
 */
export function handlePuzzleClick(event) {
    // Ignore les clics pendant l'animation de victoire (évite le re-comptage de score)
    if (isBusy()) return;

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
        afterMove();
    }
}

/** Redessine après un coup et teste la victoire */
function afterMove() {
    drawPuzzle();
    drawActionButtons();
    if (checkWin()) handleWin();
}

/** Annule le dernier coup */
export function handleUndo() {
    if (isBusy()) return;
    if (undoMove()) afterMove();
}

/** Vide la grille en cours */
export function handleReset() {
    if (isBusy()) return;
    if (resetBoard()) {
        drawPuzzle();
        drawActionButtons();
    }
}

/**
 * Gère la victoire d'un puzzle : on compte, puis on laisse le nœud briller
 * un instant avant d'enchaîner (afterCelebration).
 */
function handleWin() {
    if (state.tutorialStep < 0) {
        if (state.dailyMode) {
            stopDailyTimer();
        } else {
            const base = state.gridSize * state.gridSize * 100;
            const points = Math.round(base * (SCORE_MULTIPLIER[state.difficulty] ?? 1));
            state.lastPoints = points;
            state.currentScore += points;
            state.puzzlesSolved++;

            // Bonus de temps en mode chrono
            if (state.chronoEnabled && state.chronoActive) {
                state.chronoRemaining += CHRONO_CONFIG.bonus[state.gridSize] || 10;
                drawTimer();
            }
        }
    }

    state.celebrating = true;
    state.celebrateProgress = 0;
    drawModeAndScore();
}

/** Suite de la victoire, une fois la célébration terminée */
function afterCelebration() {
    // Tutoriel : étape suivante, ou fin
    if (state.tutorialStep >= 0) {
        if (loadTutorialStep(state.tutorialStep + 1)) {
            drawGameScreen();
        } else {
            endTutorial();
        }
        return;
    }

    // Mode daily : puzzle unique → on termine au lieu d'enchaîner
    if (state.dailyMode) {
        stopMusic();
        completeDaily();
        return;
    }

    // Lance l'animation melt (puis génère le puzzle suivant)
    startMelt();
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
    if (state.tutorialStep >= 0) {
        endTutorial();
        return;
    }

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
