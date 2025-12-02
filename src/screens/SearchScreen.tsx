import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChantSearch, useCountries, useChantsByCountry, useChantSearchEnhanced } from '../hooks/useChants';
import { usePlayerStore } from '../store/playerStore';
import { Chant, chantService } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { ShareButton } from '../components/ShareButton';
import { EnhancedChantCard } from '../components/EnhancedChantCard';
import { AppBackground } from '../components/AppBackground';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ChantCardSkeleton } from '../components/SkeletonLoader';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';
import { ScreenHeader } from '../components/ScreenHeader';
import { GuestBanner } from '../components/GuestBanner';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - 32 - GAP) / COLUMN_COUNT;
const ARTWORK_HEIGHT = Math.round(ITEM_WIDTH * (Dimensions.get('window').width > 480 ? 0.5 : 0.65));
export const SearchScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const Colors = useColors();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ countries: any[]; teams: string[]; tournaments: string[] }>({ countries: [], teams: [], tournaments: [] });
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [useEnhancedSearch, setUseEnhancedSearch] = useState(true);
    const { chants, loading, search } = useChantSearch();
    const { chants: enhancedChants, loading: enhancedLoading, search: enhancedSearch, updateFilters, filters } = useChantSearchEnhanced();
    const { countries } = useCountries();
    const { chants: countryChants, loading: countryLoading } = useChantsByCountry(selectedCountry || undefined);
    const { setCurrentTrack, setIsPlaying, setQueue } = usePlayerStore();

    const styles = useMemo(() => createStyles(Colors, insets), [Colors, insets]);

    // Debounce search to reduce API calls
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search by 300ms
        if (text.length > 2) {
            searchTimeoutRef.current = setTimeout(() => {
                if (useEnhancedSearch) {
                    enhancedSearch(text);
                } else {
                    search(text);
                }
                // Suggestions
                const countryMatches = countries.filter(c => c.name.toLowerCase().includes(text.toLowerCase())).slice(0, 5);
                Promise.all([
                    chantService.searchTeams(text, 8),
                    chantService.searchTournaments(text, 8),
                ]).then(([teams, tournaments]) => {
                    setSuggestions({ countries: countryMatches, teams, tournaments });
                }).catch(() => setSuggestions({ countries: countryMatches, teams: [], tournaments: [] }));
            }, 300);
        }
    }, [search, enhancedSearch, useEnhancedSearch]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const playChant = useCallback((chant: Chant) => {
        const localizedTitle = getLocalizedTitle(chant);
        const displayArtist = getDisplayArtist(chant);
        setCurrentTrack({
            id: chant.id,
            title: localizedTitle,
            artist: displayArtist || 'Unknown',
            artwork_url: countries.find(c => c.id === chant.country_id)?.flag_svg_url || '',
            audio_url: chant.audio_url,
            duration: chant.audio_duration,
        });
        const source = selectedCountry ? countryChants : (useEnhancedSearch && searchQuery.length > 0 ? enhancedChants : chants);
        setQueue(
            source.map(c => {
                const cc = countries.find(ct => ct.id === c.country_id);
                const chantLocalizedTitle = getLocalizedTitle(c);
                const chantDisplayArtist = getDisplayArtist(c);
                return {
                    id: c.id,
                    title: chantLocalizedTitle,
                    artist: chantDisplayArtist || 'Unknown',
                    artwork_url: cc?.flag_svg_url || '',
                    audio_url: c.audio_url,
                    duration: c.audio_duration,
                };
            })
        );
        setIsPlaying(true);
    }, [setCurrentTrack, setQueue, setIsPlaying, countries, selectedCountry, countryChants, chants, enhancedChants, useEnhancedSearch, searchQuery]);

    const renderChantItem = ({ item }: { item: Chant }) => {
        const country = countries.find(c => c.id === item.country_id);
        const localizedTitle = getLocalizedTitle(item);
        const displayArtist = getDisplayArtist(item);

        return (
            <AnimatedTouchable
                style={styles.chantCard}
                onPress={() => playChant(item)}
            >
                <View style={styles.chantCardArtwork}>
                    <Text style={{ fontSize: 48 }}>{country?.flag_emoji || '🎵'}</Text>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color={Colors.white} />
                    </View>
                </View>
                <Text style={styles.chantCardTitle} numberOfLines={2}>{localizedTitle}</Text>
                <Text style={styles.chantCardSubtitle} numberOfLines={1}>
                    {displayArtist || country?.name || ''}
                </Text>
            </AnimatedTouchable>
        );
    };

    const renderCountryCard = ({ item, index }: { item: any, index: number }) => {
        return (
            <AnimatedTouchable
                onPress={() => setSelectedCountry(item.id)}
                style={styles.countryCard}
            >
                <LinearGradient
                    colors={[Colors.surfaceLight, Colors.surface]}
                    style={styles.countryCardGradient}
                >
                    <View style={styles.countryTopRow}>
                        <Text style={styles.countryEmojiIcon}>🧭</Text>
                        <Text style={[styles.countryEmojiIcon, { marginLeft: 8 }]}>👥</Text>
                        {item.flag_svg_url ? (
                            <Image source={{ uri: item.flag_svg_url }} style={styles.countryFlagImage} resizeMode="contain" />
                        ) : (
                            <Text style={styles.countryFlagSmall}>{item.flag_emoji || '🏳️'}</Text>
                        )}
                    </View>
                    <View style={styles.countryInfo}>
                        <View style={styles.countryNameRow}>
                            <Text style={styles.countryName} numberOfLines={1}>{item.name}</Text>
                            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} style={styles.exploreIcon} />
                        </View>
                    </View>
                </LinearGradient>
            </AnimatedTouchable>
        );
    };

    return (
        <AppBackground>
            <FlatList
                data={[]} // Main list is empty, we use ListHeaderComponent for layout
                renderItem={() => null}
                ListHeaderComponent={
                    <>
                        <ScreenHeader
                            title="Search"
                            backgroundImage={require('../../assets/images/search_header.png')}
                        />
                        <GuestBanner />

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('searchScreen.placeholder')}
                                placeholderTextColor={Colors.textSecondary}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    setSearchQuery('');
                                    search('');
                                }}>
                                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Enhanced Search Toggle */}
                        {searchQuery.length > 0 && (
                            <View style={styles.searchOptions}>
                                <TouchableOpacity
                                    style={[styles.toggleButton, useEnhancedSearch && styles.toggleButtonActive]}
                                    onPress={() => setUseEnhancedSearch(!useEnhancedSearch)}
                                >
                                    <Ionicons
                                        name={useEnhancedSearch ? "sparkles" : "sparkles-outline"}
                                        size={16}
                                        color={useEnhancedSearch ? "#FFF" : Colors.textSecondary}
                                    />
                                    <Text style={[styles.toggleButtonText, useEnhancedSearch && styles.toggleButtonTextActive]}>
                                        {t('searchScreen.enhancedSearch')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.filterButton}
                                    onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                >
                                    <Ionicons name="options-outline" size={20} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Suggestions */}
                        {searchQuery.length > 2 && (suggestions.countries.length > 0 || suggestions.teams.length > 0 || suggestions.tournaments.length > 0) && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.countries.length > 0 && (
                                    <View style={styles.suggestionSection}>
                                        <Text style={styles.suggestionTitle}>{t('searchScreen.countries')}</Text>
                                        <View style={styles.suggestionChips}>
                                            {suggestions.countries.map(c => (
                                                <TouchableOpacity key={c.id} style={styles.suggestionChip} onPress={() => setSelectedCountry(c.id)}>
                                                    <Text style={styles.suggestionChipText}>{c.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {suggestions.teams.length > 0 && (
                                    <View style={styles.suggestionSection}>
                                        <Text style={styles.suggestionTitle}>{t('searchScreen.teams')}</Text>
                                        <View style={styles.suggestionChips}>
                                            {suggestions.teams.map(team => (
                                                <TouchableOpacity key={team} style={styles.suggestionChip} onPress={() => updateFilters({ ...filters, football_team: team })}>
                                                    <Text style={styles.suggestionChipText}>{team}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {suggestions.tournaments.length > 0 && (
                                    <View style={styles.suggestionSection}>
                                        <Text style={styles.suggestionTitle}>{t('searchScreen.tournaments')}</Text>
                                        <View style={styles.suggestionChips}>
                                            {suggestions.tournaments.map(tour => (
                                                <TouchableOpacity key={tour} style={styles.suggestionChip} onPress={() => updateFilters({ ...filters, tournament: tour })}>
                                                    <Text style={styles.suggestionChipText}>{tour}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                        {/* Advanced Filters */}
                        {showAdvancedFilters && searchQuery.length > 0 && (
                            <View style={styles.advancedFilters}>
                                <Text style={styles.filterSectionTitle}>{t('searchScreen.filters')}</Text>

                                <View style={styles.filterRow}>
                                    <TouchableOpacity
                                        style={[styles.filterChip, filters.is_verified && styles.filterChipActive]}
                                        onPress={() => updateFilters({ ...filters, is_verified: !filters.is_verified })}
                                    >
                                        <Ionicons name="checkmark-circle" size={14} color={filters.is_verified ? "#FFF" : Colors.textSecondary} />
                                        <Text style={[styles.filterChipText, filters.is_verified && styles.filterChipTextActive]}>
                                            {t('searchScreen.verified')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.filterChip, filters.is_official && styles.filterChipActive]}
                                        onPress={() => updateFilters({ ...filters, is_official: !filters.is_official })}
                                    >
                                        <Ionicons name="trophy" size={14} color={filters.is_official ? "#FFF" : Colors.textSecondary} />
                                        <Text style={[styles.filterChipText, filters.is_official && styles.filterChipTextActive]}>
                                            {t('searchScreen.official')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.filterChip, filters.is_traditional && styles.filterChipActive]}
                                        onPress={() => updateFilters({ ...filters, is_traditional: !filters.is_traditional })}
                                    >
                                        <Ionicons name="time" size={14} color={filters.is_traditional ? "#FFF" : Colors.textSecondary} />
                                        <Text style={[styles.filterChipText, filters.is_traditional && styles.filterChipTextActive]}>
                                            {t('searchScreen.traditional')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {filters.year && (
                                    <View style={styles.activeFilter}>
                                        <Text style={styles.activeFilterText}>{t('searchScreen.year', { year: filters.year })}</Text>
                                        <TouchableOpacity onPress={() => updateFilters({ ...filters, year: undefined })}>
                                            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Browse All Grid (Only when no search & no country selected) */}
                        {searchQuery.length === 0 && !selectedCountry && countries.length > 0 && (
                            <View style={styles.browseContainer}>
                                <Text style={styles.sectionTitle}>{t('searchScreen.browseAll')}</Text>
                                <FlatList
                                    data={countries}
                                    renderItem={renderCountryCard}
                                    keyExtractor={item => item.id}
                                    numColumns={COLUMN_COUNT}
                                    columnWrapperStyle={{ gap: GAP }}
                                    contentContainerStyle={{ gap: GAP }}
                                    scrollEnabled={false} // Nested in main ScrollView
                                />
                            </View>
                        )}
                        {searchQuery.length === 0 && !selectedCountry && countries.length === 0 && (
                            <View style={styles.browseContainer}>
                                <Text style={styles.sectionTitle}>{t('searchScreen.browseAll')}</Text>
                                <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border || 'rgba(255,255,255,0.08)' }}>
                                    <Text style={{ color: Colors.textSecondary, marginBottom: 10 }}>Sign in or check your connection to load countries.</Text>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => (navigation as any).navigate('Profile')}>
                                        <Ionicons name="log-in" size={16} color={'#FFF'} />
                                        <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Go to Sign In</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Selected Country Header */}
                        {selectedCountry && (
                            <View style={styles.filterHeader}>
                                <TouchableOpacity onPress={() => setSelectedCountry(null)} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.filterTitle}>
                                    {countries.find(c => c.id === selectedCountry)?.name}
                                </Text>
                            </View>
                        )}

                        {/* Search Results or Country Chants */}
                        {(searchQuery.length > 0 || selectedCountry) && (
                            <View style={styles.resultsContainer}>
                                {(selectedCountry ? countryLoading : (useEnhancedSearch ? enhancedLoading : loading)) ? (
                                    <ChantCardSkeleton count={6} />
                                ) : (selectedCountry ? countryChants.length === 0 : (useEnhancedSearch ? enhancedChants.length === 0 : chants.length === 0)) ? (
                                    <View style={styles.centerContent}>
                                        <Ionicons name="sad-outline" size={64} color={Colors.textSecondary} />
                                        <Text style={styles.emptyTitle}>{t('searchScreen.noResults')}</Text>
                                        {searchQuery.length > 0 && useEnhancedSearch && (
                                            <Text style={styles.emptySubtitle}>
                                                {t('searchScreen.tryDifferentKeywords')}
                                            </Text>
                                        )}
                                    </View>
                                ) : (
                                    <FadeInView duration={300}>
                                        {useEnhancedSearch && searchQuery.length > 0 ? (
                                            <FlatList
                                                data={enhancedChants}
                                                renderItem={({ item }) => (
                                                    <EnhancedChantCard
                                                        chant={item}
                                                        onPress={() => playChant(item)}
                                                        showArtist={true}
                                                        showYear={true}
                                                        showRating={true}
                                                        showTags={true}
                                                        compact={true}
                                                        width={ITEM_WIDTH}
                                                        height={ITEM_WIDTH * 1.25}
                                                    />
                                                )}
                                                keyExtractor={item => item.id}
                                                numColumns={COLUMN_COUNT}
                                                columnWrapperStyle={{ gap: GAP, justifyContent: 'space-between' }}
                                                contentContainerStyle={{ gap: GAP, paddingBottom: 20 }}
                                                scrollEnabled={false}
                                            />
                                        ) : (
                                            <FlatList
                                                data={selectedCountry ? countryChants : chants}
                                                renderItem={renderChantItem}
                                                keyExtractor={item => item.id}
                                                numColumns={COLUMN_COUNT}
                                                columnWrapperStyle={{ gap: GAP, justifyContent: 'space-between' }}
                                                contentContainerStyle={{ gap: GAP }}
                                                scrollEnabled={false}
                                            />
                                        )}
                                    </FadeInView>
                                )}
                            </View>
                        )}
                    </>
                }
                contentContainerStyle={styles.scrollContent}
            />
        </AppBackground>
    );
};

const createStyles = (Colors: any, insets: any) => StyleSheet.create({
    scrollContent: {
        paddingBottom: 120,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        marginHorizontal: 16,
        marginBottom: 24,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    browseContainer: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },

    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    backButton: {
        marginRight: 16,
    },
    filterTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    resultsContainer: {
        paddingHorizontal: 16,
    },
    // Old horizontal row styles (now unused but keeping for reference)
    chantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    chantArtwork: {
        width: 48,
        height: 48,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderRadius: 4,
    },
    chantInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    chantTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
        marginBottom: 4,
    },
    chantSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    // New vertical card styles
    chantCard: {
        width: ITEM_WIDTH,
        backgroundColor: 'transparent',
        marginBottom: 8,
    },
    chantCardArtwork: {
        width: ITEM_WIDTH,
        height: ARTWORK_HEIGHT,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    playButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    countryCard: {
        width: ITEM_WIDTH,
        height: 100,
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
    countryCardGradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    supporterIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    countryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 6,
        paddingHorizontal: 4,
        paddingTop: 6,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 6,
    },
    countryFlagSmall: {
        fontSize: 16,
        marginTop: 2,
        marginLeft: 8,
        color: Colors.text,
    },
    countryFlagImage: {
        width: 20,
        height: 14,
        marginLeft: 8,
        borderRadius: 2,
        overflow: 'hidden',
    },
    countryEmojiIcon: {
        fontSize: 20,
        color: '#FFF',
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
    countryEmojiContainer: {
        // Deprecated but kept for type safety if needed
    },
    chantCardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
        lineHeight: 18,
    },
    chantCardSubtitle: {
        fontSize: 11,
        color: Colors.textSecondary,
        lineHeight: 14,
    },
    centerContent: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: Colors.textSecondary + '80',
        textAlign: 'center',
        marginHorizontal: 32,
    },
    // Enhanced search styles
    searchOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '30',
    },
    toggleButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    toggleButtonText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 6,
        fontWeight: '600',
    },
    toggleButtonTextActive: {
        color: '#FFF',
    },
    filterButton: {
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '30',
    },
    advancedFilters: {
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight || Colors.textSecondary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '20',
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    activeFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    activeFilterText: {
        fontSize: 13,
        color: Colors.primary,
        marginRight: 8,
        fontWeight: '600',
    },
    suggestionsContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '20',
    },
    suggestionSection: {
        marginBottom: 8,
    },
    suggestionTitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontWeight: '700',
    },
    suggestionChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '20',
    },
    suggestionChipText: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: '600',
    },
});
