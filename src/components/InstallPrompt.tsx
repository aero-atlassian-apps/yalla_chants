// src/components/InstallPrompt.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useColors } from '../constants/Colors';
import { isWeb, isPWA, isIOSSafari, showInstallPrompt } from '../utils/platform';

const STORAGE_KEY = 'install-prompt-data';
const MAX_DISMISSALS = 3; // Show max 3 times before giving up
const REMIND_AFTER_HOURS = 24; // Re-show after 24 hours if dismissed

interface InstallPromptData {
    dismissCount: number;
    lastDismissed: number;
    neverShowAgain: boolean;
}

export const InstallPrompt: React.FC = () => {
    const { t } = useTranslation();
    const Colors = useColors();
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!isWeb) return;

        const checkAndShowPrompt = async () => {
            try {
                // Don't show if already installed as PWA
                if (isPWA()) {
                    return;
                }

                // Only show on iOS Safari
                if (!isIOSSafari()) {
                    return;
                }

                // Check storage for previous dismissals
                const dataStr = await AsyncStorage.getItem(STORAGE_KEY);
                const data: InstallPromptData = dataStr
                    ? JSON.parse(dataStr)
                    : { dismissCount: 0, lastDismissed: 0, neverShowAgain: false };

                // Don't show if user chose "never show again"
                if (data.neverShowAgain) {
                    return;
                }

                // Don't show if dismissed too many times
                if (data.dismissCount >= MAX_DISMISSALS) {
                    return;
                }

                // Check if enough time has passed since last dismissal
                const hoursSinceLastDismiss = (Date.now() - data.lastDismissed) / (1000 * 60 * 60);
                if (data.lastDismissed > 0 && hoursSinceLastDismiss < REMIND_AFTER_HOURS) {
                    return;
                }

                // Show prompt after 30 seconds of use
                const timer = setTimeout(() => {
                    setShowPrompt(true);
                }, 30000); // 30 seconds

                return () => clearTimeout(timer);
            } catch (error) {
                console.warn('InstallPrompt check failed:', error);
            }
        };

        checkAndShowPrompt();
    }, []);

    const handleInstall = () => {
        showInstallPrompt();
        setDismissed(true);
        setShowPrompt(false);
    };

    const handleDismiss = async (neverShowAgain: boolean = false) => {
        try {
            const dataStr = await AsyncStorage.getItem(STORAGE_KEY);
            const data: InstallPromptData = dataStr
                ? JSON.parse(dataStr)
                : { dismissCount: 0, lastDismissed: 0, neverShowAgain: false };

            const newData: InstallPromptData = {
                dismissCount: data.dismissCount + 1,
                lastDismissed: Date.now(),
                neverShowAgain: neverShowAgain || data.dismissCount + 1 >= MAX_DISMISSALS,
            };

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setDismissed(true);
            setShowPrompt(false);
        } catch (error) {
            console.warn('Failed to save dismiss state:', error);
        }
    };

    if (!showPrompt || dismissed || !isWeb) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.surface }]}>
            <View style={styles.content}>
                <Ionicons name="download-outline" size={24} color={Colors.primary} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: Colors.text }]}>
                        {t('pwa.install.title', 'Install Yalla Chant')}
                    </Text>
                    <Text style={[styles.description, { color: Colors.textSecondary }]}>
                        {t('pwa.install.description', 'Add to your home screen for quick access and offline use')}
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleDismiss(true)} style={styles.dismissButton}>
                    <Text style={[styles.dismissText, { color: Colors.textSecondary }]}>
                        {t('pwa.install.never', 'Not now')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleInstall}
                    style={[styles.installButton, { backgroundColor: Colors.primary }]}
                >
                    <Text style={styles.installText}>
                        {t('pwa.install.action', 'Install')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: 16,
        right: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    dismissButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    dismissText: {
        fontSize: 14,
        fontWeight: '500',
    },
    installButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    installText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
