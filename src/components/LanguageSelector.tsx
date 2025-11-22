import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { changeLanguage, isRTL } from '../i18n/i18n';

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
];

export const LanguageSelector = () => {
    const { t, i18n } = useTranslation();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const currentLanguage = i18n.language;

    const handleLanguageChange = async (languageCode: string) => {
        const currentIsRTL = isRTL(currentLanguage);
        const newIsRTL = isRTL(languageCode);

        // Change language
        await changeLanguage(languageCode);

        // If RTL direction changed, show info message
        if (currentIsRTL !== newIsRTL) {
            Alert.alert(
                t('common.confirm'),
                'Language changed. Please restart the app to apply the text direction change.',
                [
                    {
                        text: 'OK',
                        style: 'default',
                    },
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('profile.language')}</Text>
            {languages.map((language) => (
                <TouchableOpacity
                    key={language.code}
                    style={[
                        styles.languageItem,
                        currentLanguage === language.code && styles.selectedLanguage,
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                >
                    <Text style={styles.flag}>{language.flag}</Text>
                    <View style={styles.languageInfo}>
                        <Text style={styles.languageName}>{language.nativeName}</Text>
                        <Text style={styles.languageNameSecondary}>{language.name}</Text>
                    </View>
                    {currentLanguage === language.code && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    selectedLanguage: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    flag: {
        fontSize: 32,
        marginRight: 16,
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
        fontSize: 14,
        color: Colors.textSecondary,
    },
});
