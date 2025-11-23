// src/screens/PlaylistsScreen.tsx
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
import GradientBackground from '../components/GradientBackground';

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
        Alert.alert(
            t('playlists.deleteConfirm'),
            t('playlists.deleteMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePlaylist(playlist.id);
                            Alert.alert(t('playlists.deleteSuccess'));
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message);
                        }
                    },
                },
            ]
        );
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

    if (!user && !isGuest) {
        return (
            <GradientBackground>
                <View style={styles.centerContainer}>
                    <Ionicons name="person-outline" size={80} color={Colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                        {t('auth.signIn')}
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
                        Sign in to create and manage playlists
                    </Text>
                </View>
            </GradientBackground>
        );
    }

    if (isGuest) {
        return (
            <GradientBackground>
                <View style={styles.centerContainer}>
                    <Ionicons name="lock-closed-outline" size={80} color={Colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: Colors.text }]}>
                        Guest Mode
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
                        Sign in to create and manage your own playlists
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: Colors.primary, marginTop: 20 }]}
                        onPress={() => useAuthStore.getState().signOut()}
                    >
                        <Text style={styles.createButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: Colors.text }]}>
                        {t('playlists.myPlaylists')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: Colors.primary }]}
                        onPress={handleCreatePlaylist}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Playlists List */}
                {isLoading && !refreshing ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
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
                )}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
