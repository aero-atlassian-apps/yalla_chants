import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useColors } from '../constants/Colors';

interface LazyImageProps {
    uri: string;
    placeholder?: string;
    fallback?: string;
    onLoad?: () => void;
    onError?: () => void;
    style?: any;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    uri,
    placeholder = 'https://via.placeholder.com/300',
    fallback = 'https://via.placeholder.com/300',
    style,
    onLoad,
    onError,
}) => {
    const Colors = useColors();

    return (
        <Image
            source={{ uri: uri || placeholder }}
            placeholder={{ uri: placeholder }}
            contentFit="cover"
            transition={200}
            style={style}
            onLoad={onLoad}
            onError={onError}
            cachePolicy="memory-disk"
        />
    );
};
