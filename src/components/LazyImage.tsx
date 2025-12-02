import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useColors } from '../constants/Colors';

interface LazyImageProps extends ImageProps {
    uri?: string;
    placeholder?: string;
}

export const LazyImage = (props: LazyImageProps) => {
    const { uri, placeholder, style, contentFit = 'cover', transition = 200, onLoad, onError } = props;
    const Colors = useColors();

    return (
        <Image
            source={{ uri: uri || placeholder }}
            placeholder={{ uri: placeholder }}
            contentFit={contentFit}
            transition={transition}
            style={style}
            onLoad={onLoad}
            onError={onError}
            cachePolicy="memory-disk"
        />
    );
};
