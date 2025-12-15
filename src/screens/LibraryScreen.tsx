import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { Ionicons } from '@expo/vector-icons';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/playerStore';
import { GuestRestrictedView } from '../components/GuestRestrictedView';
import { FadeInView } from '../components/FadeInView';
import { ScreenHeader } from '../components/ScreenHeader';
import { AnimatedTouchable } from '../components/AnimatedTouchable';
import { EnhancedChantCard } from '../components/EnhancedChantCard';
import { useCountries, useChantsByCountry } from '../hooks/useChants';
import { AdBanner } from '../components/AdBanner';

type LibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - 32 - GAP) / COLUMN_COUNT;
const ARTWORK_HEIGHT = Math.round(ITEM_WIDTH * (Dimensions.get('window').width > 480 ? 0.5 : 0.65));
export const LibraryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<LibraryScreenNavigationProp>();
    const route = useRoute<any>();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { user, isGuest } = useAuthStore();
    const { setCurrentTrack, setIsPlaying, setQueue } = usePlayerStore();
    const { countries } = useCountries();
    const selectedCountryId: string | undefined = route?.params?.countryId;
    const { chants: countryChants, loading: countryLoading } = useChantsByCountry(selectedCountryId);

    const [likedChants, setLikedChants] = useState<Chant[]>([]);
    const [recentChants, setRecentChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [favoritesExpanded, setFavoritesExpanded] = useState(false);
    const [recentExpanded, setRecentExpanded] = useState(false);
    const [useEnhancedView, setUseEnhancedView] = useState(false);

    useEffect(() => {
        if (!selectedCountryId) {
            loadLibraryContent();
        }
    }, [user, selectedCountryId]);

    const loadLibraryContent = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const [liked, recent] = await Promise.all([
                chantService.getLikedChants(user.id, 0, 50),
                chantService.getAllChants(0, 50),
            ]);

            setLikedChants(liked);
            setRecentChants(recent.slice(0, 20));
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const buildQueueAndPlay = useCallback((list: Chant[], startIndex: number) => {
        if (!list || list.length === 0) return;
        const t = list[startIndex];
        setCurrentTrack({
            id: t.id,
            title: getLocalizedTitle(t),
            artist: getDisplayArtist(t) || 'Unknown',
            artwork_url: '',
            audio_url: t.audio_url,
            duration: t.audio_duration,
        });
        setQueue(list.map(c => ({
            id: c.id,
            title: getLocalizedTitle(c),
            artist: getDisplayArtist(c) || 'Unknown',
            artwork_url: '',
            audio_url: c.audio_url,
            duration: c.audio_duration,
        })));
        setIsPlaying(true);
    }, [setCurrentTrack, setQueue, setIsPlaying]);

    const renderChantCard = (data: Chant[]) => ({ item, index }: { item: Chant, index: number }) => {
        const localizedTitle = getLocalizedTitle(item);
        const displayArtist = getDisplayArtist(item);

        return (
            <AnimatedTouchable
                style={styles.chantCard}
                onPress={() => buildQueueAndPlay(data, index)}
            >
                <View style={styles.chantCardArtwork}>
                    <Ionicons name="musical-note" size={48} color={Colors.primary} />
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color={Colors.white} />
                    </View>
                </View>
                <Text style={styles.chantCardTitle} numberOfLines={2}>{localizedTitle}</Text>
                <Text style={styles.chantCardSubtitle} numberOfLines={1}>
                    {displayArtist || 'Unknown Artist'}
                </Text>
            </AnimatedTouchable>
        );
    };

    const renderEnhancedChantCard = ({ item }: { item: Chant }) => {
        return (
            <EnhancedChantCard
                chant={item}
                onPress={() => buildQueueAndPlay([item], 0)}
                showArtist={true}
                showYear={true}
                showRating={true}
                showTags={true}
                showViralMoment={false}
                compact={true}
                width={ITEM_WIDTH}
            />
        );
    };

    if (isGuest && !selectedCountryId) {
        return (
            <AppBackground>
                <GuestRestrictedView
                    icon="library"
                    title="Your Library"
                    message="Sign in to save your favorite chants, create playlists, and build your personal collection."
                />
            </AppBackground>
        );
    }

    const displayedFavorites = favoritesExpanded ? likedChants : likedChants.slice(0, 6);
    const displayedRecent = recentExpanded ? recentChants : recentChants.slice(0, 6);

    if (selectedCountryId) {
        const country = countries.find(c => c.id === selectedCountryId);
        return (
            <AppBackground>
                <FlatList
                    ListHeaderComponent={
                        <>
                            <ScreenHeader
                                title={country ? country.name : t('searchScreen.browseAll')}
                                subtitle={t('searchScreen.browseAll')}
                                backgroundImage={require('../../assets/images/stadium_background.png')}
                                leftAction={(
                                    <TouchableOpacity onPress={() => (navigation as any).navigate('Library')} style={{ padding: 8 }}>
                                        <Ionicons name="arrow-back" size={22} color={Colors.text} />
                                    </TouchableOpacity>
                                )}
                            />
                            <View style={{ paddingHorizontal: 16 }}>
                                {countryLoading ? (
                                    <View style={{ paddingVertical: 16 }}><Text style={{ color: Colors.textSecondary }}>Loading...</Text></View>
                                ) : (
                                    <FlatList
                                        data={countryChants}
                                        renderItem={renderChantCard(countryChants)}
                                        keyExtractor={(item) => item.id}
                                        numColumns={COLUMN_COUNT}
                                        columnWrapperStyle={{ gap: GAP }}
                                        contentContainerStyle={{ gap: GAP }}
                                        scrollEnabled={false}
                                    />
                                )}
                            </View>
                            {/* Web PWA Ad Banner */}
                            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                                <AdBanner adUnitId={(process.env.EXPO_PUBLIC_ADSENSE_SLOT_LIBRARY as string) || '1234567891'} />
                            </View>
                        </>
                    }
                    data={[]}
                    renderItem={null}
                    contentContainerStyle={styles.scrollContent}
                />
            </AppBackground>
        );
    }

    return (
        <AppBackground>
            <FlatList
                key={`${favoritesExpanded}-${recentExpanded}`} // Force re-render on state change
                ListHeaderComponent={
                    <>
                        <ScreenHeader
                            title={t('library.title')}
                            subtitle="Your Collection"
                            backgroundImage={require('../../assets/images/stadium_background.png')}
                        />

                        {/* Playlists Action Button */}
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.playlistsButton}
                                onPress={() => (navigation as any).navigate('Playlists')}
                            >
                                <View style={styles.playlistsIconContainer}>
                                    <Ionicons name="list" size={20} color={Colors.accent} />
                                </View>
                                <Text style={styles.playlistsButtonText}>My Playlists</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Favorites Section */}
                        {likedChants.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => setFavoritesExpanded(!favoritesExpanded)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.sectionHeaderLeft}>
                                        <Ionicons name="heart" size={18} color={Colors.accent} style={{ marginRight: 8 }} />
                                        <Text style={styles.sectionTitle}>Favorites</Text>
                                        <Text style={styles.sectionCount}>({likedChants.length})</Text>
                                    </View>
                                    <View style={styles.sectionHeaderRight}>
                                        <TouchableOpacity
                                            style={styles.viewToggle}
                                            onPress={() => setUseEnhancedView(!useEnhancedView)}
                                        >
                                            <Ionicons
                                                name={useEnhancedView ? "grid" : "list"}
                                                size={20}
                                                color={Colors.primary}
                                            />
                                        </TouchableOpacity>
                                        <Ionicons
                                            name={favoritesExpanded ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={Colors.textSecondary}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.gridContainer}>
                                    <FlatList
                                        data={displayedFavorites}
                                        renderItem={useEnhancedView ? renderEnhancedChantCard : renderChantCard(displayedFavorites)}
                                        keyExtractor={(item) => item.id}
                                        numColumns={COLUMN_COUNT}
                                        columnWrapperStyle={{ gap: GAP }}
                                        contentContainerStyle={{ gap: GAP }}
                                        scrollEnabled={false}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Recently Played Section */}
                        {recentChants.length > 0 && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => setRecentExpanded(!recentExpanded)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.sectionHeaderLeft}>
                                        <Ionicons name="time" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                                        <Text style={styles.sectionTitle}>Recently Played</Text>
                                    </View>
                                    <Ionicons
                                        name={recentExpanded ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <View style={styles.gridContainer}>
                                    <FlatList
                                        data={displayedRecent}
                                        renderItem={renderChantCard(displayedRecent)}
                                        keyExtractor={(item) => item.id}
                                        numColumns={COLUMN_COUNT}
                                        columnWrapperStyle={{ gap: GAP }}
                                        contentContainerStyle={{ gap: GAP }}
                                        scrollEnabled={false}
                                    />
                                </View>
                            </View>
                        )}
                    </>
                }
                data={[]}
                renderItem={null}
                contentContainerStyle={styles.scrollContent}
            />
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    scrollContent: {
        paddingBottom: 120,
    },
    actionsContainer: {
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    playlistsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    playlistsIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    playlistsButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    section: {
        marginTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 12,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    sectionCount: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginLeft: 6,
    },
    viewToggle: {
        padding: 8,
        marginRight: 8,
    },
    gridContainer: {
        paddingHorizontal: 16,
    },
    // Vertical card styles (same as SearchScreen)
    chantCard: {
        width: ITEM_WIDTH,
        backgroundColor: 'transparent',
        marginBottom: 8,
    },
    chantCardArtwork: {
        width: ITEM_WIDTH,
        height: ARTWORK_HEIGHT,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    playButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    chantCardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
        lineHeight: 18,
    },
    chantCardSubtitle: {
        fontSize: 11,
        color: Colors.textSecondary,
        lineHeight: 14,
    },
});
