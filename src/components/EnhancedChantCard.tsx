
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chant, chantService } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { EnhancedCard } from './EnhancedCard';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../store/authStore';

interface EnhancedChantCardProps {
    chant: Chant;
    onPress: () => void;
    width?: number;
    height?: number;
    showArtist?: boolean;
    showYear?: boolean;
    showRating?: boolean;
    showTags?: boolean;
    showViralMoment?: boolean;
    compact?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH * 0.6;
const DEFAULT_CARD_HEIGHT = DEFAULT_CARD_WIDTH * 1.2;

export const EnhancedChantCard: React.FC<EnhancedChantCardProps> = ({ 
    chant, 
    onPress, 
    width, 
    height,
    showArtist = true,
    showYear = false,
    showRating = false,
    showTags = false,
    showViralMoment = false,
    compact = false
}) => {
    const Colors = useColors();
    const { user } = useAuthStore();
    const cardWidth = width || DEFAULT_CARD_WIDTH;
    const cardHeight = height || DEFAULT_CARD_HEIGHT;

    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const styles = useMemo(() => createStyles(Colors, cardWidth, cardHeight, compact), [Colors, cardWidth, cardHeight, compact]);

    const localizedTitle = getLocalizedTitle(chant);
    const displayArtist = getDisplayArtist(chant);

    useEffect(() => {
        if (user) {
            checkLikeStatus();
        } else {
            setIsLiked(false);
        }
    }, [user, chant.id]);

    const checkLikeStatus = async () => {
        if (!user) return;
        try {
            const status = await chantService.checkIsLiked(chant.id, user.id);
            setIsLiked(status);
        } catch (error) {
            console.error('Error checking like status:', error);
        }
    };

    const handleToggleLike = async () => {
        if (!user) {
            // TODO: Show login prompt? For now just ignore or maybe use a toast
            return;
        }
        if (likeLoading) return;

        // Optimistic update
        const previousState = isLiked;
        setIsLiked(!previousState);
        setLikeLoading(true);

        try {
            const newState = await chantService.toggleLike(chant.id, user.id);
            setIsLiked(newState);
        } catch (error) {
            // Revert on error
            setIsLiked(previousState);
            console.error('Error toggling like:', error);
        } finally {
            setLikeLoading(false);
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <EnhancedCard
                imageUri={chant.artwork_url || '../../assets/images/chant-placeholder.png'}
                style={styles.card}
                showOverlay
                overlayGradient={['transparent', 'rgba(0,0,0,0.8)']}
            >
                {/* Top Row: Like Button */}
                <View style={styles.topContainer}>
                    <TouchableOpacity
                        onPress={handleToggleLike}
                        style={styles.likeButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                         <BlurView intensity={Platform.OS === 'ios' ? 50 : 100} style={styles.iconBlur}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={compact ? 18 : 22}
                                color={isLiked ? Colors.error : Colors.white}
                            />
                        </BlurView>
                    </TouchableOpacity>

                    {/* Play Button (Top Right) */}
                    <View style={styles.playButtonContainer}>
                        <BlurView intensity={Platform.OS === 'ios' ? 80 : 120} style={styles.playButtonBlur}>
                            <View style={styles.playButton}>
                                <Ionicons name="play" size={compact ? 20 : 24} color={Colors.white} />
                            </View>
                        </BlurView>
                    </View>
                </View>

                {/* Bottom Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title} numberOfLines={2}>{localizedTitle}</Text>

                    {showArtist && displayArtist && (
                        <Text style={styles.artist} numberOfLines={1}>{displayArtist}</Text>
                    )}

                    {/* Metadata Row (Year, Rating) */}
                    {(showYear || showRating) && !compact && (
                        <View style={styles.metaRow}>
                            {showYear && chant.year && (
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaText}>{chant.year}</Text>
                                </View>
                            )}
                            {showRating && (chant.average_rating || 0) > 0 && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="star" size={10} color={Colors.gold} style={{marginRight: 2}} />
                                    <Text style={styles.metaText}>{chant.average_rating?.toFixed(1)}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </EnhancedCard>
        </TouchableOpacity>
    );
};

const createStyles = (Colors: any, width: number, height: number, compact: boolean) => StyleSheet.create({
    card: {
        width: width,
        height: height,
        marginRight: 16,
    },
    topContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    likeButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    playButtonContainer: {
        // Now positioned via flexbox in topContainer
    },
    iconBlur: {
        width: compact ? 32 : 36,
        height: compact ? 32 : 36,
        borderRadius: compact ? 16 : 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playButtonBlur: {
        width: compact ? 36 : 40,
        height: compact ? 36 : 40,
        borderRadius: compact ? 18 : 20,
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
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: compact ? 8 : 12,
    },
    title: {
        fontSize: compact ? 14 : 18,
        fontWeight: 'bold',
        color: Colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginBottom: 2,
    },
    artist: {
        fontSize: compact ? 11 : 14,
        color: Colors.white,
        opacity: 0.8,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    metaText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '600',
    }
});
