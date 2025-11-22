import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { chantService, Chant } from '../services/chantService';
import { useColors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { MosaicBackground } from '../components/MosaicBackground';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/playerStore';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const HomeScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [trendingChants, setTrendingChants] = useState<Chant[]>([]);
    const [popularChants, setPopularChants] = useState<Chant[]>([]);
    const [recentChants, setRecentChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const loadHomeContent = useCallback(async () => {
        try {
            const [trending, recent] = await Promise.all([
                chantService.getTrendingChants(10),
                chantService.getAllChants(0, 10),
            ]);
            setTrendingChants(trending);
            setRecentChants(recent);
            // Popular is also trending but we can show a different slice
            setPopularChants(trending.slice(0, 5));
        } catch (error) {
            console.error('Error loading home content:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHomeContent();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadHomeContent();
    }, [loadHomeContent]);

    const renderHorizontalChantItem = useCallback(({ item }: { item: Chant }) => (
        <TouchableOpacity
            style={styles.horizontalChantCard}
            onPress={() => {
                usePlayerStore.getState().setCurrentTrack({
                    id: item.id,
                    title: item.title,
                    artist: item.football_team || 'Unknown Team',
                    audio_url: item.audio_url,
                    duration: item.audio_duration,
                    artwork_url: 'https://via.placeholder.com/300', // Placeholder for now
                });
                usePlayerStore.getState().setIsMinimized(false);
            }}
        >
            <View style={styles.horizontalArtwork}>
                <Ionicons name="musical-note" size={40} color={Colors.textSecondary} />
            </View>
            <Text style={styles.horizontalChantTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.horizontalChantTeam} numberOfLines={1}>{item.football_team}</Text>
            <View style={styles.horizontalStatsRow}>
                <Ionicons name="play-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.horizontalStatsText}>{item.play_count || 0}</Text>
            </View>
        </TouchableOpacity>
    ), [styles, Colors]);

    const renderSection = useCallback((title: string, data: Chant[], icon: string) => {
        if (data.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name={icon as any} size={24} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <FlatList
                    data={data}
                    renderItem={renderHorizontalChantItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    initialNumToRender={5}
                />
            </View>
        );
    }, [styles, Colors, renderHorizontalChantItem]);

    return (
        <MosaicBackground>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('home.title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('home.subtitle')}</Text>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <>
                        {renderSection(t('home.trending'), trendingChants, 'trending-up')}
                        {renderSection(t('home.popular'), popularChants, 'star')}
                        {renderSection(t('home.recent'), recentChants, 'time')}
                    </>
                )}
            </ScrollView>
        </MosaicBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 8,
    },
    horizontalList: {
        paddingHorizontal: 16,
    },
    horizontalChantCard: {
        width: 140,
        marginHorizontal: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    horizontalArtwork: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    horizontalChantTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
        minHeight: 36,
    },
    horizontalChantTeam: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    horizontalStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    horizontalStatsText: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
});
