import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

import { useColors } from '../../constants/Colors';

import { AppBackground } from '../../components/AppBackground';

export const RegisterScreen = () => {
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const { signUp, loading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const Colors = useColors();
    const styles = createStyles(Colors);

    const handleRegister = async () => {
        console.log('RegisterScreen: handleRegister called', { email });

        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        console.log('RegisterScreen: calling signUp');
        const { error } = await signUp(email, password, 'MA');

        if (error) {
            console.error('RegisterScreen: signUp error', error);
            Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
        } else {
            console.log('RegisterScreen: signUp success');
            Alert.alert('Success', 'Account created! You can now sign in.');
            navigation.navigate('Login');
        }
    };

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

                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the Yalla Chants community</Text>

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
                            placeholder="Create a password"
                            secureTextEntry
                        />
                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm your password"
                            secureTextEntry
                        />

                        <Button
                            title="Sign Up"
                            onPress={handleRegister}
                            loading={loading}
                            variant="primary"
                            style={styles.button}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.link}>Sign In</Text>
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
    button: {
        marginTop: 8,
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
