import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Dimensions, ImageBackground } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { Ionicons } from '@expo/vector-icons';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { usePlayerStore } from '../store/playerStore';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ChantCardSkeleton } from '../components/SkeletonLoader';
import { FadeInView } from '../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedTouchable } from '../components/AnimatedTouchable';
import { sharingService } from '../services/sharingService';
import { BlurView } from 'expo-blur';
import { AdBanner } from '../components/AdBanner';

type PlaylistDetailRouteProp = RouteProp<RootStackParamList, 'PlaylistDetail'>;
type PlaylistDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlaylistDetail'>;

const { width } = Dimensions.get('window');

export const PlaylistDetailScreen = () => {
    const { t } = useTranslation();
    const route = useRoute<PlaylistDetailRouteProp>();
    const navigation = useNavigation<PlaylistDetailNavigationProp>();
    const { playlistId, title } = route.params;
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { user } = useAuthStore();
    const { currentTrack, isPlaying } = usePlayerStore();

    const [chants, setChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [playlistTitle, setPlaylistTitle] = useState(title);

    const loadPlaylistChants = useCallback(async () => {
        try {
            if (playlistId === 'liked-songs') {
                if (user) {
                    const liked = await chantService.getLikedChants(user.id);
                    setChants(liked);
                    setPlaylistTitle(t('library.favorites'));
                }
            } else {
                const playlistChants = await chantService.getPlaylistChants(playlistId);
                setChants(playlistChants);
            }
        } catch (error) {
            console.error('Error loading playlist chants:', error);
            Alert.alert('Error', 'Failed to load playlist chants');
        } finally {
            setLoading(false);
        }
    }, [playlistId, user, t]);

    useEffect(() => {
        loadPlaylistChants();
    }, [loadPlaylistChants]);

    const handlePlay = useCallback((startIndex: number = 0) => {
        if (chants.length === 0) return;

        const track = chants[startIndex];
        const localizedTitle = getLocalizedTitle(track);
        const displayArtist = getDisplayArtist(track);

        usePlayerStore.getState().setCurrentTrack({
            id: track.id,
            title: localizedTitle,
            artist: displayArtist || 'Unknown Team',
            audio_url: track.audio_url,
            duration: track.audio_duration,
            artwork_url: require('../../assets/images/chant-placeholder.png'),
        });

        const queue = chants.map(c => ({
            id: c.id,
            title: getLocalizedTitle(c),
            artist: getDisplayArtist(c) || 'Unknown Team',
            audio_url: c.audio_url,
            duration: c.audio_duration,
            artwork_url: require('../../assets/images/chant-placeholder.png'),
        }));
        usePlayerStore.getState().setQueue(queue);
        usePlayerStore.getState().setIsPlaying(true);
        usePlayerStore.getState().setIsMinimized(false);
    }, [chants]);

    const handleShuffle = useCallback(() => {
        if (chants.length === 0) return;
        const randomIndex = Math.floor(Math.random() * chants.length);
        handlePlay(randomIndex);
    }, [chants, handlePlay]);

    const renderItem = useCallback(({ item, index }: { item: Chant, index: number }) => {
        const isCurrentTrack = currentTrack?.id === item.id;

        return (
            <AnimatedTouchable
                style={[styles.chantRow, isCurrentTrack && styles.activeChantRow]}
                onPress={() => handlePlay(index)}
            >
                <View style={styles.indexContainer}>
                    {isCurrentTrack && isPlaying ? (
                        <Ionicons name="volume-high" size={16} color={Colors.primary} />
                    ) : (
                        <Text style={[styles.indexText, isCurrentTrack && { color: Colors.primary }]}>
                            {index + 1}
                        </Text>
                    )}
                </View>

                <View style={styles.chantInfo}>
                    <Text
                        style={[styles.chantTitle, isCurrentTrack && { color: Colors.primary }]}
                        numberOfLines={1}
                    >
                        {getLocalizedTitle(item)}
                    </Text>
                    <Text style={styles.chantArtist} numberOfLines={1}>
                        {getDisplayArtist(item)}
                    </Text>
                </View>

                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </AnimatedTouchable>
        );
    }, [styles, Colors, handlePlay, currentTrack, isPlaying]);

    const ListHeader = useMemo(() => (
        <View style={styles.headerContainer}>
            {/* Blurred Background Effect */}
            <View style={styles.headerBackgroundContainer}>
                <LinearGradient
                    colors={[Colors.primary, 'transparent']}
                    style={styles.headerGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.artworkContainer}>
                    <LinearGradient
                        colors={[Colors.surfaceLight, Colors.surface]}
                        style={styles.artworkPlaceholder}
                    >
                        <Ionicons name="musical-notes" size={64} color={Colors.primary} />
                    </LinearGradient>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.playlistTitle}>{playlistTitle}</Text>
                    <Text style={styles.playlistSubtitle}>
                        {playlistId === 'liked-songs' ? 'Your favorite chants' : `Created by ${user?.user_metadata?.username || 'User'}`}
                    </Text>
                    <Text style={styles.playlistStats}>
                        {chants.length} chants • {Math.ceil(chants.reduce((acc, curr) => acc + (curr.audio_duration || 0), 0) / 60)} mins
                    </Text>
                </View>

                <View style={styles.controlsContainer}>
                    <View style={styles.mainControls}>
                        <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
                            <Ionicons name="shuffle" size={28} color={Colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.playButton} onPress={() => handlePlay(0)}>
                            <Ionicons name="play" size={32} color={Colors.black} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shuffleButton} onPress={async () => {
                            try {
                                const content = sharingService.generatePlaylistLink(playlistId, playlistTitle || 'Playlist');
                                const success = await sharingService.shareNative(content);
                                if (success) {
                                    await sharingService.trackShare('playlist', playlistId,
                                        sharingService.canUseWebShare() ? 'web-share' : 'native');
                                }
                            } catch (e) { }
                        }}>
                            <Ionicons name="share-social-outline" size={28} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    ), [styles, Colors, playlistTitle, playlistId, user, handlePlay, handleShuffle, chants]);

    return (
        <AppBackground>
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ paddingTop: 100, paddingHorizontal: 16 }}>
                        <ChantCardSkeleton count={6} />
                    </View>
                ) : (
                    <FadeInView duration={400}>
                        <FlatList
                            data={chants}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `${item.id}:${index}`}
                            ListHeaderComponent={ListHeader}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                        {/* Web PWA Ad Banner */}
                        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                            <AdBanner adUnitId={(process.env.EXPO_PUBLIC_ADSENSE_SLOT_PLAYLIST as string) || '1234567892'} />
                        </View>
                    </FadeInView>
                )}
            </View>
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 120,
    },
    headerContainer: {
        marginBottom: 24,
        paddingTop: 80,
        position: 'relative',
    },
    headerBackgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 0.2,
    },
    headerGradient: {
        flex: 1,
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    artworkContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
        marginBottom: 24,
    },
    artworkPlaceholder: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    playlistTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    playlistSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginBottom: 4,
    },
    playlistStats: {
        fontSize: 12,
        color: Colors.textSecondary,
        opacity: 0.8,
    },
    controlsContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    mainControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ scale: 1.1 }], // Make it pop
    },
    shuffleButton: {
        padding: 12,
    },
    downloadButton: {
        padding: 12,
    },
    chantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    activeChantRow: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    indexContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    indexText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    chantInfo: {
        flex: 1,
    },
    chantTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    chantArtist: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    moreButton: {
        padding: 8,
    },
});
