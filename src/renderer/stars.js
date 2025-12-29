// ============================================================================
// STARS - Animation du fond étoilé
// ============================================================================

import { hexToRgb, getColor } from '../utils.js';
import { state } from '../state.js';

const starLayers = [
    { stars: [], speed: 0.1, size: 3, count: 12, alpha: 0.2 },
    { stars: [], speed: 0.25, size: 4, count: 10, alpha: 0.3 },
    { stars: [], speed: 0.5, size: 5, count: 8, alpha: 0.45 },
    { stars: [], speed: 0.9, size: 7, count: 5, alpha: 0.6 },
    { stars: [], speed: 1.4, size: 9, count: 3, alpha: 0.8 }
];

let starsCanvas = null;
let starsCtx = null;

/**
 * Initialise le canvas des étoiles
 */
export function initStars() {
    starsCanvas = document.getElementById('stars-canvas');
    if (!starsCanvas) return;

    starsCtx = starsCanvas.getContext('2d');
    resizeStars();
    window.addEventListener('resize', resizeStars);
    animateStars();
}

/**
 * Redimensionne le canvas des étoiles
 */
function resizeStars() {
    if (!starsCanvas) return;

    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;

    // Réinitialise les positions des étoiles
    starLayers.forEach((layer) => {
        layer.stars = [];
        for (let i = 0; i < layer.count; i++) {
            layer.stars.push({
                x: Math.random() * starsCanvas.width,
                y: Math.random() * starsCanvas.height
            });
        }
    });
}

/**
 * Anime les étoiles
 */
function animateStars() {
    if (!starsCtx || !starsCanvas) {
        requestAnimationFrame(animateStars);
        return;
    }

    // Fond noir
    starsCtx.fillStyle = '#000';
    starsCtx.fillRect(0, 0, starsCanvas.width, starsCanvas.height);

    // Si étoiles désactivées, on arrête là
    if (!state.starsEnabled) {
        requestAnimationFrame(animateStars);
        return;
    }

    const rgb = hexToRgb(getColor());
    const centerX = starsCanvas.width / 2;
    const centerY = starsCanvas.height / 2;
    const gameZone = Math.min(starsCanvas.width, starsCanvas.height) * 0.3;
    const gameScreen = document.getElementById('game-screen');
    const inGame = gameScreen && gameScreen.classList.contains('active');

    starLayers.forEach((layer) => {
        layer.stars.forEach((star) => {
            let alpha = layer.alpha;

            // Assombrit les étoiles au centre pendant le jeu
            if (inGame) {
                const dx = star.x - centerX;
                const dy = star.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < gameZone) {
                    alpha = layer.alpha * (0.15 + (dist / gameZone) * 0.85);
                }
            }

            starsCtx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
            starsCtx.fillRect(Math.floor(star.x), Math.floor(star.y), layer.size, layer.size);

            // Déplace l'étoile vers le bas
            star.y += layer.speed;
            if (star.y > starsCanvas.height + layer.size) {
                star.y = -layer.size * 2;
                star.x = Math.random() * starsCanvas.width;
            }
        });
    });

    requestAnimationFrame(animateStars);
}
