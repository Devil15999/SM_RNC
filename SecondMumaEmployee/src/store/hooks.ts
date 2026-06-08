import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed version of `useDispatch`.
 * Use this throughout the app instead of plain `useDispatch`.
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(loginStart());
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of `useSelector`.
 * Use this throughout the app instead of plain `useSelector`.
 *
 * @example
 * const user = useAppSelector(state => state.auth.user);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
