/**
 * Navigation type definitions
 * Central place for all navigator param lists.
 */

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    OTP: {
        mobile: string;
        isForgotPassword?: boolean;
    };
    ForgotPassword: undefined;
    Home: undefined;
    Checkin: {
        appointmentId: string;
        customerName: string;
        customerMobile: string;
    };
    Profile: undefined;
};
