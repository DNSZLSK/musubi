// ============================================================================
// TUTORIAL - Apprentissage en jouant (lancé depuis HOW TO PLAY)
// ============================================================================
//
// Deux mini-grilles fixes, vérifiées par force brute :
//   1. 3x3, tous les nombres : une seule solution par les nombres seuls.
//   2. 4x4, un "?" : 4 solutions avec les nombres seuls, UNE avec la règle du
//      nœud -> le joueur découvre que la liaison sert vraiment à trancher.

import { state } from '../state.js';
import { computeNumbers } from '../puzzle/generator.js';
import { getColor } from '../utils.js';
import { drawCenteredText } from '../renderer/scanline.js';

const STEPS = [
    {
        size: 3,
        solution: [0, 1, 1, 1, 1, 0, 1, 1, 0],
        visible: [
            [true, true],
            [true, true]
        ],
        lines: ['TAP CIRCLES TO FILL THEM', 'EACH NUMBER COUNTS THE', 'FILLED CIRCLES AROUND IT']
    },
    {
        size: 4,
        solution: [1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
        visible: [
            [true, true, false],
            [true, true, true],
            [true, true, true]
        ],
        lines: ['? IS A HIDDEN NUMBER', 'ALL FILLED CIRCLES MUST', 'BE LINKED IN ONE KNOT']
    }
];

export const TUTORIAL_LENGTH = STEPS.length;

/**
 * Charge l'étape `step` du tutoriel dans l'état de jeu.
 * @returns {boolean} faux si le tutoriel est terminé
 */
export function loadTutorialStep(step) {
    const def = STEPS[step];
    if (!def) return false;
    const { size, solution, visible } = def;

    state.tutorialStep = step;
    state.gridSize = size;
    state.numbers = computeNumbers(solution, size);
    state.clueVisible = visible.map((row) => row.slice());
    state.history = [];
    state.circles = [];
    for (let y = 0; y < size; y++) {
        state.circles[y] = [];
        for (let x = 0; x < size; x++) {
            state.circles[y][x] = { filled: false, solution: solution[y * size + x] === 1 };
        }
    }
    return true;
}

/**
 * Dessine la consigne de l'étape en cours (vide hors tutoriel).
 */
export function drawTutorialText() {
    const canvas = document.getElementById('tutorial-text');
    if (!canvas) return;
    const active = state.tutorialStep >= 0;
    canvas.style.display = active ? 'block' : 'none';
    if (!active) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = getColor();
    STEPS[state.tutorialStep].lines.forEach((line, i) => {
        drawCenteredText(ctx, line, canvas.width, 4 + i * 26, 2, color);
    });
    canvas.setAttribute('aria-label', STEPS[state.tutorialStep].lines.join(' '));
}
