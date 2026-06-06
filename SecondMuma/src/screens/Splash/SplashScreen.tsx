import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Routes } from '../../constants/routes';
import { Colors } from '../../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace(Routes.LOGIN);
        }, 2200);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Logo circle */}
            <View style={styles.logoCircle}>
                {/* Simple SVG-like hands icon using Views */}
                <View style={styles.iconWrap}>
                    <View style={styles.handTop} />
                    <View style={styles.personCircle} />
                    <View style={styles.handBottom} />
                </View>
            </View>

            <Text style={styles.brand}>Second Muma</Text>
            <Text style={styles.tagline}>• Baby Care •</Text>

            <ActivityIndicator
                style={styles.loader}
                color={Colors.PRIMARY}
                size="small"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    handTop: {
        width: 60,
        height: 14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: Colors.WHITE,
        opacity: 0.9,
    },
    personCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: Colors.WHITE,
        marginVertical: 2,
    },
    handBottom: {
        width: 60,
        height: 14,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        backgroundColor: Colors.WHITE,
        opacity: 0.9,
    },
    brand: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: 0.5,
    },
    tagline: {
        marginTop: 6,
        fontSize: 13,
        color: Colors.PRIMARY,
        letterSpacing: 3,
        fontWeight: '500',
    },
    loader: {
        marginTop: 48,
    },
});

export default SplashScreen;
