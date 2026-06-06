/**
 * Store barrel export
 * Import everything store-related from this single path:
 *   import { store, useAppDispatch, useAppSelector } from '../store';
 */
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';

// Auth slice actions
export {
    sendOtpStart,
    sendOtpSuccess,
    sendOtpFailure,
    verifyOtpStart,
    verifyOtpSuccess,
    verifyOtpFailure,
    logout,
    clearError,
    updateProfileSuccess,
} from './slices/authSlice';
export type { User } from './slices/authSlice';

// App slice actions
export { setAppReady, setTheme, setGlobalLoading } from './slices/appSlice';
