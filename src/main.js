// ============================================================================
// MAIN - Point d'entrée de l'application MUSUBI
// ============================================================================

import './style.css';
import { state } from './state.js';
import { THEMES } from './constants.js';
import { showScreen } from './screens/index.js';
import { initStars } from './renderer/stars.js';
import {
    initAudio,
    initAudioContext,
    playBeep,
    toggleMute,
    nextTrack,
    getBgMusic,
    getBeepSound
} from './audio/manager.js';
import { drawIcon } from './renderer/icons.js';
import { drawCenteredText } from './renderer/scanline.js';
import { startGame, handlePuzzleClick, exitGame } from './screens/game.js';
import { drawChronoToggle } from './screens/difficulty.js';
import {
    startNicknameInput,
    handleNicknameInput,
    saveCurrentNickname,
    stopNicknameInput
} from './screens/nickname.js';
import {
    nextLeaderboardMode,
    prevLeaderboardMode,
    toggleLeaderboardChrono
} from './screens/leaderboard.js';
import { handleRestart, handleBackToMenu } from './screens/gameover.js';
import { drawMenuScreen } from './screens/menu.js';

// ============================================================================
// INIT
// ============================================================================

function init() {
    initAudio();
    initStars();
    setupGlobalEvents();
    setupPreloader();
}

// ============================================================================
// GLOBAL EVENTS (EVENT DELEGATION)
// ============================================================================

function setupGlobalEvents() {

    // Init audio context on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });

    // Global click handler
    document.addEventListener('click', (e) => {

        const id = e.target.id;
        const cls = e.target.classList;

        // ------------------------------------------------
        // Beep on UI elements
        // ------------------------------------------------
        if (
            cls.contains('menu-item') ||
            cls.contains('top-icon') ||
            cls.contains('nav-arrow')
        ) {
            playBeep();
        }

        // ------------------------------------------------
        // MENU
        // ------------------------------------------------
        if (id === 'menu-newgame') {
            if (state.nickname === 'PLAYER') {
                showScreen('nickname');
            } else {
                showScreen('difficulty');
            }
        }

        if (id === 'menu-leaderboard') showScreen('leaderboard');
        if (id === 'menu-nickname') showScreen('nickname');
        if (id === 'menu-howto') showScreen('howto');

        if (id === 'menu-color') {
            state.currentTheme = (state.currentTheme + 1) % THEMES.length;
            document.body.className = THEMES[state.currentTheme];
            drawMenuScreen();
        }

        // ------------------------------------------------
        // DIFFICULTY
        // ------------------------------------------------
        if (id === 'diff-training') startGame(4);
        if (id === 'diff-challenge') startGame(5);
        if (id === 'diff-expert') startGame(6);
        if (id === 'diff-back') showScreen('menu');

        if (id === 'chrono-toggle') {
            state.chronoEnabled = !state.chronoEnabled;
            drawChronoToggle('chrono-toggle', state.chronoEnabled);
        }

        // ------------------------------------------------
        // GAME
        // ------------------------------------------------
        if (id === 'icon-home') exitGame();

        if (id === 'icon-stars') {
            state.starsEnabled = !state.starsEnabled;
            drawIcon('icon-stars', 'stars', state.starsEnabled);
        }

        if (id === 'icon-music') {
            toggleMute();
            drawIcon('icon-music', 'music', !state.musicMuted);
        }

        if (id === 'equalizer') nextTrack();

        // ------------------------------------------------
        // HOW TO
        // ------------------------------------------------
        if (id === 'howto-back') showScreen('menu');

        // ------------------------------------------------
        // NICKNAME
        // ------------------------------------------------
        if (id === 'nickname-input-canvas') startNicknameInput();

        if (id === 'nickname-save') {
            saveCurrentNickname();
            setTimeout(() => showScreen('menu'), 1500);
        }

        if (id === 'nickname-back') {
            stopNicknameInput();
            showScreen('menu');
        }

        // ------------------------------------------------
        // LEADERBOARD
        // ------------------------------------------------
        if (id === 'lb-chrono-title') toggleLeaderboardChrono();
        if (id === 'lb-prev') prevLeaderboardMode();
        if (id === 'lb-next') nextLeaderboardMode();
        if (id === 'leaderboard-back') showScreen('menu');

        // ------------------------------------------------
        // GAME OVER
        // ------------------------------------------------
        if (id === 'gameover-restart') handleRestart();
        if (id === 'gameover-menu') handleBackToMenu();
    });

    // ------------------------------------------------
    // CANVAS / INPUT EVENTS (need direct binding)
    // ------------------------------------------------
    document.addEventListener('click', (e) => {
        if (e.target.id === 'puzzle-canvas') {
            handlePuzzleClick(e);
        }
    });

    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.addEventListener('input', (e) => {
            handleNicknameInput(e.target.value);
        });

        hiddenInput.addEventListener('blur', () => {
            if (state.nicknameActive) {
                import('./screens/nickname.js').then(m => m.drawNicknameInput());
            }
        });
    }
}

// ============================================================================
// PRELOADER (inchangé, fonctionnel)
// ============================================================================

function setupPreloader() {
    const preloader = document.getElementById('preloader');
    const canvas = document.getElementById('preloader-canvas');
    const gameContainer = document.getElementById('game-container');

    if (!preloader || !canvas || !gameContainer) {
        showScreen('menu');
        return;
    }

    const ctx = canvas.getContext('2d');
    const assetsToLoad = 3;
    let loaded = 0;
    let progress = 0;
    let target = 0;
    let done = false;

    function update() {
        if (done) return;
        loaded++;
        target = (loaded / assetsToLoad) * 100;
        if (loaded >= assetsToLoad) {
            target = 100;
            setTimeout(finish, 500);
        }
    }

    function finish() {
        if (done) return;
        done = true;
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            gameContainer.style.display = 'flex';
            showScreen('menu');
        }, 500);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenteredText(ctx, 'LOADING', canvas.width, 15, 4, '#5c5');
        drawCenteredText(ctx, `${Math.floor(progress)}%`, canvas.width, 55, 3, '#5c5');

        if (progress < target) progress += 2;
        if (!done) requestAnimationFrame(draw);
    }

    draw();

    const logo = document.getElementById('logo-img');
    if (logo) {
        const src = logo.src;
        logo.src = '';
        logo.onload = update;
        logo.onerror = update;
        logo.src = src;
    } else update();

    const bg = getBgMusic();
    const beep = getBeepSound();

    bg ? (bg.oncanplaythrough = update) : update();
    beep ? (beep.oncanplaythrough = update) : update();

    setTimeout(() => !done && finish(), 5000);
}

// ============================================================================
// START
// ============================================================================

document.addEventListener('DOMContentLoaded', init);
