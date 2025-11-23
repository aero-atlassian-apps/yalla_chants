import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useColors } from '../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    style,
    textStyle,
}: ButtonProps) => {
    const Colors = useColors();

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
        onPress();
    };

    const getBackgroundColor = () => {
        if (disabled) return Colors.surfaceLight;
        switch (variant) {
            case 'primary': return Colors.primary;
            case 'secondary': return Colors.surface;
            case 'outline': return 'transparent';
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.textSecondary;
        switch (variant) {
            case 'primary': return Colors.background; // Dark text on Gold button
            case 'secondary': return Colors.text;
            case 'outline': return Colors.primary;
            default: return Colors.background;
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={loading || disabled}
            activeOpacity={0.8}
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: variant === 'outline' ? Colors.primary : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
