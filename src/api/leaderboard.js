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
        const response = await fetch(LEADERBOARD_URL, {
            method: 'GET',
            redirect: 'follow'
        });

        const data = await response.json();

        // Trie les scores par ordre décroissant
        state.leaderboardData.training = (data.training || []).sort((a, b) => b.score - a.score);
        state.leaderboardData.challenge = (data.challenge || []).sort((a, b) => b.score - a.score);
        state.leaderboardData.expert = (data.expert || []).sort((a, b) => b.score - a.score);
        state.leaderboardData.training_chrono = (data.training_chrono || []).sort(
            (a, b) => b.score - a.score
        );
        state.leaderboardData.challenge_chrono = (data.challenge_chrono || []).sort(
            (a, b) => b.score - a.score
        );
        state.leaderboardData.expert_chrono = (data.expert_chrono || []).sort(
            (a, b) => b.score - a.score
        );

        return true;
    } catch (error) {
        console.error('Erreur fetch leaderboard:', error);
        return false;
    }
}

/**
 * Soumet un score au leaderboard
 */
export async function submitScore(score, gridSize) {
    if (score <= 0) return false;

    try {
        const modeNames = {
            4: 'training',
            5: 'challenge',
            6: 'expert'
        };

        const modeStr = modeNames[gridSize] || 'training';
        const finalMode = state.chronoEnabled ? `${modeStr}_chrono` : modeStr;

        console.log('Submit score:', { score, gridSize, chronoEnabled: state.chronoEnabled, finalMode, nickname: state.nickname });

        const params = new URLSearchParams({
            action: 'submit',
            nickname: state.nickname,
            score: score,
            mode: finalMode
        });

        const url = `${LEADERBOARD_URL}?${params.toString()}`;
        console.log('URL:', url);
        
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        console.log('Response:', response.status);

        return true;
    } catch (error) {
        console.error('Erreur submit score:', error);
        return false;
    }
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