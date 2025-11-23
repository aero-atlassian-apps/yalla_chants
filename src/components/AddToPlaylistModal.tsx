// src/components/AddToPlaylistModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { Playlist } from '../types/playlist';

interface AddToPlaylistModalProps {
    visible: boolean;
    chantId: string;
    chantTitle: string;
    onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
    visible,
    chantId,
    chantTitle,
    onClose,
}) => {
    const Colors = useColors();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const {
        playlists,
        isLoading,
        fetchUserPlaylists,
        createPlaylist,
        addChant,
    } = usePlaylistStore();

    const [showCreateNew, setShowCreateNew] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (visible && user) {
            fetchUserPlaylists();
        }
    }, [visible, user]);

    const handleAddToPlaylist = async (playlist: Playlist) => {
        try {
            await addChant(playlist.id, chantId);
            Alert.alert(
                t('playlists.addedToPlaylist'),
                `"${chantTitle}" ${t('playlists.addedToPlaylist')} "${playlist.name}"`
            );
            onClose();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        }
    };

    const handleCreateAndAdd = async () => {
        if (!newPlaylistName.trim()) {
            Alert.alert(t('common.error'), t('playlists.namePlaceholder'));
            return;
        }

        setCreating(true);
        try {
            const newPlaylist = await createPlaylist({
                name: newPlaylistName.trim(),
                is_public: false,
            });

            await addChant(newPlaylist.id, chantId);

            Alert.alert(
                t('playlists.createSuccess'),
                `"${chantTitle}" ${t('playlists.addedToPlaylist')} "${newPlaylist.name}"`
            );

            setNewPlaylistName('');
            setShowCreateNew(false);
            onClose();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setCreating(false);
        }
    };

    const renderPlaylistItem = ({ item }: { item: Playlist }) => (
        <TouchableOpacity
            style={[styles.playlistItem, { backgroundColor: Colors.surfaceLight }]}
            onPress={() => handleAddToPlaylist(item)}
        >
            <View style={styles.playlistInfo}>
                <Text style={[styles.playlistName, { color: Colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.playlistMeta, { color: Colors.textSecondary }]}>
                    {t('playlists.chantCount', { count: item.chant_count })}
                </Text>
            </View>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: Colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors.text }]}>
                            {t('playlists.addChant')}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Chant Info */}
                    <View style={[styles.chantInfo, { backgroundColor: Colors.surface }]}>
                        <Ionicons name="musical-note" size={20} color={Colors.primary} />
                        <Text style={[styles.chantTitle, { color: Colors.text }]} numberOfLines={1}>
                            {chantTitle}
                        </Text>
                    </View>

                    {/* Create New Playlist */}
                    {showCreateNew ? (
                        <View style={[styles.createSection, { backgroundColor: Colors.surface }]}>
                            <TextInput
                                style={[styles.input, { color: Colors.text, borderColor: Colors.border }]}
                                placeholder={t('playlists.namePlaceholder')}
                                placeholderTextColor={Colors.textSecondary}
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                autoFocus
                            />
                            <View style={styles.createActions}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowCreateNew(false);
                                        setNewPlaylistName('');
                                    }}
                                    style={styles.cancelButton}
                                >
                                    <Text style={[styles.cancelText, { color: Colors.textSecondary }]}>
                                        {t('common.cancel')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateAndAdd}
                                    style={[styles.createButton, { backgroundColor: Colors.primary }]}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.createButtonText}>{t('common.save')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.createNewButton, { backgroundColor: Colors.primary }]}
                            onPress={() => setShowCreateNew(true)}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <Text style={styles.createNewText}>{t('playlists.createNew')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Playlists List */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : playlists.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="musical-notes-outline" size={48} color={Colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                                {t('playlists.empty')}
                            </Text>
                            <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
                                {t('playlists.emptyDescription')}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={playlists}
                            renderItem={renderPlaylistItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        maxHeight: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    chantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    chantTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    createNewText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    createSection: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        padding: 10,
    },
    cancelText: {
        fontSize: 16,
    },
    createButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
    },
    playlistInfo: {
        flex: 1,
    },
    playlistName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    playlistMeta: {
        fontSize: 13,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
});
