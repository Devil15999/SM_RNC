import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';

// ── Store ──────────────────────────────────────────────────────────────────────
export const store = configureStore({
    reducer: {
        auth: authReducer,
        app: appReducer,
    },
    // Middleware: redux-thunk is included automatically by RTK
    // Add any additional middleware here if needed (e.g. redux-logger in dev)
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: true, // Warn if non-serializable values are dispatched
        }),
});

// ── Inferred Types ─────────────────────────────────────────────────────────────
// Derive RootState and AppDispatch from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
