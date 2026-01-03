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
// INITIALISATION
// ============================================================================

function init() {
    initAudio();
    initStars();
    setupEventListeners();
    setupPreloader();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    document.addEventListener('click', () => initAudioContext(), { once: true });

    document.addEventListener('click', (e) => {
        if (
            e.target.classList.contains('menu-item') ||
            e.target.classList.contains('top-icon') ||
            e.target.classList.contains('nav-arrow')
        ) {
            playBeep();
        }
    });

    // MENU
    document.getElementById('menu-newgame')?.addEventListener('click', () => {
        if (state.nickname === 'PLAYER') {
            showScreen('nickname');
        } else {
            showScreen('difficulty');
        }
    });
    
    document.getElementById('menu-leaderboard')?.addEventListener('click', () => showScreen('leaderboard'));
    document.getElementById('menu-nickname')?.addEventListener('click', () => showScreen('nickname'));
    document.getElementById('menu-howto')?.addEventListener('click', () => showScreen('howto'));
    document.getElementById('menu-color')?.addEventListener('click', () => {
        state.currentTheme = (state.currentTheme + 1) % THEMES.length;
        document.body.className = THEMES[state.currentTheme];
        drawMenuScreen();
    });

    // DIFFICULTY
    document.getElementById('diff-training')?.addEventListener('click', () => startGame(4));
    document.getElementById('diff-challenge')?.addEventListener('click', () => startGame(5));
    document.getElementById('diff-expert')?.addEventListener('click', () => startGame(6));
    document.getElementById('diff-back')?.addEventListener('click', () => showScreen('menu'));
    document.getElementById('chrono-toggle')?.addEventListener('click', () => {
        state.chronoEnabled = !state.chronoEnabled;
        drawChronoToggle('chrono-toggle', state.chronoEnabled);
        playBeep();
    });

    // GAME
    document.getElementById('puzzle-canvas')?.addEventListener('click', handlePuzzleClick);
    document.getElementById('icon-home')?.addEventListener('click', exitGame);
    document.getElementById('icon-stars')?.addEventListener('click', () => {
        state.starsEnabled = !state.starsEnabled;
        drawIcon('icon-stars', 'stars', state.starsEnabled);
    });
    document.getElementById('icon-music')?.addEventListener('click', () => {
        toggleMute();
        drawIcon('icon-music', 'music', !state.musicMuted);
    });
    document.getElementById('equalizer')?.addEventListener('click', nextTrack);

    // HOWTO
    document.getElementById('howto-back')?.addEventListener('click', () => showScreen('menu'));

    // NICKNAME
    document.getElementById('nickname-input-canvas')?.addEventListener('click', startNicknameInput);
    document.getElementById('hidden-input')?.addEventListener('input', (e) => {
        handleNicknameInput(e.target.value);
    });
    document.getElementById('hidden-input')?.addEventListener('blur', () => {
        if (state.nicknameActive) {
            import('./screens/nickname.js').then((m) => m.drawNicknameInput());
        }
    });
    document.getElementById('nickname-save')?.addEventListener('click', () => {
        saveCurrentNickname();
        // Attend 1.5s pour montrer "SAVED!" avant de revenir au menu
        setTimeout(() => showScreen('menu'), 1500);
    });
    document.getElementById('nickname-back')?.addEventListener('click', () => {
        stopNicknameInput();
        showScreen('menu');
    });

    // LEADERBOARD
    document.getElementById('lb-chrono-title')?.addEventListener('click', () => {
        toggleLeaderboardChrono();
        playBeep();
    });
    document.getElementById('lb-prev')?.addEventListener('click', () => {
        prevLeaderboardMode();
        playBeep();
    });
    document.getElementById('lb-next')?.addEventListener('click', () => {
        nextLeaderboardMode();
        playBeep();
    });
    document.getElementById('leaderboard-back')?.addEventListener('click', () => showScreen('menu'));

    // GAMEOVER
    document.getElementById('gameover-restart')?.addEventListener('click', handleRestart);
    document.getElementById('gameover-menu')?.addEventListener('click', handleBackToMenu);
}

// ============================================================================
// PRELOADER
// ============================================================================

function setupPreloader() {
    const preloader = document.getElementById('preloader');
    const preloaderCanvas = document.getElementById('preloader-canvas');
    const gameContainer = document.getElementById('game-container');

    if (!preloaderCanvas || !preloader || !gameContainer) {
        showScreen('menu');
        return;
    }

    const ctx = preloaderCanvas.getContext('2d');
    const assetsToLoad = 3;
    let loadedCount = 0;
    let preloaderDone = false;
    let progress = 0;
    let targetProgress = 0;

    function drawPreloaderFrame() {
        const color = '#5c5';
        const w = preloaderCanvas.width;
        const h = preloaderCanvas.height;

        ctx.clearRect(0, 0, w, h);
        drawCenteredText(ctx, 'LOADING', w, 15, 4, color);
        drawCenteredText(ctx, ${Math.floor(progress)}%, w, 55, 3, color);

        const bx = 30, by = 85, bw = w - 60, bh = 16;
        ctx.fillStyle = color;

        for (let py = 0; py < 2; py++) if (py % 2 === 0) ctx.fillRect(bx, by + py, bw, 1);
        for (let py = 0; py < 2; py++) if (py % 2 === 0) ctx.fillRect(bx, by + bh - 2 + py, bw, 1);
        for (let px = 0; px < 2; px++)
            for (let py = 0; py < bh; py++)
                if (py % 2 === 0) ctx.fillRect(bx + px, by + py, 1, 1);
        for (let px = 0; px < 2; px++)
            for (let py = 0; py < bh; py++)
                if (py % 2 === 0) ctx.fillRect(bx + bw - 2 + px, by + py, 1, 1);

        const fillWidth = Math.floor((bw - 8) * (progress / 100));
        if (fillWidth > 0) {
            for (let py = 0; py < bh - 8; py++) {
                if (py % 2 === 0) ctx.fillRect(bx + 4, by + 4 + py, fillWidth, 1);
            }
        }

        if (progress < targetProgress) {
            progress += 2;
            if (progress > targetProgress) progress = targetProgress;
        }

        if (!preloaderDone) requestAnimationFrame(drawPreloaderFrame);
    }

    function updateProgress() {
        if (preloaderDone) return;
        loadedCount++;
        targetProgress = (loadedCount / assetsToLoad) * 100;
        if (loadedCount >= assetsToLoad) {
            targetProgress = 100;
            setTimeout(finishPreloader, 500);
        }
    }

    function finishPreloader() {
        if (preloaderDone) return;
        preloaderDone = true;
        preloader.style.transition = 'opacity 0.5s';
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            gameContainer.style.display = 'flex';
            showScreen('menu');
        }, 500);
    }

    drawPreloaderFrame();

    // Logo - force reload pour attendre vraiment
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        const src = logoImg.src;
        logoImg.src = '';
        logoImg.onload = updateProgress;
        logoImg.onerror = updateProgress;
        logoImg.src = src;
    } else {
        updateProgress();
    }

    // Audio
    const bgMusic = getBgMusic();
    const beepSound = getBeepSound();
    let musicLoaded = false;
    let beepLoaded = false;

    function onMusicLoad() {
        if (!musicLoaded) {
            musicLoaded = true;
            updateProgress();
        }
    }

    function onBeepLoad() {
        if (!beepLoaded) {
            beepLoaded = true;
            updateProgress();
        }
    }

    if (bgMusic) {
        bgMusic.oncanplaythrough = onMusicLoad;
        bgMusic.onloadeddata = onMusicLoad;
        bgMusic.onerror = onMusicLoad;
    } else {
        onMusicLoad();
    }

    if (beepSound) {
        beepSound.oncanplaythrough = onBeepLoad;
        beepSound.onloadeddata = onBeepLoad;
        beepSound.onerror = onBeepLoad;
    } else {
        onBeepLoad();
    }

    // Timeout de secours
    setTimeout(() => {
        if (!preloaderDone) {
            targetProgress = 100;
            setTimeout(finishPreloader, 300);
        }
    }, 5000);
}

// ============================================================================
// DÉMARRAGE
// ============================================================================

document.addEventListener('DOMContentLoaded', init);
