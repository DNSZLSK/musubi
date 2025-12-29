// ============================================================================
// STATE - État global centralisé de l'application
// ============================================================================

import { CHRONO_CONFIG } from './constants.js';

// État du jeu
export const state = {
    // Paramètres
    starsEnabled: true,
    musicMuted: false,
    currentTheme: 0,

    // Partie en cours
    gridSize: 4,
    currentScore: 0,
    puzzlesSolved: 0,

    // Données du puzzle
    circles: [],
    numbers: [],
    animations: [],

    // Chrono
    chronoEnabled: false,
    chronoRemaining: CHRONO_CONFIG.startTime,
    chronoInterval: null,
    chronoActive: false,

    // Utilisateur
    nickname: localStorage.getItem('musubi_nickname') || 'PLAYER',
    nicknameInput: '',
    nicknameActive: false,

    // Leaderboard
    currentLeaderboardMode: 0,
    currentLeaderboardChrono: 0,
    leaderboardData: {
        training: [],
        challenge: [],
        expert: [],
        training_chrono: [],
        challenge_chrono: [],
        expert_chrono: []
    },

    // Audio
    currentTrack: 0,
    musicStarted: false,
    audioContext: null,
    beepBuffer: null
};

// Fonctions pour modifier l'état proprement
export function resetGame() {
    state.currentScore = 0;
    state.puzzlesSolved = 0;
    state.circles = [];
    state.numbers = [];
    state.animations = [];
}

export function resetChrono() {
    state.chronoRemaining = CHRONO_CONFIG.startTime;
    state.chronoActive = false;
    if (state.chronoInterval) {
        clearInterval(state.chronoInterval);
        state.chronoInterval = null;
    }
}

export function saveNickname(name) {
    state.nickname = name || 'PLAYER';
    localStorage.setItem('musubi_nickname', state.nickname);
}
