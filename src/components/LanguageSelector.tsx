import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { changeLanguage, isRTL } from '../i18n/i18n';
import { AnimatedTouchable } from './AnimatedTouchable';

interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const LanguageSelector = () => {
    const { t, i18n } = useTranslation();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const currentLanguage = i18n.language;

    const handleLanguageChange = async (languageCode: string) => {
        const currentIsRTL = isRTL(currentLanguage);
        const newIsRTL = isRTL(languageCode);

        await changeLanguage(languageCode);

        if (currentIsRTL !== newIsRTL) {
            Alert.alert(
                t('common.confirm'),
                'Language changed. Please restart the app to apply the text direction change.',
                [{ text: 'OK', style: 'default' }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('profile.language')}</Text>
            {languages.map((language) => (
                <AnimatedTouchable
                    key={language.code}
                    style={[
                        styles.languageItem,
                        currentLanguage === language.code && styles.selectedLanguage,
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                >
                    <View style={styles.flagContainer}>
                        <Text style={styles.flag}>{language.flag}</Text>
                    </View>
                    <View style={styles.languageInfo}>
                        <Text style={[
                            styles.languageName,
                            currentLanguage === language.code && { color: Colors.primary }
                        ]}>{language.nativeName}</Text>
                        <Text style={styles.languageNameSecondary}>{language.name}</Text>
                    </View>
                    {currentLanguage === language.code ? (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    ) : (
                        <Ionicons name="radio-button-off" size={24} color={Colors.textSecondary} />
                    )}
                </AnimatedTouchable>
            ))}
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedLanguage: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(29, 185, 84, 0.05)',
    },
    flagContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    flag: {
        fontSize: 24,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    languageNameSecondary: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
