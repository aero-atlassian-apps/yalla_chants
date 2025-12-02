import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../constants/Colors';

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
    const Colors = useColors();
    const defaultGradient = [
        'rgba(0, 0, 0, 0)',
        'rgba(10, 46, 31, 0.9)', // Deep green overlay
    ];

    const source = imageUri ? { uri: imageUri } : imageSource;

    return (
        <View style={[styles.card, style]}>
            {source && (
                <>
                    <Image
                        source={source}
                        style={[styles.image, imageStyle]}
                        resizeMode="cover"
                    />
                    {showOverlay && (
                        <LinearGradient
                            colors={overlayGradient || defaultGradient as any}
                            style={styles.overlay}
                        />
                    )}
                </>
            )}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 8, // Spotify uses sharper corners
        overflow: 'hidden',
        backgroundColor: '#1a4d3a', // Dark green surface (matches new palette)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        padding: 16,
    },
});
