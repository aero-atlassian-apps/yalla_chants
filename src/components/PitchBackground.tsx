import React from 'react';
import { View, StyleSheet, ImageBackground, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../constants/Colors';

interface PitchBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const PitchBackground: React.FC<PitchBackgroundProps> = ({ children, style }) => {
    const Colors = useColors();
    // Assuming the generated asset will be placed in assets/images/pitch_background.png
    const imageSource = require('../../assets/images/pitch_background.png');

    return (
        <View style={[styles(Colors).container, style]}>
            <ImageBackground
                source={imageSource}
                style={styles(Colors).backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={[
                        'rgba(0, 42, 20, 0.7)',
                        'rgba(0, 20, 10, 0.9)'
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

export default PitchBackground;
