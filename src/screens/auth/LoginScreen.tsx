import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useColors } from '../../constants/Colors';
import { AppBackground } from '../../components/AppBackground';
import { MosaicLoading } from '../../components/MosaicLoading';

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { signIn, loading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const Colors = useColors();
    const styles = createStyles(Colors);

    const handleLogin = async () => {
        console.log('LoginScreen: handleLogin called', { email });

        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        console.log('LoginScreen: calling signIn');
        const { error } = await signIn(email, password);

        if (error) {
            console.error('LoginScreen: signIn error', error);
            Alert.alert('Login Failed', error.message || 'Invalid email or password');
        } else {
            console.log('LoginScreen: signIn success');
        }
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

                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue to Yalla Chants</Text>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            variant="primary"
                            style={styles.button}
                        />

                        <Button
                            title="Continue as Guest"
                            onPress={async () => {
                                await useAuthStore.getState().signInAnonymously();
                            }}
                            variant="outline"
                            style={styles.guestButton}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
