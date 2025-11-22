import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { MosaicBackground } from '../components/MosaicBackground';
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
            <MosaicBackground>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </MosaicBackground>
        );
    }

    const isHost = session?.host_user_id === user?.id;

    return (
        <MosaicBackground>
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
        </MosaicBackground>
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
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    infoContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceHighlight,
    },
    codeLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    codeValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 4,
    },
    participantsContainer: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantName: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceHighlight,
        backgroundColor: Colors.background,
    },
    actionButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    leaveButton: {
        backgroundColor: Colors.surfaceHighlight,
        borderWidth: 1,
        borderColor: Colors.textSecondary,
    },
    endButton: {
        backgroundColor: '#D1100E',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },
});
