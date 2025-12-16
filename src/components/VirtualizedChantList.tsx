
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Chant } from '../services/chantService';
import { useColors } from '../constants/Colors';
import { ShareButton } from './ShareButton';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { BlurView } from 'expo-blur';

interface VirtualizedChantListProps {
    chants: Chant[];
    countries: any[];
    onChantPress: (chant: Chant) => void;
    estimatedItemSize?: number;
}

const ChantListItem = React.memo(({
    item,
    country,
    onPress,
    styles,
}: {
    item: Chant;
    country: any;
    onPress: (chant: Chant) => void;
    styles: any;
}) => {
    const localizedTitle = getLocalizedTitle(item);
    const displayArtist = getDisplayArtist(item);

    // Memoize the press handler to avoid creating a new function on every render if it's not needed,
    // although `onPress` passed from parent is already stable if implemented correctly.
    // However, we are passing `item` to it, so we need a lambda in the render or a curried function.
    // To keep it simple and memoized, we use a lambda but the component is memoized.
    const handlePress = useCallback(() => {
        onPress(item);
    }, [onPress, item]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.chantItemContainer}
            activeOpacity={0.8}
        >
            <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 100}
                tint="dark"
                style={styles.blurView}
            >
                <View style={styles.chantLeft}>
                    <Text style={styles.flagEmoji}>{country?.flag_emoji || '🎵'}</Text>
                    <View style={styles.chantInfo}>
                        <Text style={styles.chantTitle} numberOfLines={1}>
                            {localizedTitle}
                        </Text>
                        <Text style={styles.chantSubtitle} numberOfLines={1}>
                            {displayArtist && country?.name ? `${displayArtist} • ${country.name}` : displayArtist || country?.name || ''}
                        </Text>
                    </View>
                </View>
                <View style={styles.chantRight}>
                    <Text style={styles.duration}>
                        {Math.floor(item.audio_duration / 60)}:
                        {(item.audio_duration % 60).toString().padStart(2, '0')}
                    </Text>
                    <ShareButton chantId={item.id} chantTitle={localizedTitle} size={20} color="#ccc" />
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
                    </View>
                </View>
            </BlurView>
        </TouchableOpacity>
    );
});

export const VirtualizedChantList: React.FC<VirtualizedChantListProps> = ({
    chants,
    countries,
    onChantPress,
    estimatedItemSize = 80,
}) => {
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const renderItem = useCallback(
        ({ item }: { item: Chant }) => {
            const country = countries.find((c) => c.id === item.country_id);
            return (
                <ChantListItem
                    item={item}
                    country={country}
                    onPress={onChantPress}
                    styles={styles}
                />
            );
        },
        [countries, onChantPress, styles]
    );

    const keyExtractor = useCallback((item: Chant) => item.id, []);

    return (
        <FlashList
            data={chants}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={estimatedItemSize}
        />
    );
};

const createStyles = (Colors: any) =>
    StyleSheet.create({
        listContent: {
            paddingHorizontal: 16,
            paddingBottom: 100,
        },
        chantItemContainer: {
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        blurView: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
        },
        chantLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: 12,
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
            color: '#FFFFFF',
            marginBottom: 4,
        },
        chantSubtitle: {
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
        },
        chantRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        duration: {
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            minWidth: 35,
            textAlign: 'right',
        },
        playButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
