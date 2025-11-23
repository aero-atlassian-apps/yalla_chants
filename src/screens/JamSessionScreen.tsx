import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import GradientBackground from '../components/GradientBackground';
import { jamService, JamSession, JamParticipant } from '../services/jamService';
import { useAuthStore } from '../store/authStore';

export const JamSessionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sessionId } = route.params as { sessionId: string };
    const Colors = useColors();
    const styles = createStyles(Colors);
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [session, setSession] = useState<JamSession | null>(null);
    const [participants, setParticipants] = useState<JamParticipant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId || !user) return;

        loadSessionDetails();

        // Subscribe to real-time updates
        jamService.subscribeToSession(
            sessionId,
            (updatedSession) => {
                setSession(updatedSession);
                if (updatedSession.status === 'ended') {
                    Alert.alert('Session Ended', 'The host has ended the session.');
                    navigation.goBack();
                }
            },
            (updatedParticipants) => {
                setParticipants(updatedParticipants);
            }
        );

        return () => {
            jamService.unsubscribeFromSession(sessionId);
        };
    }, [sessionId, user]);

    const loadSessionDetails = async () => {
        try {
            setLoading(true);
            const parts = await jamService.getParticipants(sessionId);
            setParticipants(parts);
        } catch (error) {
            console.error('Error loading session details:', error);
            Alert.alert('Error', 'Failed to load session details');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSession = async () => {
        if (!user || !sessionId) return;
        try {
            await jamService.leaveSession(sessionId, user.id);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to leave session');
        }
    };

    const handleEndSession = async () => {
        if (!user || !sessionId) return;
        try {
            await jamService.endSession(sessionId, user.id);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to end session');
        }
    };

    const renderParticipant = ({ item }: { item: any }) => (
        <View style={styles.participantItem}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.participantName}>{item.user?.username || 'Unknown User'}</Text>
            {item.is_host && <Ionicons name="star" size={16} color={Colors.primary} style={{ marginLeft: 8 }} />}
        </View>
    );

    if (loading && !session) {
        return (
            <GradientBackground>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </GradientBackground>
        );
    }

    const isHost = session?.host_user_id === user?.id;

    return (
        <GradientBackground>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{session?.title || 'Jam Session'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Session Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.codeLabel}>Join Code:</Text>
                    <Text style={styles.codeValue}>{session?.join_code}</Text>
                </View>

                {/* Participants */}
                <View style={styles.participantsContainer}>
                    <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
                    <FlatList
                        data={participants}
                        renderItem={renderParticipant}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                </View>

                {/* Controls */}
                <View style={styles.footer}>
                    {isHost ? (
                        <TouchableOpacity style={[styles.actionButton, styles.endButton]} onPress={handleEndSession}>
                            <Text style={styles.actionButtonText}>End Session</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.actionButton, styles.leaveButton]} onPress={handleLeaveSession}>
                            <Text style={styles.actionButtonText}>Leave Session</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </GradientBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    infoContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    codeLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeValue: {
        fontSize: 40,
        fontWeight: '800',
        color: Colors.secondary,
        letterSpacing: 6,
        textShadowColor: 'rgba(212, 175, 55, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    participantsContainer: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.secondary,
    },
    participantName: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    actionButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    leaveButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    endButton: {
        backgroundColor: Colors.error,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: 0.5,
    },
});
