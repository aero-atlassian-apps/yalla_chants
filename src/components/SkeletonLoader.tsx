import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) => {
    const Colors = useColors();
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: Colors.surfaceLight,
                    opacity,
                },
                style,
            ]}
        />
    );
};

interface ChantCardSkeletonProps {
    count?: number;
}

export const ChantCardSkeleton: React.FC<ChantCardSkeletonProps> = ({ count = 3 }) => {
    const Colors = useColors();

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={[styles.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                    <SkeletonLoader width={64} height={64} borderRadius={12} />
                    <View style={styles.cardContent}>
                        <SkeletonLoader width="70%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                        <SkeletonLoader width="50%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                        <SkeletonLoader width="40%" height={12} borderRadius={6} />
                    </View>
                    <SkeletonLoader width={40} height={40} borderRadius={20} />
                </View>
            ))}
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
});
