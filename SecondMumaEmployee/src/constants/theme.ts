/**
 * SecondMuma – Brand Color Theme
 * Extracted from the "Second Muma Baby Care" logo.
 *
 * Primary: Teal (#1FBDBD)
 * Background: White
 */

export const Colors = {
    // ── Brand ──────────────────────────────────────────────────────────────────
    PRIMARY: '#e91e8a',        // Pink – main brand color
    PRIMARY_DARK: '#7b2d8b',   // Purple – dark brand accent / gradient end
    PRIMARY_LIGHT: '#fdf2f8',  // Pink-50 – very light background/input highlight
    PRIMARY_MID: '#fbcfe8',    // Pink-200 – subtle borders and indicators

    // ── Backgrounds ────────────────────────────────────────────────────────────
    BACKGROUND: '#f8fafc',     // Slate-50 layout background
    SURFACE: '#ffffff',        // White cards / containers
    SURFACE_DEEP: '#fdf4f9',   // Light pink-purple tint for deep secondary tags

    // ── Text ───────────────────────────────────────────────────────────────────
    TEXT_PRIMARY: '#0f172a',   // Slate-900 high contrast text
    TEXT_SECONDARY: '#64748b', // Slate-500 muted text
    TEXT_HINT: '#94a3b8',      // Slate-400 hint/placeholder text
    TEXT_ON_PRIMARY: '#ffffff',// White text on primary buttons

    // ── States ─────────────────────────────────────────────────────────────────
    ERROR: '#dc2626',          // Darker red for error state
    SUCCESS: '#059669',        // Darker green for success state
    DISABLED: '#f1f5f9',       // Slate-100 disabled background
    DISABLED_TEXT: '#94a3b8',  // Slate-400 disabled text

    // ── Utility ────────────────────────────────────────────────────────────────
    BORDER: '#e2e8f0',         // Slate-200 borders
    DIVIDER: '#f1f5f9',        // Slate-100 divider lines
    WHITE: '#ffffff',
    SHADOW: '#e91e8a',
} as const;

export type ColorKey = keyof typeof Colors;
