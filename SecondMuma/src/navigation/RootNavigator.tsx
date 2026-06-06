import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Routes } from '../constants/routes';
import SplashScreen from '../screens/Splash/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import PackageDetailScreen from '../screens/Packages/PackageDetailScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import PaymentScreen from '../screens/Checkout/PaymentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName={Routes.SPLASH}
            screenOptions={{ headerShown: false }}>
            {/* ── Intro ── */}
            <Stack.Screen name={Routes.SPLASH} component={SplashScreen} />

            {/* ── Auth ── */}
            <Stack.Screen name={Routes.LOGIN} component={LoginScreen} />
            <Stack.Screen name={Routes.REGISTER} component={RegisterScreen} />
            <Stack.Screen name={Routes.OTP} component={OTPScreen} />

            {/* ── App ── */}
            <Stack.Screen name={Routes.HOME} component={HomeScreen} />
            <Stack.Screen name={Routes.PACKAGE_DETAIL} component={PackageDetailScreen} />
            <Stack.Screen name={Routes.CHECKOUT} component={CheckoutScreen} />
            <Stack.Screen name={Routes.PAYMENT} component={PaymentScreen} />
        </Stack.Navigator>
    );
};

export default RootNavigator;
