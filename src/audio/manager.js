// ============================================================================
// AUDIO MANAGER - Gestion de la musique et des sons
// ============================================================================

import { state } from '../state.js';
import { AUDIO_CONFIG } from '../constants.js';

let bgMusic = null;
let beepSound = null;

/**
 * Initialise l'audio
 */
export function initAudio() {
    bgMusic = new Audio(AUDIO_CONFIG.musicTracks[0]);
    bgMusic.loop = false;
    bgMusic.volume = AUDIO_CONFIG.defaultVolume;

    bgMusic.addEventListener('ended', () => {
        state.currentTrack = (state.currentTrack + 1) % AUDIO_CONFIG.musicTracks.length;
        bgMusic.src = AUDIO_CONFIG.musicTracks[state.currentTrack];
        bgMusic.play().catch(() => {});
    });

    beepSound = new Audio(AUDIO_CONFIG.beepSound);
    beepSound.volume = AUDIO_CONFIG.beepVolume;
}

/**
 * Initialise le contexte audio (doit être appelé après une interaction utilisateur)
 */
export async function initAudioContext() {
    if (state.audioContext) return;

    try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch(AUDIO_CONFIG.beepSound);
        const arrayBuffer = await response.arrayBuffer();
        state.beepBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.warn('Audio context init failed:', e);
    }
}

/**
 * Joue le son beep
 */
export function playBeep() {
    if (state.audioContext && state.beepBuffer) {
        const source = state.audioContext.createBufferSource();
        const gain = state.audioContext.createGain();
        gain.gain.value = AUDIO_CONFIG.beepVolume;
        source.buffer = state.beepBuffer;
        source.connect(gain);
        gain.connect(state.audioContext.destination);
        source.start(0);
    } else if (beepSound) {
        beepSound.currentTime = 0;
        beepSound.play().catch(() => {});
    }
}

/**
 * Démarre la musique avec fondu
 */
export function startMusicWithFade() {
    if (state.musicStarted || !bgMusic) return;

    bgMusic.volume = 0;
    bgMusic
        .play()
        .then(() => {
            state.musicStarted = true;

            const eq = document.getElementById('equalizer');
            if (eq && !state.musicMuted) {
                eq.classList.remove('paused');
            }

            let vol = 0;
            const fadeIn = setInterval(() => {
                vol += 0.02;
                if (vol >= AUDIO_CONFIG.defaultVolume) {
                    vol = AUDIO_CONFIG.defaultVolume;
                    clearInterval(fadeIn);
                }
                if (!state.musicMuted) {
                    bgMusic.volume = vol;
                }
            }, 80);
        })
        .catch(() => {});
}

/**
 * Arrête la musique
 */
export function stopMusic() {
    if (!bgMusic) return;

    bgMusic.pause();
    bgMusic.currentTime = 0;
    state.musicStarted = false;

    const eq = document.getElementById('equalizer');
    if (eq) {
        eq.classList.add('paused');
    }
}

/**
 * Bascule le mute de la musique
 */
export function toggleMute() {
    state.musicMuted = !state.musicMuted;

    if (bgMusic) {
        bgMusic.muted = state.musicMuted;
    }

    const eq = document.getElementById('equalizer');
    if (eq) {
        state.musicMuted ? eq.classList.add('paused') : eq.classList.remove('paused');
    }
}

/**
 * Passe à la piste suivante
 */
export function nextTrack() {
    if (!bgMusic) return;

    state.currentTrack = (state.currentTrack + 1) % AUDIO_CONFIG.musicTracks.length;
    bgMusic.src = AUDIO_CONFIG.musicTracks[state.currentTrack];
    bgMusic.play().catch(() => {});
}

/**
 * Retourne l'instance de la musique (pour le preloader)
 */
export function getBgMusic() {
    return bgMusic;
}

/**
 * Retourne l'instance du beep (pour le preloader)
 */
export function getBeepSound() {
    return beepSound;
}
