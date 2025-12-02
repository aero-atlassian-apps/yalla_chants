import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chant } from '../services/chantService';
import { getLocalizedTitle, getDisplayArtist, getLocalizedViralMoment } from '../utils/chantLocalization';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface EnhancedChantCardProps {
    chant: Chant;
    onPress: () => void;
    onPressRelated?: (c: Chant) => void;
    showArtist?: boolean;
    showYear?: boolean;
    showRating?: boolean;
    showTags?: boolean;
    showViralMoment?: boolean;
    showCulturalContext?: boolean;
    showHistoricalSignificance?: boolean;
    compact?: boolean;
    showRelated?: boolean;
    width?: number;
    height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH * 0.6; // Wider cards for immersive feel
const DEFAULT_CARD_HEIGHT = DEFAULT_CARD_WIDTH * 1.4; // Portrait aspect ratio

export const EnhancedChantCard: React.FC<EnhancedChantCardProps> = ({
    chant,
    onPress,
    onPressRelated,
    showArtist = true,
    showYear = true,
    showRating = true,
    showTags = true,
    showViralMoment = false,
    showCulturalContext = false,
    showHistoricalSignificance = false,
    compact = false,
    showRelated = false,
    width,
    height,
}) => {
    const Colors = useColors();
    const { t } = useTranslation();

    // Calculate dimensions
    const cardWidth = width || (compact ? DEFAULT_CARD_WIDTH * 0.8 : DEFAULT_CARD_WIDTH);
    const cardHeight = height || (width ? width * 1.4 : (compact ? DEFAULT_CARD_HEIGHT * 0.8 : DEFAULT_CARD_HEIGHT));

    const styles = useMemo(() => createStyles(Colors, cardWidth, cardHeight), [Colors, cardWidth, cardHeight]);

    const localizedTitle = getLocalizedTitle(chant);
    const displayArtist = getDisplayArtist(chant);
    const viralMoment = getLocalizedViralMoment(chant);
    const hasMultilingual = chant.title_arabic || chant.title_french;

    // Helper to get image source
    const getImageSource = () => {
        // In a real app, this would be chant.cover_url or similar
        // Fallback to a placeholder or a specific asset if available
        return require('../../assets/images/chant-placeholder.png');
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Ionicons key={i} name="star" size={12} color="#FFD700" />);
        }
        if (hasHalfStar) {
            stars.push(<Ionicons key="half" name="star-half" size={12} color="#FFD700" />);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={12} color="rgba(255, 215, 0, 0.3)" />);
        }
        return stars;
    };

    const renderBadges = () => {
        const badges = [];

        if (chant.is_verified) {
            badges.push(
                <View key="verified" style={[styles.badge, styles.verifiedBadge]}>
                    <Ionicons name="checkmark-circle" size={10} color="#FFF" />
                </View>
            );
        }

        if (chant.is_official) {
            badges.push(
                <View key="official" style={[styles.badge, styles.officialBadge]}>
                    <Ionicons name="trophy" size={10} color="#FFF" />
                </View>
            );
        }

        if (chant.is_traditional) {
            badges.push(
                <View key="traditional" style={[styles.badge, styles.traditionalBadge]}>
                    <Ionicons name="time" size={10} color="#FFF" />
                </View>
            );
        }

        return badges.length > 0 ? <View style={styles.badgesContainer}>{badges}</View> : null;
    };

    const renderTags = () => {
        if (!showTags || !chant.tags || chant.tags.length === 0) return null;

        const displayTags = chant.tags.slice(0, 2); // Limit to 2 tags for cleaner look

        return (
            <View style={styles.tagsContainer}>
                {displayTags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <ImageBackground
                source={getImageSource()}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.topRow}>
                        {renderBadges()}
                        {hasMultilingual && (
                            <View style={styles.languageBadge}>
                                <Ionicons name="language" size={12} color="#FFF" />
                            </View>
                        )}
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.mainInfo}>
                            <Text style={styles.title} numberOfLines={2}>{localizedTitle}</Text>

                            {showArtist && displayArtist && (
                                <View style={styles.artistContainer}>
                                    <Ionicons name="megaphone" size={14} color="rgba(255,255,255,0.9)" style={styles.megaphoneIcon} />
                                    <Text style={styles.artist} numberOfLines={1}>
                                        {displayArtist}
                                        {showYear && chant.year && ` • ${chant.year}`}
                                    </Text>
                                </View>
                            )}

                            {showRating && chant.average_rating && chant.rating_count && chant.rating_count > 0 && (
                                <View style={styles.ratingContainer}>
                                    <View style={styles.starsContainer}>
                                        {renderStars(chant.average_rating)}
                                    </View>
                                    <Text style={styles.ratingText}>
                                        ({chant.rating_count})
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.playButton} onPress={onPress}>
                            <Ionicons name="play" size={24} color={Colors.black} />
                        </TouchableOpacity>
                    </View>

                    {renderTags()}

                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );
};

const createStyles = (Colors: any, width: number, height: number) => StyleSheet.create({
    container: {
        width: width,
        height: height,
        borderRadius: 16,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        backgroundColor: Colors.surface, // Fallback
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    imageStyle: {
        borderRadius: 16,
    },
    gradientOverlay: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        justifyContent: 'flex-end',
        padding: 12,
    },
    topRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    verifiedBadge: {
        backgroundColor: '#4CAF50',
    },
    officialBadge: {
        backgroundColor: '#FF9800',
    },
    traditionalBadge: {
        backgroundColor: '#9C27B0',
    },
    languageBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    mainInfo: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    artistContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    megaphoneIcon: {
        marginRight: 6,
    },
    artist: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 4,
    },
    ratingText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary, // Gold/Primary color
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tagChip: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tagText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '600',
    },
});
