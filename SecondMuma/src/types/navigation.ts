/**
 * Navigation type definitions
 * Central place for all navigator param lists.
 */

export type RootStackParamList = {
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    /**
     * OTP is shared by both Login and Register flows.
     * name & email are passed only from Register.
     */
    OTP: {
        mobile: string;
        name?: string;
        email?: string;
    };
    Home: undefined;
    PackageDetail: {
        packageType: 'mother' | 'baby' | 'muma';
    };
    Checkout: {
        packageType: 'mother' | 'baby' | 'muma';
        packageTitle: string;
        planKey: '1month' | '3month' | '6month';
        planLabel: string;
        price: number;
        emoji: string;
        accentColor: string;
    };
    Payment: {
        packageTitle: string;
        planLabel: string;
        price: number;
        emoji: string;
        accentColor: string;
        address: {
            fullName: string;
            mobile: string;
            flatNo: string;
            street: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
};
