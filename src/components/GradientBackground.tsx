import React from 'react';
import { View, StyleSheet, ImageBackground, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../constants/Colors';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'mesh';
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style, variant = 'default' }) => {
    const Colors = useColors();
    // In a real app, we would use the generated asset. For now, we'll use a placeholder or the one we just generated.
    // Assuming the generated asset will be placed in assets/images/stadium_background.png
    // For this code, I will use a color gradient fallback if image is missing, but structure it for the image.

    // Note: You will need to move the generated image to assets/images/stadium_background.png
    // Select image based on variant
    const imageSource = variant === 'mesh'
        ? require('../../assets/images/stadium-pattern.png')
        : require('../../assets/images/stadium_background.png');

    return (
        <View style={[styles(Colors).container, style]}>
            <ImageBackground
                source={imageSource}
                style={styles(Colors).backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={[
                        'rgba(0, 42, 20, 0.85)', // Dark Green top
                        'rgba(0, 20, 10, 0.95)', // Darker bottom
                        '#000000' // Black at the very bottom
                    ]}
                    style={styles(Colors).gradient}
                >
                    {children}
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const styles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
    },
});

export default GradientBackground;
