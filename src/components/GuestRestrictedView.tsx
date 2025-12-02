import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface GuestRestrictedViewProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    onSignIn?: () => void;
}

export const GuestRestrictedView: React.FC<GuestRestrictedViewProps> = ({
    icon = 'lock-closed',
    title,
    message,
    onSignIn,
}) => {
    const Colors = useColors();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleSignIn = () => {
        if (onSignIn) {
            onSignIn();
        } else {
            // Default behavior: navigate to Login
            // We might need to sign out first to clear guest state if handled in auth store
            // But usually navigating to Login is enough or we use a specific method
            navigation.navigate('Login');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.card}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={64} color={Colors.primary} />
                </View>

                <Text style={[styles.title, { color: Colors.white }]}>{title}</Text>
                <Text style={[styles.message, { color: 'rgba(255, 255, 255, 0.8)' }]}>{message}</Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors.primary }]}
                    onPress={handleSignIn}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.buttonText, { color: Colors.white }]}>Sign In / Sign Up</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        // Glassmorphism effect
        // backdropFilter: 'blur(10px)', // Not supported in RN directly, use BlurView if needed
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        opacity: 0.8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 4,
    },
});
