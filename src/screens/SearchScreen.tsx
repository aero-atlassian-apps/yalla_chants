import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChantSearch, useCountries, useChantsByCountry } from '../hooks/useChants';
import { usePlayerStore } from '../store/playerStore';
import { Chant } from '../services/chantService';
import { useColors } from '../constants/Colors';
import { ShareButton } from '../components/ShareButton';
import { MosaicBackground } from '../components/MosaicBackground';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const SearchScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const Colors = useColors();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const { chants, loading, search } = useChantSearch();
    const { countries } = useCountries();
    const { chants: countryChants, loading: countryLoading } = useChantsByCountry(selectedCountry || undefined);
    const { setCurrentTrack, setIsPlaying, setQueue } = usePlayerStore();

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
                search(text);
            }, 300);
        }
    }, [search]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const playChant = useCallback((chant: Chant) => {
        setCurrentTrack({
            id: chant.id,
            title: chant.title,
            artist: chant.football_team || 'Unknown',
            artwork_url: countries.find(c => c.id === chant.country_id)?.flag_svg_url || '',
            audio_url: chant.audio_url,
            duration: chant.audio_duration,
        });
        const source = selectedCountry ? countryChants : chants;
        setQueue(
            source.map(c => {
                const cc = countries.find(ct => ct.id === c.country_id);
                return {
                    id: c.id,
                    title: c.title,
                    artist: c.football_team || 'Unknown',
                    artwork_url: cc?.flag_svg_url || '',
                    audio_url: c.audio_url,
                    duration: c.audio_duration,
                };
            })
        );
        setIsPlaying(true);
    }, [setCurrentTrack, setQueue, setIsPlaying, countries, selectedCountry, countryChants, chants]);

    const renderChantItem = ({ item }: { item: Chant }) => {
        const country = countries.find(c => c.id === item.country_id);

        return (
            <TouchableOpacity onPress={() => playChant(item)} style={styles.chantItem}>
                <View style={styles.chantLeft}>
                    <Text style={styles.flagEmoji}>{country?.flag_emoji || '🎵'}</Text>
                    <View style={styles.chantInfo}>
                        <Text style={styles.chantTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.chantSubtitle} numberOfLines={1}>
                            {item.football_team} • {country?.name}
                        </Text>
                    </View>
                </View>
                <View style={styles.chantRight}>
                    <Text style={styles.duration}>{Math.floor(item.audio_duration / 60)}:{(item.audio_duration % 60).toString().padStart(2, '0')}</Text>
                    <ShareButton chantId={item.id} chantTitle={item.title} size={20} color="#666" />
                    <Ionicons name="play-circle" size={32} color={Colors.primary} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderCountryFilter = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => setSelectedCountry(item.id === selectedCountry ? null : item.id)}
            style={[styles.countryChip, selectedCountry === item.id && styles.countryChipActive]}
        >
            <Text style={styles.countryEmoji}>{item.flag_emoji}</Text>
            <Text style={[styles.countryName, selectedCountry === item.id && styles.countryNameActive]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const styles = createStyles(Colors, insets);

    return (
        <MosaicBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Search</Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#b3b3b3" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search chants, teams, countries..."
                        placeholderTextColor="#666"
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
                            <Ionicons name="close-circle" size={20} color="#b3b3b3" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Country Filters */}
                <FlatList
                    data={countries}
                    renderItem={renderCountryFilter}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.countryFilters}
                    style={styles.countryFiltersContainer}
                />
            </View>

            {(selectedCountry ? countryLoading : loading) ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : searchQuery.length === 0 && !selectedCountry ? (
                <View style={styles.centerContent}>
                    <Ionicons name="search" size={80} color={Colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Search for Chants</Text>
                    <Text style={styles.emptySubtitle}>Find your favorite football chants</Text>
                </View>
            ) : (selectedCountry ? countryChants.length === 0 : chants.length === 0) ? (
                <View style={styles.centerContent}>
                    <Ionicons name="sad-outline" size={80} color={Colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySubtitle}>Try a different search term</Text>
                </View>
            ) : (
                <FlatList
                    data={selectedCountry ? countryChants : chants}
                    renderItem={renderChantItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </MosaicBackground>
    );
};

const createStyles = (Colors: any, insets: any) => StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: insets.top + 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
    },
    countryFiltersContainer: {
        marginHorizontal: -16,
    },
    countryFilters: {
        paddingHorizontal: 16,
    },
    countryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceHighlight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    countryChipActive: {
        backgroundColor: Colors.primary,
    },
    countryEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    countryName: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    countryNameActive: {
        color: Colors.black,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    chantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    chantLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flagEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    chantInfo: {
        flex: 1,
    },
    chantTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    chantSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    chantRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    duration: {
        fontSize: 12,
        color: '#666',
    },
});
