import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { PlaylistCard } from '../components/PlaylistCard';
import { Playlist } from '../types/playlist';
import { sharingService } from '../services/sharingService';
import { AppBackground } from '../components/AppBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { GuestRestrictedView } from '../components/GuestRestrictedView';
import { FadeInView } from '../components/FadeInView';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const PlaylistsScreen = () => {
    const Colors = useColors();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user, isGuest } = useAuthStore();
    const {
        playlists,
        isLoading,
        fetchUserPlaylists,
        deletePlaylist,
    } = usePlaylistStore();

    const [refreshing, setRefreshing] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (user) {
            loadPlaylists();
        }
    }, [user]);

    const loadPlaylists = async () => {
        try {
            await fetchUserPlaylists();
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPlaylists();
        setRefreshing(false);
    };

    const handleCreatePlaylist = () => {
        // @ts-ignore
        navigation.navigate('CreatePlaylist');
    };

    const handlePlaylistPress = (playlist: Playlist) => {
        // @ts-ignore
        navigation.navigate('PlaylistDetail', { playlistId: playlist.id });
    };

    const handleSharePlaylist = async (playlist: Playlist) => {
        try {
            const content = sharingService.generatePlaylistLink(playlist.id, playlist.name);
            await sharingService.shareNative(content);
            await sharingService.trackShare('playlist', playlist.id, 'native');
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleDeletePlaylist = (playlist: Playlist) => {
        setPlaylistToDelete(playlist);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!playlistToDelete) return;

        setIsDeleting(true);
        try {
            console.log('[PlaylistsScreen] Deleting playlist:', playlistToDelete.id, 'for user:', user?.id);
            await deletePlaylist(playlistToDelete.id);
            console.log('[PlaylistsScreen] Playlist deleted successfully');
            setDeleteModalVisible(false);
            setPlaylistToDelete(null);
        } catch (error: any) {
            console.error('[PlaylistsScreen] Delete error:', error);
            Alert.alert(t('common.error'), error.message || 'Failed to delete playlist');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderPlaylist = ({ item }: { item: Playlist }) => (
        <PlaylistCard
            playlist={item}
            onPress={() => handlePlaylistPress(item)}
            onShare={() => handleSharePlaylist(item)}
            onDelete={() => handleDeletePlaylist(item)}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={80} color={Colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                {t('playlists.empty')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
                {t('playlists.emptyDescription')}
            </Text>
            <TouchableOpacity
                style={[styles.createButton, { backgroundColor: Colors.primary }]}
                onPress={handleCreatePlaylist}
            >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.createButtonText}>{t('playlists.create')}</Text>
            </TouchableOpacity>
        </View>
    );

    if (isGuest) {
        return (
            <AppBackground>
                <GuestRestrictedView
                    icon="musical-notes"
                    title="Your Playlists"
                    message="Sign in to create, manage, and share your custom chant playlists."
                    onSignIn={() => useAuthStore.getState().signOut()}
                />
            </AppBackground>
        );
    }

    return (
        <AppBackground>
            <View style={styles.container}>
                <ScreenHeader
                    title={t('playlists.myPlaylists')}
                    subtitle="Your Collection"
                    backgroundImage={require('../../assets/images/playlist_header.png')}
                    rightAction={
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: Colors.primary }]}
                            onPress={handleCreatePlaylist}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    }
                />

                {isLoading && !refreshing ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <FadeInView style={{ flex: 1 }}>
                        <FlatList
                            data={playlists}
                            renderItem={renderPlaylist}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={renderEmpty}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            showsVerticalScrollIndicator={false}
                        />
                    </FadeInView>
                )}
            </View>
            <ConfirmationModal
                visible={deleteModalVisible}
                title={t('playlists.deleteConfirm')}
                message={t('playlists.deleteMessage')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                loading={isDeleting}
                icon="trash-outline"
                variant="danger"
            />
        </AppBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    listContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 100,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        opacity: 0.8,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
