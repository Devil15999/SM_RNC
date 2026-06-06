import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    token: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isOtpSent: boolean;
    isLoading: boolean;
    error: string | null;
}

// ── Initial State ──────────────────────────────────────────────────────────────
const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isOtpSent: false,
    isLoading: false,
    error: null,
};

// ── Slice ──────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // ── Send OTP ──────────────────────────────────────────────────────────────
        sendOtpStart(state) {
            state.isLoading = true;
            state.error = null;
        },
        sendOtpSuccess(state) {
            state.isLoading = false;
            state.isOtpSent = true;
        },
        sendOtpFailure(state, action: PayloadAction<string>) {
            state.isLoading = false;
            state.error = action.payload;
        },

        // ── Verify OTP (Login + Register share this) ──────────────────────────────
        verifyOtpStart(state) {
            state.isLoading = true;
            state.error = null;
        },
        verifyOtpSuccess(state, action: PayloadAction<User>) {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
            state.isOtpSent = false;
            state.error = null;
        },
        verifyOtpFailure(state, action: PayloadAction<string>) {
            state.isLoading = false;
            state.error = action.payload;
        },

        // ── Session ───────────────────────────────────────────────────────────────
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            state.isOtpSent = false;
            state.isLoading = false;
            state.error = null;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const {
    sendOtpStart,
    sendOtpSuccess,
    sendOtpFailure,
    verifyOtpStart,
    verifyOtpSuccess,
    verifyOtpFailure,
    logout,
    clearError,
} = authSlice.actions;

export default authSlice.reducer;
