import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AnimatedTouchableProps extends TouchableOpacityProps {
    scaleValue?: number;
    children: React.ReactNode;
}

export const AnimatedTouchable: React.FC<AnimatedTouchableProps> = ({
    scaleValue = 0.96,
    children,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (event: any) => {
        Animated.spring(scaleAnim, {
            toValue: scaleValue,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
        onPressIn?.(event);
    };

    const handlePressOut = (event: any) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
        onPressOut?.(event);
    };

    return (
        <TouchableOpacity
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};
