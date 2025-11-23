import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sharingService } from '../services/sharingService';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
    chantId: string;
    chantTitle: string;
    artistName?: string;
    size?: number;
    color?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    chantId,
    chantTitle,
    artistName,
    size = 24,
    color = '#fff',
}) => {
    const { t } = useTranslation();
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (isSharing) return;

        try {
            setIsSharing(true);
            const content = sharingService.generateChantLink(chantId, chantTitle, artistName);
            const success = await sharingService.shareNative(content);

            if (success) {
                await sharingService.trackShare('chant', chantId,
                    sharingService.canUseWebShare() ? 'web-share' : 'native');

                // Show success feedback on web
                if (Platform.OS === 'web' && !sharingService.canUseWebShare()) {
                    Alert.alert(
                        t('share.copied', 'Link Copied!'),
                        t('share.copiedMessage', 'The link has been copied to your clipboard')
                    );
                }
            }
        } catch (error) {
            console.error('Share error:', error);
            if (Platform.OS === 'web') {
                Alert.alert(
                    t('share.error', 'Share Failed'),
                    t('share.errorMessage', 'Could not share this chant')
                );
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleShare}
            style={styles.button}
            disabled={isSharing}
        >
            <Ionicons
                name={isSharing ? "hourglass-outline" : "share-social-outline"}
                size={size}
                color={color}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
    },
});
