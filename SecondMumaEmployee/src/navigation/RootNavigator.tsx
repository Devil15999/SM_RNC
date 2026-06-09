import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Routes } from '../constants/routes';
import { Colors } from '../constants/theme';
import { useAppDispatch, useAppSelector, verifyOtpSuccess } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import CheckinScreen from '../screens/Checkout/CheckinScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import HelpSupportScreen from '../screens/Profile/HelpSupportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector(state => state.auth);
    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const sessionStr = await AsyncStorage.getItem('@session_employee');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    dispatch(verifyOtpSuccess(session));
                }
            } catch (e) {
                console.log('Error restoring session:', e);
            } finally {
                setIsRestoring(false);
            }
        };
        restoreSession();
    }, [dispatch]);

    if (isRestoring) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.BACKGROUND }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    {/* ── App Stack ── */}
                    <Stack.Screen name={Routes.HOME} component={HomeScreen} />
                    <Stack.Screen name={Routes.CHECKIN} component={CheckinScreen} />
                    <Stack.Screen name={Routes.PROFILE} component={ProfileScreen} />
                    <Stack.Screen name={Routes.HELP_SUPPORT} component={HelpSupportScreen} />
                </>
            ) : (
                <>
                    {/* ── Auth Stack ── */}
                    <Stack.Screen name={Routes.LOGIN} component={LoginScreen} />
                    <Stack.Screen name={Routes.REGISTER} component={RegisterScreen} />
                    <Stack.Screen name={Routes.OTP} component={OTPScreen} />
                    <Stack.Screen name={Routes.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;
