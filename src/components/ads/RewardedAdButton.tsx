import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adService } from '../../services/adService';

interface RewardedAdButtonProps {
    onReward: () => void;
    rewardText?: string;
    buttonText?: string;
}

import { useColors } from '../../constants/Colors';

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
    onReward,
    rewardText = 'Unlock Premium Features',
    buttonText = 'Watch Ad',
}) => {
    const [loading, setLoading] = useState(false);
    const Colors = useColors();
    const styles = createStyles(Colors);

    const handlePress = async () => {
        setLoading(true);

        await adService.showRewardedAd(
            () => {
                setLoading(false);
                onReward();
            },
            () => {
                setLoading(false);
                alert('Ad not available. Please try again later.');
            }
        );
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={Colors.text} />
            ) : (
                <>
                    <Ionicons name="play-circle" size={24} color={Colors.primary} />
                    <Text style={styles.rewardText}>{rewardText}</Text>
                    <Text style={styles.buttonText}>{buttonText}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        backgroundColor: Colors.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    rewardText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    buttonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});
