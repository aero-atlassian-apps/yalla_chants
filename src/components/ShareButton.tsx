import React from 'react';
import { View, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sharingService } from '../services/sharingService';

interface ShareButtonProps {
    chantId: string;
    chantTitle: string;
    size?: number;
    color?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    chantId,
    chantTitle,
    size = 24,
    color = '#fff',
}) => {
    const handleShare = async () => {
        const content = sharingService.generateChantLink(chantId, chantTitle);
        await sharingService.shareNative(content);
        await sharingService.trackShare('chant', chantId, 'native');
    };

    return (
        <TouchableOpacity onPress={handleShare} style={styles.button}>
            <Ionicons name="share-social-outline" size={size} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
    },
});
