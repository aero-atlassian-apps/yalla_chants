
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { EnhancedCard } from './EnhancedCard';
import { BlurView } from 'expo-blur';

interface EnhancedChantCardProps {
    chant: Chant;
    onPress: () => void;
    width?: number;
    height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH * 0.6;
const DEFAULT_CARD_HEIGHT = DEFAULT_CARD_WIDTH * 1.2;

export const EnhancedChantCard: React.FC<EnhancedChantCardProps> = ({ 
    chant, 
    onPress, 
    width, 
    height 
}) => {
    const Colors = useColors();
    const cardWidth = width || DEFAULT_CARD_WIDTH;
    const cardHeight = height || DEFAULT_CARD_HEIGHT;

    const styles = useMemo(() => createStyles(Colors, cardWidth, cardHeight), [Colors, cardWidth, cardHeight]);

    const localizedTitle = getLocalizedTitle(chant);
    const displayArtist = getDisplayArtist(chant);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <EnhancedCard
                imageUri={chant.artwork_url || '../../assets/images/chant-placeholder.png'}
                style={styles.card}
                showOverlay
                overlayGradient={['transparent', 'rgba(0,0,0,0.8)']}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.title} numberOfLines={2}>{localizedTitle}</Text>
                    {displayArtist && <Text style={styles.artist} numberOfLines={1}>{displayArtist}</Text>}
                </View>
                <View style={styles.playButtonContainer}>
                    <BlurView intensity={Platform.OS === 'ios' ? 80 : 120} style={styles.playButtonBlur}>
                        <View style={styles.playButton}>
                            <Ionicons name="play" size={24} color={Colors.white} />
                        </View>
                    </BlurView>
                </View>
            </EnhancedCard>
        </TouchableOpacity>
    );
};

const createStyles = (Colors: any, width: number, height: number) => StyleSheet.create({
    card: {
        width: width,
        height: height,
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    artist: {
        fontSize: 14,
        color: Colors.white,
        opacity: 0.8,
        marginTop: 4,
    },
    playButtonContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    playButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
