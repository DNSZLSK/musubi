import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                fetch: 'readonly',
                Audio: 'readonly',
                AudioContext: 'readonly',
                webkitAudioContext: 'readonly',
                URLSearchParams: 'readonly',
                getComputedStyle: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'indent': ['error', 4],
            'no-multiple-empty-lines': ['error', { max: 1 }]
        }
    }
];