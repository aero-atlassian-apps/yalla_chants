import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Chant } from '../services/chantService';
import { useColors } from '../constants/Colors';
import { ShareButton } from './ShareButton';

interface VirtualizedChantListProps {
    chants: Chant[];
    countries: any[];
    onChantPress: (chant: Chant) => void;
    estimatedItemSize?: number;
}

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
                <TouchableOpacity
                    onPress={() => onChantPress(item)}
                    style={styles.chantItem}
                    activeOpacity={0.7}
                >
                    <View style={styles.chantLeft}>
                        <Text style={styles.flagEmoji}>{country?.flag_emoji || '🎵'}</Text>
                        <View style={styles.chantInfo}>
                            <Text style={styles.chantTitle} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={styles.chantSubtitle} numberOfLines={1}>
                                {item.football_team} • {country?.name}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.chantRight}>
                        <Text style={styles.duration}>
                            {Math.floor(item.audio_duration / 60)}:
                            {(item.audio_duration % 60).toString().padStart(2, '0')}
                        </Text>
                        <ShareButton chantId={item.id} chantTitle={item.title} size={20} color="#666" />
                        <Ionicons name="play-circle" size={32} color={Colors.primary} />
                    </View>
                </TouchableOpacity>
            );
        },
        [countries, onChantPress, styles, Colors]
    );

    const keyExtractor = useCallback((item: Chant) => item.id, []);

    return (
        <FlashList
            data={chants}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );
};

const createStyles = (Colors: any) =>
    StyleSheet.create({
        listContent: {
            paddingHorizontal: 16,
            paddingBottom: 100,
        },
        chantItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: Colors.surface,
            borderRadius: 12,
            marginBottom: 8,
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
            fontSize: 14,
            color: Colors.textSecondary,
        },
        chantRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        duration: {
            fontSize: 14,
            color: Colors.textSecondary,
            minWidth: 40,
            textAlign: 'right',
        },
    });
