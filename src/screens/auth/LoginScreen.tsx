import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useGuestStore } from '../../store/guestStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useColors } from '../../constants/Colors';
import { AppBackground } from '../../components/AppBackground';
import { MosaicLoading } from '../../components/MosaicLoading';
import { useTranslation } from 'react-i18next';
import { CountrySelector } from '../../components/CountrySelector';

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { signIn, loading } = useAuthStore();
    const { setGuestCountry } = useGuestStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showCountrySelector, setShowCountrySelector] = useState(false);
    const { t } = useTranslation();
    const Colors = useColors();
    const styles = createStyles(Colors);

    const handleLogin = async () => {
        console.log('LoginScreen: handleLogin called', { email });

        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }

        console.log('LoginScreen: calling signIn');
        const { error } = await signIn(email, password);

        if (error) {
            console.error('LoginScreen: signIn error', error);
            Alert.alert(t('auth.loginFailed'), error.message || t('auth.invalidCredentials'));
        } else {
            console.log('LoginScreen: signIn success');
        }
    };

    const handleGuestLogin = async () => {
        setShowCountrySelector(true);
    };

    const handleCountrySelect = async (country: any) => {
        await setGuestCountry(country.id);
        await useAuthStore.getState().signInAnonymously();
        setShowCountrySelector(false);
    };

    if (loading) {
        return <MosaicLoading />;
    }

    return (
        <AppBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../assets/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

                    <View style={styles.form}>
                        <Input
                            label={t('auth.email')}
                            value={email}
                            onChangeText={setEmail}
                            placeholder={t('auth.emailPlaceholder')}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label={t('auth.password')}
                            value={password}
                            onChangeText={setPassword}
                            placeholder={t('auth.passwordPlaceholder')}
                            secureTextEntry
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>

                        <Button
                            title={t('auth.signIn')}
                            onPress={handleLogin}
                            loading={loading}
                            variant="primary"
                            style={styles.button}
                        />

                        <Button
                            title={t('auth.continueAsGuest')}
                            onPress={handleGuestLogin}
                            variant="outline"
                            style={styles.guestButton}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.link}>{t('auth.signUp')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <CountrySelector
                visible={showCountrySelector}
                onClose={() => setShowCountrySelector(false)}
                onSelect={handleCountrySelect}
            />
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 180,
        height: 180,
        borderRadius: 36,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    button: {
        marginTop: 8,
    },
    guestButton: {
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    link: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
