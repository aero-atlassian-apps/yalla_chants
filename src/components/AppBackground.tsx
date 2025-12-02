import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../constants/Colors';

interface AppBackgroundProps {
    children: React.ReactNode;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ children }) => {
    const Colors = useColors();
    const styles = createStyles(Colors);

    return (
        <View style={styles.container}>
            {/* Base Layer: Deep Green Background */}
            <View style={styles.baseLayer} />

            {/* Middle Layer: Stadium Pattern (Subtle Texture) */}
            <ImageBackground
                source={require('../../assets/images/stadium-pattern.png')}
                style={styles.patternImage}
                resizeMode="repeat"
                imageStyle={{ opacity: 0.15 }}
            >
                {/* Top Layer: Premium Gradient Overlay */}
                <LinearGradient
                    colors={[
                        'rgba(10, 46, 31, 0.8)',  // Deep Green (Top)
                        'rgba(8, 31, 22, 0.9)',   // Darker Green (Middle)
                        '#000000'                 // Black (Bottom)
                    ]}
                    locations={[0, 0.6, 1]}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.content}>
                        {children}
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black, // Fallback
    },
    baseLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
    },
    patternImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
    },
});
