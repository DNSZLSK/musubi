// ============================================================================
// DAILY - Puzzle du jour (seedé par la date) + streak local
// ============================================================================

import { state } from '../state.js';
import { getColor, formatTime } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';
import { seededRng } from '../puzzle/rng.js';
import { startGame } from './game.js';
import { showScreen } from './index.js';
import { submitDailyScore } from '../api/leaderboard.js';

const DAILY_SIZE = 5;
const STORAGE_KEY = 'musubi_daily';

// --- Date du jour (locale) ---------------------------------------------------

export function getTodayString(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function yesterdayString(today) {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return getTodayString(d);
}

// --- Persistance -------------------------------------------------------------

function loadDailyState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveDailyState(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Score -------------------------------------------------------------------

function computeDailyScore() {
    // Plus rapide + moins d'indices = meilleur score
    const base = 50000;
    const timePenalty = state.dailyElapsed * 100;
    const hintPenalty = state.hintsUsed * 8000;
    return Math.max(500, base - timePenalty - hintPenalty);
}

// --- Cycle de vie ------------------------------------------------------------

/**
 * Lance le puzzle du jour. S'il est déjà résolu aujourd'hui, affiche directement
 * le résultat (pas de re-grind).
 */
export function startDaily() {
    const today = getTodayString();
    const saved = loadDailyState();

    if (saved.lastSolved === today) {
        state.dailyMode = true;
        state.dailyElapsed = saved.lastTime || 0;
        state.hintsUsed = saved.lastHints || 0;
        state.dailyAlreadyDone = true;
        showScreen('daily-result');
        return;
    }

    state.dailyAlreadyDone = false;
    state.chronoEnabled = false;
    startGame(DAILY_SIZE, { daily: true, rng: seededRng(today) });
}

/**
 * Appelé à la résolution du puzzle du jour. Met à jour le streak, soumet le
 * score (une seule fois par jour) et affiche le résultat.
 */
export function completeDaily() {
    const today = getTodayString();
    const saved = loadDailyState();

    if (saved.lastSolved !== today) {
        const score = computeDailyScore();
        const continues = saved.lastSolved === yesterdayString(today);
        saved.streak = continues ? (saved.streak || 0) + 1 : 1;
        saved.lastSolved = today;
        saved.lastTime = state.dailyElapsed;
        saved.lastHints = state.hintsUsed;
        saved.lastScore = score;
        saveDailyState(saved);
        submitDailyScore(score);
    }

    showScreen('daily-result');
}

// --- Rendu de l'écran de résultat -------------------------------------------

export function drawDailyResultScreen() {
    const color = getColor();
    const saved = loadDailyState();

    const title = document.getElementById('daily-title');
    if (title) {
        const ctx = title.getContext('2d');
        ctx.clearRect(0, 0, title.width, title.height);
        drawCenteredText(ctx, 'DAILY DONE', title.width, 10, 4, color);
    }

    const stats = document.getElementById('daily-stats');
    if (stats) {
        const ctx = stats.getContext('2d');
        ctx.clearRect(0, 0, stats.width, stats.height);
        drawCenteredText(ctx, `TIME ${formatTime(state.dailyElapsed)}`, stats.width, 5, 3, color);
        const hintStr = state.hintsUsed > 0 ? `${state.hintsUsed} HINTS` : 'NO HINTS';
        drawCenteredText(ctx, hintStr, stats.width, 38, 2, color);
        drawCenteredText(ctx, `STREAK ${saved.streak || 0}`, stats.width, 66, 3, color);
    }

    const tagline = document.getElementById('daily-tagline');
    if (tagline) {
        const ctx = tagline.getContext('2d');
        ctx.clearRect(0, 0, tagline.width, tagline.height);
        drawCenteredText(ctx, 'COME BACK TOMORROW', tagline.width, 8, 2, color);
    }

    const back = document.getElementById('daily-back');
    if (back) {
        const ctx = back.getContext('2d');
        ctx.clearRect(0, 0, back.width, back.height);
        drawCenteredText(ctx, 'MENU', back.width, 12, 3, color);
    }
}
