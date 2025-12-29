// ============================================================================
// SCREENS - Gestion de la navigation entre écrans
// ============================================================================

import { drawMenuScreen } from './menu.js';
import { drawDifficultyScreen } from './difficulty.js';
import { drawGameScreen } from './game.js';
import { drawHowtoScreen } from './howto.js';
import { drawNicknameScreen, stopNicknameInput } from './nickname.js';
import { drawLeaderboardScreen } from './leaderboard.js';
import { drawGameoverScreen } from './gameover.js';

/**
 * Affiche un écran
 */
export function showScreen(screenId) {
    // Cache tous les écrans
    document.querySelectorAll('.screen').forEach((screen) => {
        screen.classList.remove('active');
    });

    // Affiche l'écran demandé
    const targetScreen = document.getElementById(`${screenId}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Arrête l'input nickname si on quitte cet écran
    if (screenId !== 'nickname') {
        stopNicknameInput();
    }

    // Dessine l'écran
    switch (screenId) {
    case 'menu':
        drawMenuScreen();
        break;
    case 'difficulty':
        drawDifficultyScreen();
        break;
    case 'game':
        drawGameScreen();
        break;
    case 'howto':
        drawHowtoScreen();
        break;
    case 'nickname':
        drawNicknameScreen();
        break;
    case 'leaderboard':
        drawLeaderboardScreen();
        break;
    case 'gameover':
        drawGameoverScreen();
        break;
    }
}
