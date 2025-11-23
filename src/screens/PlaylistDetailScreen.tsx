// src/screens/PlaylistDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { MosaicBackground } from '../components/MosaicBackground';
import { sharingService } from '../services/sharingService';
import { playlistService } from '../services/playlistService';

export const PlaylistDetailScreen = () => {
    const Colors = useColors();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute();
    // @ts-ignore
    const { playlistId } = route.params;

    const { user } = useAuthStore();
    const { currentPlaylist, fetchPlaylist, removeChant, toggleVisibility } = usePlaylistStore();

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPlaylist();
    }, [playlistId]);

    const loadPlaylist = async () => {
        try {
            await fetchPlaylist(playlistId);
        } catch (error) {
            console.error('Error loading playlist:', error);
            Alert.alert(t('common.error'), 'Failed to load playlist');
            navigation.goBack();
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPlaylist();
        setRefreshing(false);
    };

    const handleEdit = () => {
        if (currentPlaylist) {
            // @ts-ignore
            navigation.navigate('CreatePlaylist', { playlist: currentPlaylist });
        }
    };

    const handleShare = async () => {
        if (!currentPlaylist) return;

        try {
            const content = sharingService.generatePlaylistLink(
                currentPlaylist.id,
                currentPlaylist.name
            );
            await sharingService.shareNative(content);
            await sharingService.trackShare('playlist', currentPlaylist.id, 'native');
            await playlistService.incrementShareCount(currentPlaylist.id);
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleToggleVisibility = async () => {
        if (!currentPlaylist) return;

        try {
            await toggleVisibility(currentPlaylist.id);
            const newStatus = !currentPlaylist.is_public;
            Alert.alert(
                newStatus ? t('playlists.makePublic') : t('playlists.makePrivate'),
                newStatus
                    ? 'Anyone with the link can now view this playlist'
                    : 'Only you can now view this playlist'
            );
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        }
    };

    const handleRemoveChant = (chantId: string, chantTitle: string) => {
        if (!currentPlaylist) return;

        Alert.alert(
            t('playlists.removeChant'),
            `Remove "${chantTitle}" from playlist?`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeChant(currentPlaylist.id, chantId);
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message);
                        }
                    },
                },
            ]
        );
    };

    const handlePlayAll = async () => {
        if (!currentPlaylist || currentPlaylist.items.length === 0) return;

        // Increment play count
        await playlistService.incrementPlayCount(currentPlaylist.id);

        // TODO: Implement play all functionality with audio player
        Alert.alert('Play All', 'This feature will be implemented with the audio player');
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const renderChantItem = ({ item, index }: { item: any; index: number }) => {
        const chant = item.chant;
        const isOwner = currentPlaylist?.user_id === user?.id;

        return (
            <TouchableOpacity
                style={[styles.chantItem, { backgroundColor: Colors.surface }]}
                onPress={() => {
                    // TODO: Play this chant
                    console.log('Play chant:', chant.id);
                }}
            >
                <View style={styles.chantNumber}>
                    <Text style={[styles.numberText, { color: Colors.textSecondary }]}>
                        {index + 1}
                    </Text>
                </View>

                <View style={styles.chantInfo}>
                    <Text style={[styles.chantTitle, { color: Colors.text }]} numberOfLines={1}>
                        {chant.title}
                    </Text>
                    <View style={styles.chantMeta}>
                        <Text style={[styles.chantMetaText, { color: Colors.textSecondary }]}>
                            {chant.football_team || chant.country?.name || 'Unknown'}
                        </Text>
                        {chant.audio_duration && (
                            <>
                                <Text style={[styles.dot, { color: Colors.textSecondary }]}>•</Text>
                                <Text style={[styles.chantMetaText, { color: Colors.textSecondary }]}>
                                    {formatDuration(chant.audio_duration)}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {isOwner && (
                    <TouchableOpacity
                        onPress={() => handleRemoveChant(chant.id, chant.title)}
                        style={styles.removeButton}
                    >
                        <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderHeader = () => {
        if (!currentPlaylist) return null;

        const isOwner = currentPlaylist.user_id === user?.id;

        return (
            <View style={styles.headerContainer}>
                {/* Cover Image */}
                <Image
                    source={require('../../assets/playlist-cover-default.png')}
                    style={styles.coverImage}
                    resizeMode="cover"
                />

                {/* Playlist Info */}
                <Text style={[styles.playlistName, { color: Colors.text }]}>
                    {currentPlaylist.name}
                </Text>

                {currentPlaylist.description && (
                    <Text style={[styles.playlistDescription, { color: Colors.textSecondary }]}>
                        {currentPlaylist.description}
                    </Text>
                )}

                {/* Metadata */}
                <View style={styles.metadata}>
                    <View style={styles.metadataItem}>
                        <Ionicons name="musical-notes" size={16} color={Colors.textSecondary} />
                        <Text style={[styles.metadataText, { color: Colors.textSecondary }]}>
                            {t('playlists.chantCount', { count: currentPlaylist.chant_count })}
                        </Text>
                    </View>

                    {currentPlaylist.total_duration > 0 && (
                        <View style={styles.metadataItem}>
                            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                            <Text style={[styles.metadataText, { color: Colors.textSecondary }]}>
                                {formatDuration(currentPlaylist.total_duration)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.metadataItem}>
                        <Ionicons
                            name={currentPlaylist.is_public ? 'globe-outline' : 'lock-closed-outline'}
                            size={16}
                            color={currentPlaylist.is_public ? Colors.primary : Colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.metadataText,
                                {
                                    color: currentPlaylist.is_public ? Colors.primary : Colors.textSecondary,
                                },
                            ]}
                        >
                            {currentPlaylist.is_public ? t('playlists.public') : t('playlists.private')}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {currentPlaylist.chant_count > 0 && (
                        <TouchableOpacity
                            style={[styles.playAllButton, { backgroundColor: Colors.primary }]}
                            onPress={handlePlayAll}
                        >
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.playAllText}>{t('playlists.playAll')}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>

                    {isOwner && (
                        <>
                            <TouchableOpacity style={styles.actionButton} onPress={handleToggleVisibility}>
                                <Ionicons
                                    name={currentPlaylist.is_public ? 'lock-open-outline' : 'lock-closed-outline'}
                                    size={24}
                                    color={Colors.text}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                                <Ionicons name="create-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Section Header */}
                {currentPlaylist.chant_count > 0 && (
                    <Text style={[styles.sectionTitle, { color: Colors.text }]}>Chants</Text>
                )}
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="musical-note-outline" size={60} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.text }]}>
                {t('playlists.emptyDetail')}
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
                {t('playlists.emptyDetailDescription')}
            </Text>
        </View>
    );

    if (!currentPlaylist) {
        return (
            <MosaicBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </MosaicBackground>
        );
    }

    return (
        <MosaicBackground>
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: Colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>

                {/* Chants List */}
                <FlatList
                    data={currentPlaylist.items}
                    renderItem={renderChantItem}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </MosaicBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    headerContainer: {
        padding: 24,
        paddingTop: 100,
        alignItems: 'center',
    },
    coverImage: {
        width: 240,
        height: 240,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    playlistName: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    playlistDescription: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 24,
        lineHeight: 24,
        opacity: 0.8,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 32,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    metadataText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
    },
    playAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    playAllText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        alignSelf: 'flex-start',
        marginBottom: 16,
        marginLeft: 24,
    },
    chantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chantNumber: {
        width: 32,
        alignItems: 'center',
    },
    numberText: {
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.6,
    },
    chantInfo: {
        flex: 1,
        marginLeft: 16,
    },
    chantTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    chantMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chantMetaText: {
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.8,
    },
    dot: {
        fontSize: 13,
        opacity: 0.6,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
});
