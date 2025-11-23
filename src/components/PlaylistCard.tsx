// src/components/PlaylistCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { Playlist } from '../types/playlist';
import { useTranslation } from 'react-i18next';

interface PlaylistCardProps {
    playlist: Playlist;
    onPress?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
    playlist,
    onPress,
    onShare,
    onDelete,
}) => {
    const Colors = useColors();
    const { t } = useTranslation();
    const navigation = useNavigation();

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // @ts-ignore - navigation typing
            navigation.navigate('PlaylistDetail', { playlistId: playlist.id });
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: Colors.surface }]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            {/* Cover Image */}
            <Image
                source={require('../../assets/playlist-cover-default.png')}
                style={styles.coverImage}
                resizeMode="cover"
            />

            {/* Playlist Info */}
            <View style={styles.info}>
                <Text style={[styles.name, { color: Colors.text }]} numberOfLines={1}>
                    {playlist.name}
                </Text>

                {playlist.description && (
                    <Text style={[styles.description, { color: Colors.textSecondary }]} numberOfLines={2}>
                        {playlist.description}
                    </Text>
                )}

                <View style={styles.metadata}>
                    <View style={styles.metadataItem}>
                        <Ionicons name="musical-notes" size={14} color={Colors.textSecondary} />
                        <Text style={[styles.metadataText, { color: Colors.textSecondary }]}>
                            {t('playlists.chantCount', { count: playlist.chant_count })}
                        </Text>
                    </View>

                    {playlist.total_duration > 0 && (
                        <View style={styles.metadataItem}>
                            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                            <Text style={[styles.metadataText, { color: Colors.textSecondary }]}>
                                {formatDuration(playlist.total_duration)}
                            </Text>
                        </View>
                    )}

                    {playlist.is_public && (
                        <View style={styles.metadataItem}>
                            <Ionicons name="globe-outline" size={14} color={Colors.primary} />
                            <Text style={[styles.metadataText, { color: Colors.primary }]}>
                                {t('playlists.public')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {onShare && (
                    <TouchableOpacity onPress={onShare} style={styles.actionButton}>
                        <Ionicons name="share-social-outline" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}

                {onDelete && (
                    <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)', // Gold border
        alignItems: 'center',
    },
    coverImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    info: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    description: {
        fontSize: 12,
        marginBottom: 6,
        opacity: 0.7,
        lineHeight: 16,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metadataText: {
        fontSize: 11,
        fontWeight: '500',
    },
    actions: {
        justifyContent: 'center',
        gap: 8,
        paddingLeft: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});
