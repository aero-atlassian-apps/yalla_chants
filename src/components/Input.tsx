import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
}

import { useColors } from '../constants/Colors';

export const Input = ({ label, error, style, onFocus, onBlur, value, ...props }: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const Colors = useColors();
    const styles = createStyles(Colors);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const hasValue = value && value.length > 0;
    const labelActive = isFocused || hasValue;

    return (
        <View style={[styles.container, style]}>
            <View style={[
                styles.inputContainer,
                isFocused && styles.focusedInput,
                !!error && styles.errorInput
            ]}>
                <Text style={[
                    styles.label,
                    labelActive && styles.activeLabel
                ]}>
                    {label}
                </Text>
                <TextInput
                    style={styles.input}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholderTextColor="transparent"
                    value={value}
                    accessibilityLabel={label}
                    accessibilityHint={error}
                    accessibilityState={{ invalid: !!error }}
                    {...props}
                />
            </View>
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>
                </View>
            )}
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    inputContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    focusedInput: {
        borderColor: Colors.primary,
        backgroundColor: Colors.surfaceLight,
    },
    errorInput: {
        borderColor: Colors.error,
    },
    label: {
        position: 'absolute',
        left: 16,
        color: Colors.textSecondary,
        fontSize: 16,
    },
    activeLabel: {
        top: 8,
        fontSize: 12,
        color: Colors.primary,
    },
    input: {
        color: Colors.text,
        fontSize: 16,
        marginTop: 16,
        height: 24,
        padding: 0,
    },
    errorContainer: {
        marginTop: 4,
        marginLeft: 4,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
    },
});
