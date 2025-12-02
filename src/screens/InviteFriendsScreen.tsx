import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { sharingService } from '../services/sharingService';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

export const InviteFriendsScreen = () => {
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const loadCode = async () => {
            if (!user) { setCode(''); return; }
            try {
                setLoading(true);
                const { data, error } = await supabase.rpc('get_or_create_invite_code');
                if (error) throw error;
                setCode(String(data || ''));
            } catch (e) {
                Alert.alert('Error', 'Failed to load invite code');
            } finally {
                setLoading(false);
            }
        };
        loadCode();
    }, [user]);

    const shareInvite = async () => {
        try {
            const content = sharingService.generateInviteLink(code || undefined);
            const success = await sharingService.shareNative(content);
            if (!success) {
                Alert.alert(t('share.error', 'Share Failed'), t('share.errorMessage', 'Could not share the invite'));
            }
        } catch (e) {
            Alert.alert('Error', 'Unable to share');
        }
    };

    return (
        <AppBackground>
            <View style={styles.container}>
                <View style={styles.navRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={Colors.text} />
                        <Text style={styles.backText}>{t('navigation.home', 'Home')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>{t('invite.title', 'Invite Friends')}</Text>
                <Text style={styles.subtitle}>{t('invite.subtitle', 'Share your invite code to bring friends to Yalla Chants')}</Text>
                <View style={styles.codeBox}>
                    <Text style={styles.codeText}>
                        {loading
                            ? t('common.loading', 'Loading...')
                            : (code
                                ? code
                                : t('invite.noCode', 'Sign in to generate your invite code'))}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                    {!user && (
                        <TouchableOpacity style={[styles.shareButton, { backgroundColor: Colors.primary }]} onPress={() => navigation.navigate('Login')}>
                            <Ionicons name="log-in-outline" size={20} color={Colors.black} />
                            <Text style={styles.shareText}>{t('invite.signIn', 'Sign In')}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
                        <Ionicons name="share-social-outline" size={20} color={Colors.black} />
                        <Text style={styles.shareText}>{t('invite.share', 'Share Invite')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    backText: {
        marginLeft: 6,
        color: '#d4a574',
        fontWeight: '700',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    codeBox: {
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '20',
        marginBottom: 16,
    },
    codeText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 1,
        textAlign: 'center',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.gold,
    },
    shareText: {
        marginLeft: 8,
        color: Colors.black,
        fontWeight: '700',
    },
});
