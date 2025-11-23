import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
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

    const renderHorizontalChantItem = useCallback(({ item }: { item: Chant }) => {
        const localizedTitle = getLocalizedTitle(item);
        const displayArtist = getDisplayArtist(item);

        return (
            <TouchableOpacity
                style={styles.horizontalChantCard}
                onPress={() => {
                    usePlayerStore.getState().setCurrentTrack({
                        id: item.id,
                        title: localizedTitle,
                        artist: displayArtist || 'Unknown Team',
                        audio_url: item.audio_url,
                        duration: item.audio_duration,
                        artwork_url: require('../../assets/images/chant-placeholder.png'), // Local placeholder
                    });
                    usePlayerStore.getState().setIsMinimized(false);
                }}
            >
                <View style={styles.horizontalArtwork}>
                    <Ionicons name="musical-note" size={40} color={Colors.textSecondary} />
                </View>
                <Text style={styles.horizontalChantTitle} numberOfLines={2}>{localizedTitle}</Text>
                <Text style={styles.horizontalChantTeam} numberOfLines={1}>{displayArtist || ''}</Text>
                <View style={styles.horizontalStatsRow}>
                    <Ionicons name="play-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.horizontalStatsText}>{item.play_count || 0}</Text>
                </View>
            </TouchableOpacity>
        );
    }, [styles, Colors, getLocalizedTitle, getDisplayArtist]);

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
        <GradientBackground>
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
        </GradientBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // More space for floating player
    },
    header: {
        paddingTop: 70,
        paddingBottom: 30,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 36, // Larger
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 18,
        color: Colors.textSecondary,
        fontWeight: '500',
        opacity: 0.8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    horizontalList: {
        paddingHorizontal: 16,
    },
    horizontalChantCard: {
        width: 160, // Wider cards
        marginHorizontal: 8,
        backgroundColor: Colors.surface,
        borderRadius: 20, // More rounded
        padding: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    horizontalArtwork: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    horizontalChantTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
        minHeight: 40,
        lineHeight: 20,
    },
    horizontalChantTeam: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 10,
        fontWeight: '500',
    },
    horizontalStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceHighlight,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    horizontalStatsText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
});
