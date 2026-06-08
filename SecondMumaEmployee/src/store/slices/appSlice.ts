import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ── Types ──────────────────────────────────────────────────────────────────────
type ThemeMode = 'light' | 'dark';

interface AppState {
    isAppReady: boolean;
    theme: ThemeMode;
    globalLoading: boolean;
}

// ── Initial State ──────────────────────────────────────────────────────────────
const initialState: AppState = {
    isAppReady: false,
    theme: 'dark',
    globalLoading: false,
};

// ── Slice ──────────────────────────────────────────────────────────────────────
const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setAppReady(state, action: PayloadAction<boolean>) {
            state.isAppReady = action.payload;
        },
        setTheme(state, action: PayloadAction<ThemeMode>) {
            state.theme = action.payload;
        },
        setGlobalLoading(state, action: PayloadAction<boolean>) {
            state.globalLoading = action.payload;
        },
    },
});

export const { setAppReady, setTheme, setGlobalLoading } = appSlice.actions;

export default appSlice.reducer;
