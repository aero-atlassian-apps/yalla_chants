import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { usePlayerStore } from '../store/playerStore';
import { useColors } from '../constants/Colors';
import GradientBackground from '../components/GradientBackground';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';

export const ProfileScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user, isGuest, signOut } = useAuthStore();
    const { setCurrentTrack, setIsPlaying } = usePlayerStore();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const [likedChants, setLikedChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLikedChants, setShowLikedChants] = useState(false);
    const [showLanguageSettings, setShowLanguageSettings] = useState(false);

    const loadLikedChants = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const likes = await chantService.getLikedChants(user.id);
            setLikedChants(likes);
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadLikedChants();
    }, [loadLikedChants]);

    const playTrack = useCallback((track: Chant) => {
        const localizedTitle = getLocalizedTitle(track);
        const displayArtist = getDisplayArtist(track);

        setCurrentTrack({
            id: track.id,
            title: localizedTitle,
            artist: displayArtist || 'Unknown',
            artwork_url: '', // Will use default icon in Player
            audio_url: track.audio_url,
            duration: track.audio_duration,
        });
        setIsPlaying(true);
    }, [setCurrentTrack, setIsPlaying, getLocalizedTitle, getDisplayArtist]);

    const stats = useMemo(() => [
        { label: t('profile.liked'), value: likedChants.length.toString() },
    ], [likedChants.length, t]);

    const menuItems = [
        { icon: 'heart-outline', label: t('profile.likedChants'), action: () => setShowLikedChants(!showLikedChants) },
        { icon: 'language', label: t('profile.language'), action: () => setShowLanguageSettings(!showLanguageSettings) },
        { icon: 'help-circle-outline', label: t('profile.helpSupport'), action: () => { } },
    ];

    const renderLikedChant = useCallback(({ item }: { item: Chant }) => (
        <TouchableOpacity onPress={() => playTrack(item)} style={styles.likedChantItem}>
            <View style={styles.likedChantIcon}>
                <Ionicons name="musical-note" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.likedChantInfo}>
                <Text style={styles.likedChantTitle} numberOfLines={1}>{getLocalizedTitle(item)}</Text>
                <Text style={styles.likedChantArtist} numberOfLines={1}>{getDisplayArtist(item) || ''}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
    ), [playTrack, styles, Colors, getLocalizedTitle, getDisplayArtist]);

    return (
        <GradientBackground>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={signOut}>
                        <Ionicons name="log-out-outline" size={28} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {isGuest ? (
                    <View style={styles.guestContainer}>
                        <Ionicons name="person-circle-outline" size={100} color={Colors.textSecondary} />
                        <Text style={styles.guestTitle}>Guest Mode</Text>
                        <Text style={styles.guestSubtitle}>
                            Sign in to access all features including playlists, favorites, and jam sessions
                        </Text>
                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={signOut}
                        >
                            <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Profile Info */}
                        <View style={styles.profileInfo}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle-outline" size={80} color={Colors.primary} />
                            </View>
                            <Text style={styles.userName}>{user?.email || 'User'}</Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            {stats.map((stat, index) => (
                                <View key={index} style={styles.statItem}>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Language Settings */}
                        {showLanguageSettings && (
                            <View style={styles.languageContainer}>
                                <LanguageSelector />
                            </View>
                        )}

                        {/* Menu */}
                        <View style={styles.menu}>
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.menuItem}
                                    onPress={item.action}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <Ionicons name={item.icon as any} size={24} color={Colors.text} />
                                        <Text style={styles.menuItemText}>{item.label}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Liked Chants */}
                        {showLikedChants && (
                            <View style={styles.likedSection}>
                                <Text style={styles.sectionTitle}>{t('profile.likedChants')}</Text>
                                {loading ? (
                                    <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
                                ) : likedChants.length === 0 ? (
                                    <Text style={styles.emptyText}>{t('profile.noLikedChants')}</Text>
                                ) : (
                                    likedChants.map((chant) => (
                                        <View key={chant.id}>
                                            {renderLikedChant({ item: chant })}
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </GradientBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    guestTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 24,
        marginBottom: 12,
    },
    guestSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    signInButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    menu: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        marginTop: 24,
        overflow: 'hidden',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuItemText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    languageContainer: {
        marginTop: 24,
    },
    likedSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        borderWidth: 4,
        borderColor: Colors.primary,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    name: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    email: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 24,
        fontWeight: '500',
    },
    editButton: {
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    editButtonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuContainer: {
        marginBottom: 32,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceHighlight,
    },
    menuIconContainer: {
        width: 40,
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        marginLeft: 16,
        fontWeight: '500',
    },
    likedChantsContainer: {
        marginBottom: 40,
    },
    likedChantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Colors.surface,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    likedChantIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    likedChantInfo: {
        flex: 1,
    },
    likedChantTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    likedChantArtist: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    signOutButton: {
        marginTop: 32,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.error,
        alignItems: 'center',
    },
    signOutText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '600',
    },
});
