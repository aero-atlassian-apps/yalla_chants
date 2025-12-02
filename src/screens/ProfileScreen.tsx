import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { usePlayerStore } from '../store/playerStore';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { useTranslation } from 'react-i18next';
import { GuestRestrictedView } from '../components/GuestRestrictedView';
import { LanguageSelector } from '../components/LanguageSelector';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const ProfileScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { user, isGuest, signOut } = useAuthStore();
    const { setCurrentTrack, setIsPlaying } = usePlayerStore();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors, insets), [Colors, insets]);

    const [likedChants, setLikedChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLanguageSettings, setShowLanguageSettings] = useState(false);

    const loadLikedChants = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const trending = await chantService.getTrendingChants(10);
            setLikedChants(trending);
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
            artwork_url: '',
            audio_url: track.audio_url,
            duration: track.audio_duration,
        });
        setIsPlaying(true);
    }, [setCurrentTrack, setIsPlaying, getLocalizedTitle, getDisplayArtist]);

    const stats = useMemo(() => [
        { label: t('profile.liked'), value: likedChants.length.toString() },
        { label: 'Playlists', value: '0' },
        { label: 'Following', value: '0' },
    ], [likedChants.length, t]);

    const renderLikedChant = useCallback(({ item }: { item: Chant }) => (
        <AnimatedTouchable onPress={() => playTrack(item)} style={styles.likedChantItem}>
            <View style={styles.likedChantIcon}>
                <Ionicons name="musical-note" size={20} color={Colors.primary} />
            </View>
            <View style={styles.likedChantInfo}>
                <Text style={styles.likedChantTitle} numberOfLines={1}>{getLocalizedTitle(item)}</Text>
                <Text style={styles.likedChantArtist} numberOfLines={1}>{getDisplayArtist(item) || 'Unknown Artist'}</Text>
            </View>
            <TouchableOpacity style={styles.playButton}>
                <Ionicons name="play-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
        </AnimatedTouchable>
    ), [playTrack, styles, Colors, getLocalizedTitle, getDisplayArtist]);

    return (
        <AppBackground>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Background */}
                <View style={styles.headerBackground}>
                    <Image
                        source={require('../../assets/images/stadium_background.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['transparent', Colors.background]}
                        style={styles.headerGradient}
                    />
                </View>

                {isGuest ? (
                    <View style={styles.guestContainer}>
                        <GuestRestrictedView
                            icon="person-circle"
                            title="Your Profile"
                            message="Sign in to customize your profile, track your listening stats, and manage your account."
                            onSignIn={() => navigation.navigate('Login')}
                        />
                    </View>
                ) : (
                    <FadeInView duration={500} style={styles.contentContainer}>
                        {/* Member Card */}
                        <View style={styles.profileCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    {user?.user_metadata?.avatar_url ? (
                                        <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarInitial}>
                                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.editBadge}>
                                        <Ionicons name="pencil" size={12} color={Colors.black} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{user?.user_metadata?.username || 'Music Lover'}</Text>
                                    <Text style={styles.userEmail}>{user?.email}</Text>
                                    <View style={styles.memberBadge}>
                                        <Ionicons name="star" size={10} color={Colors.black} />
                                        <Text style={styles.memberText}>PREMIUM MEMBER</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                {stats.map((stat, index) => (
                                    <View key={index} style={styles.statItem}>
                                        <Text style={styles.statValue}>{stat.value}</Text>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Settings Section */}
                        <Text style={styles.sectionHeader}>SETTINGS</Text>

                        <View style={styles.settingsCard}>
                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => setShowLanguageSettings(!showLanguageSettings)}
                            >
                                <View style={styles.settingIcon}>
                                    <Ionicons name="language" size={20} color={Colors.primary} />
                                </View>
                                <Text style={styles.settingLabel}>{t('profile.language')}</Text>
                                <Ionicons
                                    name={showLanguageSettings ? "chevron-up" : "chevron-forward"}
                                    size={20}
                                    color={Colors.textSecondary}
                                />
                            </TouchableOpacity>

                            {showLanguageSettings && (
                                <View style={styles.languageDropdown}>
                                    <LanguageSelector />
                                </View>
                            )}
                        </View>

                        <View style={styles.settingsCard}>
                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => navigation.navigate('InviteFriends')}
                            >
                                <View style={styles.settingIcon}>
                                    <Ionicons name="gift" size={20} color={Colors.primary} />
                                </View>
                                <Text style={styles.settingLabel}>Invite Friends</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>


                        {/* Liked Chants Section */}
                        <Text style={styles.sectionHeader}>{t('profile.likedChants')}</Text>
                        <View style={styles.likedCard}>
                            {loading ? (
                                <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} />
                            ) : likedChants.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="heart-dislike-outline" size={48} color={Colors.textSecondary} />
                                    <Text style={styles.emptyText}>{t('profile.noLikedChants')}</Text>
                                </View>
                            ) : (
                                <View>
                                    {likedChants.map((chant, index) => (
                                        <View key={chant.id}>
                                            {renderLikedChant({ item: chant })}
                                            {index < likedChants.length - 1 && <View style={styles.separator} />}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Sign Out Button */}
                        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>

                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </FadeInView>
                )}
            </ScrollView>
        </AppBackground>
    );
};

const createStyles = (Colors: any, insets: any) => StyleSheet.create({
    scrollContent: {
        paddingBottom: 120,
    },
    headerBackground: {
        height: 200,
        width: '100%',
        position: 'absolute',
        top: 0,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.6,
    },
    headerGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    guestContainer: {
        marginTop: 100,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 120, // Push content down to show header
    },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: Colors.gold,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.gold,
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.gold,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.gold,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gold,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    memberText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.black,
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 1,
    },
    settingsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(29, 185, 84, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    languageDropdown: {
        padding: 16,
        backgroundColor: Colors.surfaceLight,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    likedCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    likedChantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    likedChantIcon: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    likedChantInfo: {
        flex: 1,
    },
    likedChantTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    likedChantArtist: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    playButton: {
        padding: 4,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 64,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        color: Colors.textSecondary,
        marginTop: 8,
        fontSize: 14,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    signOutText: {
        color: Colors.error,
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 15,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 12,
        opacity: 0.5,
        marginBottom: 32,
    },
});
