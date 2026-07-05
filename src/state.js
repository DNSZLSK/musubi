// ============================================================================
// STATE - État global centralisé de l'application
// ============================================================================

import { CHRONO_CONFIG } from './constants.js';

// Lit le niveau de difficulté persisté (0 est valide -> pas de `|| 0`)
function loadDifficulty() {
    const v = Number(localStorage.getItem('musubi_difficulty'));
    return [0, 1, 2].includes(v) ? v : 1;
}

// État du jeu
export const state = {
    // Paramètres (persistés dans localStorage)
    starsEnabled: localStorage.getItem('musubi_stars') !== 'false',
    musicMuted: localStorage.getItem('musubi_muted') === 'true',
    currentTheme: Number(localStorage.getItem('musubi_theme')) || 0,
    // Difficulté = rareté des indices (0 ALL, 1 SOME, 2 FEW)
    difficulty: loadDifficulty(),

    scoreSubmitted: false,

    // Navigation clavier
    currentScreen: 'menu',
    selectedIndex: 0,

    // Partie en cours
    gridSize: 4,
    currentScore: 0,
    puzzlesSolved: 0,

    // Données du puzzle
    circles: [],
    numbers: [],
    clueVisible: [], // masque : quels indices sont affichés (le reste est à déduire)
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
        expert_chrono: [],
        daily: []
    },

    // Cache pour preload leaderboard
    leaderboardCache: {
        training: [],
        challenge: [],
        expert: [],
        training_chrono: [],
        challenge_chrono: [],
        expert_chrono: [],
        daily: []
    },

    // Audio
    currentTrack: 0,
    musicStarted: false,
    audioContext: null,
    beepBuffer: null,

    // Melt animation
    meltActive: false,
    meltProgress: 0,
    meltPhase: 0, // 0 = fill, 1 = fade

    // Hints (indices révélés)
    hintsUsed: 0,

    // Mode daily (puzzle du jour seedé)
    dailyMode: false,
    dailyElapsed: 0,
    dailyInterval: null,
    dailyAlreadyDone: false,

};

// Fonctions pour modifier l'état proprement
export function resetGame() {
    state.currentScore = 0;
    state.puzzlesSolved = 0;
    state.circles = [];
    state.numbers = [];
    state.animations = [];
    state.scoreSubmitted = false;
    state.meltActive = false;
    state.meltProgress = 0;
    state.meltPhase = 0;
    state.hintsUsed = 0;
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

export function saveSettings() {
    localStorage.setItem('musubi_stars', String(state.starsEnabled));
    localStorage.setItem('musubi_muted', String(state.musicMuted));
    localStorage.setItem('musubi_theme', String(state.currentTheme));
    localStorage.setItem('musubi_difficulty', String(state.difficulty));
}