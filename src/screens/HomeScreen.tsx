import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { chantService, Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../components/AppBackground';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { useCountries } from '../hooks/useChants';
import { ChantCardSkeleton } from '../components/SkeletonLoader';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';
import { ScreenHeader } from '../components/ScreenHeader';
import { EnhancedChantCard } from '../components/EnhancedChantCard';
import { LinearGradient } from 'expo-linear-gradient';
import { AdBanner } from '../components/AdBanner';
import { GuestBanner } from '../components/GuestBanner';
import { SvgUri } from 'react-native-svg';
import { sanitizeUrl } from '../utils/url';
import { SupportersIcon } from '../components/icons/SupportersIcon';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;
const COUNTRY_GAP = 12;
const COUNTRY_COLUMNS = 2;
const COUNTRY_ITEM_WIDTH = (width - 32 - COUNTRY_GAP * (COUNTRY_COLUMNS - 1)) / COUNTRY_COLUMNS;
const QUICK_ACCESS_GAP = 12;
const QUICK_ACCESS_WIDTH = (width - 32 - QUICK_ACCESS_GAP) / 2;

export const HomeScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [myCountryChants, setMyCountryChants] = useState<Chant[]>([]);
    const [myCountryTop, setMyCountryTop] = useState<Chant[]>([]);
    const [otherChants, setOtherChants] = useState<Chant[]>([]);
    const [continueListening, setContinueListening] = useState<Chant[]>([]);
    const [userCountryId, setUserCountryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [useEnhancedView, setUseEnhancedView] = useState(false);
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { user } = useAuthStore();
    const { countries } = useCountries();

    const loadHomeContent = useCallback(async () => {
        try {
            let countryId: string | null = userCountryId;
            if (!countryId && user?.id) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('country_id')
                    .eq('id', user.id)
                    .single();
                countryId = profile?.country_id || null;
                setUserCountryId(countryId);
            }

            const [allChants] = await Promise.all([
                chantService.getAllChants(0, 40),
            ]);

            if (countryId) {
                const [myChants, topLocals] = await Promise.all([
                    chantService.getChantsByCountry(countryId, 0, 12),
                    chantService.getTrendingByCountry(countryId, 12),
                ]);
                setMyCountryChants(myChants);
                setMyCountryTop(topLocals);
            } else {
                setMyCountryChants([]);
                setMyCountryTop([]);
            }

            const others = allChants.filter(c => c.country_id !== countryId).slice(0, 12);
            setOtherChants(others);

            // Continue Listening (recently played by user)
            if (user?.id) {
                const { data } = await supabase
                    .from('chant_plays')
                    .select('chant_id, chants(*)')
                    .eq('user_id', user.id)
                    .order('started_at', { ascending: false })
                    .limit(10);
                const recent = (data || []).map((r: any) => r.chants).filter(Boolean).map((c: any) => ({
                    ...c,
                    audio_url: (/\.mp3($|\?)/i.test(String((c?.audio_bucket_url || c?.audio_url) || ''))
                        ? String((c?.audio_bucket_url || c?.audio_url) || '').trim().replace(/`/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '')
                        : '')
                }));
                setContinueListening(recent);
            } else {
                setContinueListening([]);
            }
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

    const handlePlayFromList = useCallback((list: Chant[], startIndex: number) => {
        if (!list || list.length === 0) return;
        const track = list[startIndex];
        const pickAudio = (c: any) => {
            const raw = (c?.audio_bucket_url as string) || (c?.audio_url as string) || '';
            const sanitized = String(raw).trim().replace(/`/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            return /\.mp3($|\?)/i.test(sanitized) ? sanitized : '';
        };
        const audio = pickAudio(track);
        const current = {
            id: track.id,
            title: getLocalizedTitle(track),
            artist: getDisplayArtist(track) || 'Unknown Team',
            audio_url: audio,
            duration: track.audio_duration,
            artwork_url: require('../../assets/images/chant-placeholder.png'),
        };
        usePlayerStore.getState().setCurrentTrack(current);
        const queue = list.map((c) => ({
            id: c.id,
            title: getLocalizedTitle(c),
            artist: getDisplayArtist(c) || 'Unknown Team',
            audio_url: pickAudio(c),
            duration: c.audio_duration,
            artwork_url: require('../../assets/images/chant-placeholder.png'),
        }));
        usePlayerStore.getState().setQueue(queue);
        usePlayerStore.getState().setIsPlaying(true);
        usePlayerStore.getState().setIsMinimized(false);
    }, []);

    const renderQuickAccessItem = useCallback(({ item }: { item: Chant }) => {
        const localizedTitle = getLocalizedTitle(item);
        return (
            <AnimatedTouchable
                style={styles.quickAccessCard}
                onPress={() => handlePlayFromList([item], 0)}
            >
                <View style={styles.quickAccessArtwork}>
                    <Ionicons name="musical-note" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.quickAccessTitle} numberOfLines={2}>{localizedTitle}</Text>
            </AnimatedTouchable>
        );
    }, [styles, Colors, handlePlayFromList]);

    const renderChantItem = useCallback(({ item }: { item: Chant }) => {
        return (
            <EnhancedChantCard
                chant={item}
                onPress={() => handlePlayFromList([item], 0)}
                showArtist={true}
                showYear={false}
                showRating={false}
                showTags={false}
                showViralMoment={false}
                compact={true}
                width={CARD_WIDTH}
                height={CARD_WIDTH * 1.25}
            />
        );
    }, [handlePlayFromList]);

    const renderSection = useCallback((title: string, data: Chant[]) => {
        if (data.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <FlatList
                    data={data}
                    renderItem={renderChantItem}
                    keyExtractor={(item, index) => `${item.id}:${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    initialNumToRender={5}
                    snapToInterval={CARD_WIDTH + 16}
                    decelerationRate="fast"
                    snapToAlignment="start"
                />
            </View>
        );
    }, [styles, renderChantItem]);

    const renderCountryCard = useCallback(({ item }: { item: any }) => {
        return (
            <AnimatedTouchable
                onPress={() => (navigation as any).navigate('Library', { countryId: item.id })}
                style={styles.countryCard}
            >
                <View style={styles.countryCardContainer}>
                    <Ionicons name="globe-outline" size={120} color={Colors.text} style={styles.bgGlobeIcon} />
                    <View style={styles.countryTopRow}>
                        <View style={styles.supporterIconContainer}>
                            <SupportersIcon size={20} />
                        </View>
                    </View>
                    <View style={styles.flagBadgeContainer}>
                        {item.flag_svg_url ? (
                            (() => {
                                const url = sanitizeUrl(item.flag_svg_url);
                                const code = (item.code ? String(item.code).toLowerCase() : (url.match(/flagcdn\.com\/([a-z]{2})\.svg/i)?.[1] || ''));
                                const pngFallback = code ? `https://flagcdn.com/w160/${code}.png` : undefined;
                                return (
                                    <View style={styles.flagBadge}>
                                        {pngFallback && (
                                            <Image source={{ uri: pngFallback }} style={styles.flagBadgeImage} resizeMode="contain" />
                                        )}
                                        <SvgUri uri={url} width={56} height={56} />
                                    </View>
                                );
                            })()
                        ) : (
                            <View style={styles.flagBadge}>
                                <Text style={styles.flagCenterEmoji}>{item.flag_emoji || '🏳️'}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.countryInfo}>
                        <Text style={styles.countryName} numberOfLines={1}>{item.name}</Text>
                    </View>
                </View>
            </AnimatedTouchable>
        );
    }, [navigation, Colors, t]);

    return (
        <AppBackground>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <ScreenHeader
                    title={t('home.title')}
                    subtitle={t('home.subtitle')}
                    backgroundImage={require('../../assets/images/stadium_background.png')}
                />
                <GuestBanner />

                {loading ? (
                    <View style={{ paddingHorizontal: 16 }}>
                        <ChantCardSkeleton count={6} />
                    </View>
                ) : (
                    <FadeInView duration={400}>
                        {/* Hero Image */}
                        <View style={styles.heroContainer}>
                            <Image
                                source={require('../../assets/images/unleash-the-spirit.png')}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.heroGradient}
                            />
                            <Text style={styles.heroText}>UNLEASH THE SPIRIT</Text>
                            <View style={styles.heroActions}>
                                <TouchableOpacity style={styles.inviteButton} onPress={() => navigation.navigate('InviteFriends')}>
                                    <Ionicons name="gift" size={16} color={Colors.black} />
                                    <Text style={styles.inviteText}>{t('invite.share', 'Invite Friends')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {renderSection('From My Country', myCountryChants)}
                        {renderSection('Top In My Country', myCountryTop)}
                        {renderSection('Continue Listening', continueListening)}
                        {renderSection('Discover Others', otherChants)}
                        {countries.filter(c => c.id !== userCountryId).length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Explore Countries</Text>
                                </View>
                                <FlatList
                                    data={countries.filter(c => c.id !== userCountryId)}
                                    renderItem={renderCountryCard}
                                    keyExtractor={(item, index) => `${item.id}:${index}`}
                                    numColumns={COUNTRY_COLUMNS}
                                    columnWrapperStyle={{ gap: COUNTRY_GAP, paddingHorizontal: 16, justifyContent: 'space-between' }}
                                    contentContainerStyle={{ gap: COUNTRY_GAP, paddingHorizontal: 16, alignItems: 'center' }}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                        {countries.length === 0 && !loading && (
                            <View style={[styles.section, { paddingHorizontal: 16 }]}> 
                                <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border || 'rgba(255,255,255,0.08)' }}>
                                    <Text style={{ color: Colors.text, fontWeight: '700', marginBottom: 6 }}>Explore Countries</Text>
                                    <Text style={{ color: Colors.textSecondary, marginBottom: 10 }}>Sign in or check your connection to load countries.</Text>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => navigation.navigate('Login' as any)}>
                                        <Ionicons name="log-in" size={16} color={'#FFF'} />
                                        <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Go to Sign In</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        {/* Web PWA Ad Banner */}
                        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                            <AdBanner adUnitId={(process.env.EXPO_PUBLIC_ADSENSE_SLOT_HOME as string) || '1234567890'} />
                        </View>
                    </FadeInView>
                )}
            </ScrollView>
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    heroContainer: {
        paddingHorizontal: 16,
        marginBottom: 32,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
    },
    heroGradient: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 0,
        height: 100,
        borderRadius: 16,
    },
    heroText: {
        position: 'absolute',
        bottom: 20,
        left: 32,
        color: Colors.gold,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroActions: {
        position: 'absolute',
        bottom: 24,
        right: 32,
        flexDirection: 'row',
        gap: 8,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gold,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    inviteText: {
        marginLeft: 6,
        color: Colors.black,
        fontWeight: '700',
        fontSize: 12,
    },
    quickAccessCard: {
        width: QUICK_ACCESS_WIDTH,
        height: 64,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    quickAccessArtwork: {
        width: 64,
        height: 64,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quickAccessTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
        paddingRight: 12,
        lineHeight: 16,
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    countryCard: {
        width: COUNTRY_ITEM_WIDTH,
        height: 120,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    countryCardContainer: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border || 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    bgGlobeIcon: {
        position: 'absolute',
        right: -12,
        bottom: -12,
        opacity: 0.12,
    },
    topRightIcon: {
        position: 'absolute',
        right: 8,
        top: 8,
        opacity: 0.9,
    },
    supporterIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    countryTopRow: {
        position: 'absolute',
        top: 6,
        left: 12,
        right: 12,
        height: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countryFlagSmall: {
        fontSize: 12,
        color: Colors.text,
    },
    countryFlagImage: {
        width: 16,
        height: 12,
        borderRadius: 2,
        overflow: 'hidden',
    },
    countryEmojiIcon: {
        fontSize: 20,
        color: '#FFF',
        display: 'none',
    },
    countryInfo: {
        marginTop: 8,
    },
    countryNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    countryName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: 0.2,
        flex: 1,
        marginRight: 8,
    },
    exploreIcon: {
        marginLeft: 4,
    },
    flagBadgeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 92,
        marginTop: 8,
    },
    flagBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.surfaceLight,
        borderWidth: 1,
        borderColor: Colors.border || 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    flagBadgeImage: {
        width: 56,
        height: 56,
    },
    flagCenterEmoji: {
        fontSize: 32,
        color: Colors.text,
    },
    // Deprecated old styles (kept for compatibility)
    flagContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    countryEmoji: {
        fontSize: 24,
    },
    exploreRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exploreText: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '600',
        marginRight: 4,
        textTransform: 'uppercase',
    },
    viewToggle: {
        padding: 4,
    },
    horizontalList: {
        paddingHorizontal: 16,
        gap: 0, // Gap handled by card margin
    },
});
