import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { useColors } from '../constants/Colors';

interface MosaicBackgroundProps {
    children: React.ReactNode;
}

export const MosaicBackground: React.FC<MosaicBackgroundProps> = ({ children }) => {
    const Colors = useColors();
    const styles = createStyles(Colors);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/images/mosaic_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
                imageStyle={{ opacity: 0.3 }} // Increased opacity for better visibility
            >
                <View style={styles.content}>
                    {children}
                </View>
            </ImageBackground>
        </View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
    },
});
