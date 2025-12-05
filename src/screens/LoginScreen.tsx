
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useGuestStore } from '../store/guestStore';
import { CountrySelector } from '../components/CountrySelector';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';
import { useColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
    const { t } = useTranslation();
    const { setGuest } = useGuestStore();
    const [countrySelectorVisible, setCountrySelectorVisible] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const { setPrimaryColor } = useThemeStore();
    const Colors = useColors();

    const handleSignInAsGuest = () => {
        setCountrySelectorVisible(true);
    };

    const onCountrySelect = async (countryId: string) => {
        const { data: country } = await supabase
            .from('countries')
            .select('*')
            .eq('id', countryId)
            .single();

        if (country) {
            setSelectedCountry(country);
            if (country.theme_primary_color && country.theme_primary_color !== '#1DB954') {
                setThemeModalVisible(true);
            } else {
                // If no custom theme, proceed directly
                setGuest(country.id);
            }
        }
    };

    const handleThemeSelection = (useCountryTheme: boolean) => {
        if (useCountryTheme) {
            setPrimaryColor(selectedCountry.theme_primary_color);
        }
        // If default theme, no need to set color as it's the default
        setGuest(selectedCountry.id);
        setThemeModalVisible(false);
    };

    const ThemeSelectionModal = () => (
        <Modal
            visible={themeModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setThemeModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: Colors.text }]}>{t('theme.selectTitle')}</Text>
                    <Text style={[styles.modalSubtitle, { color: Colors.textSecondary }]}>
                        {t('theme.selectSubtitle', { country: selectedCountry?.name })}
                    </Text>

                    <TouchableOpacity style={styles.themeOption} onPress={() => handleThemeSelection(false)}>
                        <View style={styles.themePreviewContainer}>
                            <View style={[styles.themeColorDot, { backgroundColor: '#1DB954' }]} />
                            <Text style={[styles.themeOptionText, { color: Colors.text }]}>{t('theme.default')}</Text>
                        </View>
                        <Ionicons name="checkmark-circle-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.themeOption} onPress={() => handleThemeSelection(true)}>
                        <View style={styles.themePreviewContainer}>
                            <View style={[styles.themeColorDot, { backgroundColor: selectedCountry?.theme_primary_color }]} />
                            <Text style={[styles.themeOptionText, { color: Colors.text }]}>{t('theme.country')}</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={selectedCountry?.theme_primary_color} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <LinearGradient colors={[Colors.background, Colors.backgroundAlt]} style={styles.container}>
            <View style={styles.logoContainer}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} />
                <Text style={styles.title}>{t('login.title')}</Text>
                <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors.primary }]}
                    onPress={handleSignInAsGuest}
                >
                    <Text style={[styles.buttonText, { color: Colors.white }]}>{t('login.continueAsGuest')}</Text>
                </TouchableOpacity>
            </View>

            {countrySelectorVisible && (
                <CountrySelector
                    visible={countrySelectorVisible}
                    onClose={() => setCountrySelectorVisible(false)}
                    onCountrySelect={onCountrySelect}
                />
            )}
            {selectedCountry && <ThemeSelectionModal />}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#A7A7A7',
        textAlign: 'center',
        marginTop: 8,
    },
    buttonContainer: {
        width: '80%',
    },
    button: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    themePreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeColorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 16,
    },
    themeOptionText: {
        fontSize: 18,
    },
});

export default LoginScreen;