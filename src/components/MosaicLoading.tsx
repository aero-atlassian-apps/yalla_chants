import React from 'react';
import { View, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useColors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');
const TILE_SIZE = 60; // Size of each mosaic tile

export const MosaicLoading = () => {
    const Colors = useColors();

    // Calculate how many tiles we need to cover the screen
    const cols = Math.ceil(width / TILE_SIZE);
    const rows = Math.ceil(height / TILE_SIZE);
    const tiles = Array.from({ length: cols * rows });

    return (
        <View style={[styles.container, { backgroundColor: Colors.primaryDark }]}>
            <View style={styles.mosaicContainer}>
                {tiles.map((_, index) => (
                    <View key={index} style={styles.tileWrapper}>
                        <Image
                            source={require('../../assets/images/splash-icon.png')}
                            style={styles.tileImage}
                            resizeMode="cover"
                        />
                        <View style={[styles.overlay, { backgroundColor: Colors.primaryDark }]} />
                    </View>
                ))}
            </View>

            <View style={styles.centerContent}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/splash-icon.png')}
                        style={styles.mainLogo}
                        resizeMode="contain"
                    />
                </View>
                <ActivityIndicator size="large" color={Colors.secondary} style={styles.loader} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    mosaicContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.3, // Subtle background effect
    },
    tileWrapper: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        overflow: 'hidden',
    },
    tileImage: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.2,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    mainLogo: {
        width: 100,
        height: 100,
    },
    loader: {
        transform: [{ scale: 1.2 }],
    },
});
