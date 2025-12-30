// ============================================================================
// NICKNAME SCREEN - Écran de modification du pseudo
// ============================================================================

import { state, saveNickname } from '../state.js';
import { getColor } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';

/**
 * Dessine l'écran du nickname
 */
export function drawNicknameScreen() {
    const color = getColor();

    // Titre
    const titleCanvas = document.getElementById('nickname-title');
    if (titleCanvas) {
        const ctx = titleCanvas.getContext('2d');
        ctx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
        drawCenteredText(ctx, 'YOUR NICKNAME', titleCanvas.width, 10, 4, color);
    }

    // Input
    drawNicknameInput();

    // Bouton save
    const saveCanvas = document.getElementById('nickname-save');
    if (saveCanvas) {
        const ctx = saveCanvas.getContext('2d');
        ctx.clearRect(0, 0, saveCanvas.width, saveCanvas.height);
        drawCenteredText(ctx, 'SAVE', saveCanvas.width, 10, 3, color);
    }

    // Bouton retour
    const backCanvas = document.getElementById('nickname-back');
    if (backCanvas) {
        const ctx = backCanvas.getContext('2d');
        ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
        drawCenteredText(ctx, 'BACK', backCanvas.width, 10, 3, color);
    }
}

/**
 * Dessine l'input du nickname
 */
export function drawNicknameInput() {
    const canvas = document.getElementById('nickname-input-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const color = getColor();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const displayText = state.nicknameInput || state.nickname || 'PLAYER';
    drawCenteredText(ctx, displayText, canvas.width, 15, 3, color);

    // Ligne de soulignement
    ctx.fillStyle = color;
    for (let x = 20; x < canvas.width - 20; x += 2) {
        ctx.fillRect(x, 45, 1, 2);
    }
}

/**
 * Active l'input du nickname
 */
export function startNicknameInput() {
    state.nicknameActive = true;
    state.nicknameInput = state.nickname === 'PLAYER' ? '' : state.nickname;

    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.value = state.nicknameInput;
        hiddenInput.focus();
    }

    drawNicknameInput();
}

/**
 * Désactive l'input du nickname
 */
export function stopNicknameInput() {
    state.nicknameActive = false;

    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.blur();
    }
}

/**
 * Gère l'input du nickname
 */
export function handleNicknameInput(value) {
    state.nicknameInput = value
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 10);

    const hiddenInput = document.getElementById('hidden-input');
    if (hiddenInput) {
        hiddenInput.value = state.nicknameInput;
    }

    drawNicknameInput();
}

/**
 * Sauvegarde le nickname
 */
export function saveCurrentNickname() {
    saveNickname(state.nicknameInput);
    stopNicknameInput();
    showSavedMessage();
}

/**
 * Affiche le message "SAVED!" temporairement
 */
function showSavedMessage() {
    const saveCanvas = document.getElementById('nickname-save');
    if (!saveCanvas) return;

    const ctx = saveCanvas.getContext('2d');
    const color = getColor();

    // Affiche "SAVED!"
    ctx.clearRect(0, 0, saveCanvas.width, saveCanvas.height);
    drawCenteredText(ctx, 'SAVED!', saveCanvas.width, 10, 3, color);

    // Revient à "SAVE" après 1.5 secondes
    setTimeout(() => {
        ctx.clearRect(0, 0, saveCanvas.width, saveCanvas.height);
        drawCenteredText(ctx, 'SAVE', saveCanvas.width, 10, 3, color);
    }, 1500);
}