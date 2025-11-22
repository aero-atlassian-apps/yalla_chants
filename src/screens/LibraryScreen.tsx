import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useColors } from '../constants/Colors';
import { MosaicBackground } from '../components/MosaicBackground';
import { Ionicons } from '@expo/vector-icons';
import { chantService, Chant } from '../services/chantService';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/playerStore';

type LibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface LibraryItem {
    id: string;
    type: 'header' | 'chant';
    title?: string;
    chant?: Chant;
}

export const LibraryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<LibraryScreenNavigationProp>();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { user } = useAuthStore();

    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadLibraryContent = useCallback(async () => {
        try {
            if (!user) {
                setLoading(false);
                return;
            }

            const [likedChants, allChants] = await Promise.all([
                chantService.getLikedChants(user.id, 0, 50),
                chantService.getAllChants(0, 100),
            ]);

            // Filter out liked chants from all chants
            const likedIds = new Set(likedChants.map(c => c.id));
            const otherChants = allChants.filter(c => !likedIds.has(c.id));

            // Build library items with headers
            const items: LibraryItem[] = [];

            if (likedChants.length > 0) {
                items.push({ id: 'header-favorites', type: 'header', title: t('library.favorites') });
                likedChants.forEach(chant => {
                    items.push({ id: `liked-${chant.id}`, type: 'chant', chant });
                });
            }

            if (otherChants.length > 0) {
                items.push({ id: 'header-all', type: 'header', title: t('library.allChants') });
                otherChants.forEach(chant => {
                    items.push({ id: `all-${chant.id}`, type: 'chant', chant });
                });
            }

            setLibraryItems(items);
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadLibraryContent();
    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLibraryContent();
    }, [loadLibraryContent]);

    const renderItem = useCallback(({ item }: { item: LibraryItem }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
            );
        }

        const chant = item.chant!;
        return (
            <TouchableOpacity
                style={styles.chantCard}
                onPress={() => {
                    usePlayerStore.getState().setCurrentTrack({
                        id: chant.id,
                        title: chant.title,
                        artist: chant.football_team || 'Unknown Team',
                        audio_url: chant.audio_url,
                        duration: chant.audio_duration,
                        artwork_url: 'https://via.placeholder.com/300',
                    });
                    usePlayerStore.getState().setIsMinimized(false);
                }}
            >
                <View style={styles.artwork}>
                    <Ionicons name="musical-note" size={30} color={Colors.textSecondary} />
                </View>
                <View style={styles.chantInfo}>
                    <Text style={styles.chantTitle} numberOfLines={1}>{chant.title}</Text>
                    <Text style={styles.chantTeam} numberOfLines={1}>{chant.football_team}</Text>
                    <View style={styles.statsRow}>
                        <Ionicons name="heart-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.statsText}>{chant.like_count || 0}</Text>
                        <Ionicons name="play-outline" size={16} color={Colors.textSecondary} style={{ marginLeft: 12 }} />
                        <Text style={styles.statsText}>{chant.play_count || 0}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.playButton}>
                    <Ionicons name="play-circle" size={40} color={Colors.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, [styles, Colors]);

    return (
        <MosaicBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('library.title')}</Text>
            </View>
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={libraryItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    windowSize={10}
                    initialNumToRender={10}
                />
            )}
        </MosaicBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    chantCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    artwork: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chantInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    chantTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    chantTeam: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    playButton: {
        padding: 4,
    },
});
