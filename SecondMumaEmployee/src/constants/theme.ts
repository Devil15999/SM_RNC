/**
 * SecondMuma – Brand Color Theme
 * Extracted from the "Second Muma Baby Care" logo.
 *
 * Primary: Teal (#1FBDBD)
 * Background: White
 */

export const Colors = {
    // ── Brand ──────────────────────────────────────────────────────────────────
    PRIMARY: '#1FBDBD',        // Teal – main brand color (logo)
    PRIMARY_DARK: '#179898',   // Darker teal – pressed states, borders
    PRIMARY_LIGHT: '#E6F8F8',  // Very light teal – input backgrounds, cards
    PRIMARY_MID: '#A8E0E0',    // Mid teal – dividers, subtle borders

    // ── Backgrounds ────────────────────────────────────────────────────────────
    BACKGROUND: '#FFFFFF',     // Pure white
    SURFACE: '#F4FBFB',        // Off-white teal tint – cards, containers
    SURFACE_DEEP: '#E6F8F8',   // Deeper tint – tag backgrounds

    // ── Text ───────────────────────────────────────────────────────────────────
    TEXT_PRIMARY: '#0D3333',   // Near-black with teal tone
    TEXT_SECONDARY: '#4A7A7A', // Muted teal-grey
    TEXT_HINT: '#92B8B8',      // Placeholder / hint text
    TEXT_ON_PRIMARY: '#FFFFFF',// White text on teal buttons

    // ── States ─────────────────────────────────────────────────────────────────
    ERROR: '#D94F4F',
    SUCCESS: '#27AE60',
    DISABLED: '#C8E6E6',
    DISABLED_TEXT: '#8FBCBC',

    // ── Utility ────────────────────────────────────────────────────────────────
    BORDER: '#C8E6E6',
    DIVIDER: '#E0F2F2',
    WHITE: '#FFFFFF',
    SHADOW: '#1FBDBD',
} as const;

export type ColorKey = keyof typeof Colors;
