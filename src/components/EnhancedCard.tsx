
import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, ViewStyle, ImageStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface EnhancedCardProps {
    imageSource?: ImageSourcePropType;
    imageUri?: string;
    children: React.ReactNode;
    style?: ViewStyle;
    imageStyle?: ImageStyle;
    showOverlay?: boolean;
    overlayGradient?: string[];
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
    imageSource,
    imageUri,
    children,
    style,
    imageStyle,
    showOverlay = false,
    overlayGradient,
}) => {
    const defaultGradient = [
        'rgba(0, 0, 0, 0)',
        'rgba(10, 46, 31, 0.9)', // Deep green overlay
    ];

    const source = imageUri ? { uri: imageUri } : imageSource;

    return (
        <View style={[styles.card, style]}>
            {source && (
                <Image
                    source={source}
                    style={[styles.image, imageStyle]}
                    resizeMode="cover"
                />
            )}
            <BlurView intensity={Platform.OS === 'ios' ? 80 : 120} style={styles.blurContainer}>
              <View style={styles.innerContainer}>
                {showOverlay && (
                    <LinearGradient
                        colors={overlayGradient || defaultGradient as any}
                        style={styles.overlay}
                    />
                )}
                <View style={styles.content}>
                    {children}
                </View>
              </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16, // Softer, more modern corners
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    blurContainer: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white for the glass effect
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        padding: 16,
        flex: 1,
    },
});
