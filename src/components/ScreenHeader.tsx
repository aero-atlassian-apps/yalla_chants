import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ImageSourcePropType, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../constants/Colors';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    backgroundImage?: ImageSourcePropType;
    style?: ViewStyle;
    rightAction?: React.ReactNode;
    leftAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    backgroundImage,
    style,
    rightAction,
    leftAction
}) => {
    const insets = useSafeAreaInsets();
    const Colors = useColors();

    const defaultImage = require('../../assets/images/stadium_background.png');

    return (
        <View style={[styles.container, style]}>
            <ImageBackground
                source={backgroundImage || defaultImage}
                style={styles.headerBackground}
                imageStyle={styles.headerBackgroundImage}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
                >
                    <View style={styles.headerRow}>
                        {leftAction && (
                            <View style={styles.leftActionContainer}>{leftAction}</View>
                        )}
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>{title}</Text>
                            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
                        </View>
                        {rightAction && (
                            <View style={styles.rightActionContainer}>
                                {rightAction}
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        // Removed card-like styling for better integration
    },
    headerBackground: {
        width: '100%',
        height: 120, // Reduced height for a cleaner look
        justifyContent: 'flex-end',
    },
    headerBackgroundImage: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Center alignment
    },
    leftActionContainer: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    rightActionContainer: {
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#d4a574', // Gold
        marginBottom: 2,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e6c488', // Muted Gold
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
