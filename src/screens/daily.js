// ============================================================================
// DAILY - Puzzle du jour (seedé par la date) + streak local
// ============================================================================

import { state } from '../state.js';
import { getColor, getBrightColor, hexToRgb, formatTime, formatScore } from '../utils.js';
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
    // Plus rapide = meilleur score
    const base = 50000;
    const timePenalty = state.dailyElapsed * 100;
    return Math.max(500, base - timePenalty);
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
        state.dailyAlreadyDone = true;
        showScreen('daily-result');
        return;
    }

    state.dailyAlreadyDone = false;
    state.chronoEnabled = false;
    startGame(DAILY_SIZE, { daily: true, rng: seededRng(today) });
}

// Vrai juste après la résolution : le score défile (sinon affichage direct)
let justSolved = false;
let countUpFrame = null;

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
        saved.lastScore = score;
        // Le nœud résolu, pour l'afficher sur l'écran de résultat
        saved.lastKnot = state.circles.flat().map((c) => (c.solution ? 1 : 0));
        saveDailyState(saved);
        justSolved = true;
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

    drawKnot(saved.lastKnot);

    // Score : défile de 0 à sa valeur juste après la victoire
    const score = saved.lastScore || 0;
    if (countUpFrame) window.cancelAnimationFrame(countUpFrame);
    if (justSolved) {
        justSolved = false;
        const start = window.performance.now();
        const duration = 900;
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            drawStats(Math.round(score * eased), saved);
            if (t < 1 && state.currentScreen === 'daily-result') {
                countUpFrame = requestAnimationFrame(step);
            }
        };
        countUpFrame = requestAnimationFrame(step);
    } else {
        drawStats(score, saved);
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

/** Score en grand, puis temps / série / niveau */
function drawStats(score, saved) {
    const stats = document.getElementById('daily-stats');
    if (!stats) return;
    const color = getColor();
    const ctx = stats.getContext('2d');
    ctx.clearRect(0, 0, stats.width, stats.height);
    drawCenteredText(ctx, `${formatScore(score)} PTS`, stats.width, 4, 5, getBrightColor());
    drawCenteredText(
        ctx,
        `TIME ${formatTime(state.dailyElapsed)}   STREAK ${saved.streak || 0}`,
        stats.width,
        58,
        2,
        color
    );
    drawCenteredText(ctx, '5X5 NORMAL', stats.width, 86, 2, color);
    stats.setAttribute(
        'aria-label',
        `${score} points, time ${formatTime(state.dailyElapsed)}, streak ${saved.streak || 0}`
    );
}

/** Le nœud résolu en miniature (liens allumés + cercles), style scanline */
function drawKnot(knot) {
    const canvas = document.getElementById('daily-knot');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const size = DAILY_SIZE;
    if (!Array.isArray(knot) || knot.length !== size * size) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';

    const color = getColor();
    const bright = getBrightColor();
    const rgb = hexToRgb(color);
    const cell = canvas.width / size;
    const r = cell * 0.22;
    const center = (i) => (i + 0.5) * cell;
    const filled = (x, y) => knot[y * size + x] === 1;

    // Traits : liens du nœud allumés, le reste très estompé
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            for (const [dx, dy] of [
                [1, 0],
                [0, 1]
            ]) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= size || ny >= size) continue;
                const link = filled(x, y) && filled(nx, ny);
                ctx.strokeStyle = link ? bright : `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
                ctx.lineWidth = link ? 6 : 2;
                ctx.beginPath();
                ctx.moveTo(center(x), center(y));
                ctx.lineTo(center(nx), center(ny));
                ctx.stroke();
            }
        }
    }

    // Cercles : pleins pour le nœud, contour estompé pour les vides
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            ctx.beginPath();
            ctx.arc(center(x), center(y), r, 0, Math.PI * 2);
            if (filled(x, y)) {
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                ctx.fillStyle = '#000';
                ctx.fill();
                ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    // Effet scanline (une ligne sur deux atténuée), comme le reste du jeu
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    for (let y = 1; y < canvas.height; y += 2) ctx.fillRect(0, y, canvas.width, 1);
    ctx.globalCompositeOperation = 'source-over';
}
