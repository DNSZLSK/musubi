// ============================================================================
// LEADERBOARD API - Communication avec le serveur de scores
// ============================================================================

import { state } from '../state.js';
import { LEADERBOARD_URL } from '../constants.js';

/**
 * Récupère tous les scores du leaderboard
 */
export async function fetchLeaderboard() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(LEADERBOARD_URL, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Trie les scores par ordre décroissant
        const sortedData = {
            training: (data.training || []).sort((a, b) => b.score - a.score),
            challenge: (data.challenge || []).sort((a, b) => b.score - a.score),
            expert: (data.expert || []).sort((a, b) => b.score - a.score),
            training_chrono: (data.training_chrono || []).sort((a, b) => b.score - a.score),
            challenge_chrono: (data.challenge_chrono || []).sort((a, b) => b.score - a.score),
            expert_chrono: (data.expert_chrono || []).sort((a, b) => b.score - a.score),
            daily: (data.daily || []).sort((a, b) => b.score - a.score)
        };

        // Met à jour le state
        Object.assign(state.leaderboardData, sortedData);

        return sortedData;
    } catch (error) {
        const isAbort = error.name === 'AbortError';
        console.error('Leaderboard fetch failed:', isAbort ? 'timeout' : error.message);
        return null;
    }
}

/**
 * Affiche un message de notification temporaire
 */
function showNotification(message, isError = false) {
    // Supprimer une notification existante
    const existing = document.getElementById('notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${isError ? '#400' : '#040'};
        color: var(--color, #5c5);
        border: 2px solid ${isError ? '#f44' : '#5c5'};
        font-family: monospace;
        font-size: 14px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    // Fade out après 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Soumet un score au leaderboard pour un mode donné, avec retry et feedback.
 */
async function postScore(score, mode, retries = 3) {
    const params = new URLSearchParams({
        action: 'submit',
        nickname: state.nickname,
        score: score,
        mode: mode
    });

    const url = `${LEADERBOARD_URL}?${params.toString()}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            showNotification('SCORE SAVED!');
            return true;
        } catch (error) {
            const isLastAttempt = attempt === retries;
            const isAbort = error.name === 'AbortError';

            if (isLastAttempt) {
                const errorMsg = isAbort ? 'Connection timeout' : error.message;
                console.error(`Score submit failed after ${retries} attempts:`, errorMsg);
                showNotification('SCORE NOT SAVED - CHECK CONNECTION', true);
                return false;
            }

            // Attendre avant de réessayer (backoff exponentiel)
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }

    return false;
}

/**
 * Soumet un score de partie classique (mode dérivé de la taille + chrono).
 */
export async function submitScore(score, gridSize) {
    if (score <= 0) return false;

    const modeNames = { 4: 'training', 5: 'challenge', 6: 'expert' };
    const modeStr = modeNames[gridSize] || 'training';
    const finalMode = state.chronoEnabled ? `${modeStr}_chrono` : modeStr;

    return postScore(score, finalMode);
}

/**
 * Soumet un score du puzzle du jour.
 */
export async function submitDailyScore(score) {
    if (score <= 0) return false;
    return postScore(score, 'daily');
}

/**
 * Retourne la clé du mode actuel pour le leaderboard
 */
export function getCurrentModeKey() {
    const modes = ['training', 'challenge', 'expert'];
    const mode = modes[state.currentLeaderboardMode];
    return state.currentLeaderboardChrono ? `${mode}_chrono` : mode;
}

/**
 * Retourne les scores du mode actuel
 */
export function getCurrentScores() {
    const key = getCurrentModeKey();
    return state.leaderboardData[key] || [];
}