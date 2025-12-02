import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedHeartProps {
    name: 'heart' | 'heart-outline';
    size: number;
    color: string;
    isLiked: boolean;
}

export const AnimatedHeart: React.FC<AnimatedHeartProps> = ({
    name,
    size,
    color,
    isLiked
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isLiked && name === 'heart') {
            // Pop animation when liked
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.3,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 20,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 20,
                }),
            ]).start();
        }
    }, [isLiked]);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
};
