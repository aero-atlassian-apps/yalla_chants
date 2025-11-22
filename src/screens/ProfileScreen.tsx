import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { chantService, Chant } from '../services/chantService';
import { usePlayerStore } from '../store/playerStore';
import { useColors } from '../constants/Colors';
import { MosaicBackground } from '../components/MosaicBackground';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';

export const ProfileScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuthStore();
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
        setCurrentTrack({
            id: track.id,
            title: track.title,
            artist: track.football_team || 'Unknown',
            artwork_url: '', // Will use default icon in Player
            audio_url: track.audio_url,
            duration: track.audio_duration,
        });
        setIsPlaying(true);
    }, [setCurrentTrack, setIsPlaying]);

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
                <Text style={styles.likedChantTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.likedChantArtist} numberOfLines={1}>{item.football_team}</Text>
            </View>
            <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
    ), [playTrack, styles, Colors]);

    return (
        <MosaicBackground>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={signOut}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={50} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.name}>Football Fan</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={24} color={Colors.text} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name={item.label === t('profile.likedChants') && showLikedChants ? "chevron-down" : item.label === t('profile.language') && showLanguageSettings ? "chevron-down" : "chevron-forward"} size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {showLikedChants && (
                    <View style={styles.likedChantsContainer}>
                        <Text style={styles.sectionTitle}>{t('profile.likedChants')}</Text>
                        {loading ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : likedChants.length > 0 ? (
                            likedChants.map((chant) => (
                                <View key={chant.id}>
                                    {renderLikedChant({ item: chant })}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No liked chants yet.</Text>
                        )}
                    </View>
                )}

                {showLanguageSettings && (
                    <View style={styles.likedChantsContainer}>
                        <LanguageSelector />
                    </View>
                )}

                <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                    <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </MosaicBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    editButton: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.textSecondary,
    },
    editButtonText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    menuContainer: {
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
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
        marginLeft: 12,
    },
    likedChantsContainer: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    likedChantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    likedChantIcon: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    likedChantInfo: {
        flex: 1,
    },
    likedChantTitle: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    likedChantArtist: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    signOutButton: {
        backgroundColor: Colors.surfaceHighlight,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.textSecondary,
    },
    signOutText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
});
