import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { jamService, JamSession, JamParticipant } from '../services/jamService';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '../components/FadeInView';

const { width } = Dimensions.get('window');

export const JamSessionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sessionId } = route.params as { sessionId: string };
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
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
            // We also need to fetch the session details initially if not passed fully
            // For now assuming subscription picks it up or we have it. 
            // Ideally we should fetch session here too.
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
        Alert.alert(
            'End Session',
            'Are you sure you want to end this session for everyone?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Session',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await jamService.endSession(sessionId, user.id);
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to end session');
                        }
                    }
                }
            ]
        );
    };

    const renderParticipant = ({ item }: { item: any }) => (
        <View style={styles.participantItem}>
            <View style={styles.avatarContainer}>
                {item.user?.avatar_url ? (
                    <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                            {item.user?.username?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                {item.is_host && (
                    <View style={styles.hostBadge}>
                        <Ionicons name="star" size={10} color={Colors.white} />
                    </View>
                )}
            </View>
            <Text style={styles.participantName} numberOfLines={1}>
                {item.user?.username || 'Unknown User'}
            </Text>
            <View style={styles.equalizerIcon}>
                <Ionicons name="stats-chart" size={16} color={Colors.primary} />
            </View>
        </View>
    );

    if (loading && !session) {
        return (
            <AppBackground>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </AppBackground>
        );
    }

    const isHost = session?.host_user_id === user?.id;

    return (
        <AppBackground>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-down" size={28} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>LIVE JAM</Text>
                        <Text style={styles.headerSubtitle}>{session?.title || 'Session'}</Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <FadeInView style={{ flex: 1 }}>
                    {/* Now Playing / Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.artworkContainer}>
                            <LinearGradient
                                colors={[Colors.surfaceLight, Colors.surface]}
                                style={styles.artwork}
                            >
                                <Ionicons name="musical-notes" size={80} color={Colors.textSecondary} />
                            </LinearGradient>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        </View>

                        <View style={styles.trackInfo}>
                            <Text style={styles.trackTitle}>Waiting for track...</Text>
                            <Text style={styles.trackArtist}>Host will start the chant</Text>
                        </View>

                        {/* Join Code Card */}
                        <View style={styles.codeCard}>
                            <Text style={styles.codeLabel}>JOIN CODE</Text>
                            <Text style={styles.codeValue}>{session?.join_code}</Text>
                            <Text style={styles.codeInstruction}>Share this code with friends</Text>
                        </View>
                    </View>

                    {/* Participants List */}
                    <View style={styles.participantsSection}>
                        <Text style={styles.sectionTitle}>Listening ({participants.length})</Text>
                        <FlatList
                            data={participants}
                            renderItem={renderParticipant}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </FadeInView>

                {/* Footer Controls */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    {isHost ? (
                        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
                            <Text style={styles.endButtonText}>End Session</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveSession}>
                            <Text style={styles.leaveButtonText}>Leave Session</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </AppBackground>
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
        height: 60,
    },
    backButton: {
        padding: 8,
    },
    moreButton: {
        padding: 8,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    artworkContainer: {
        width: width * 0.7,
        height: width * 0.7,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    liveBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.error,
    },
    liveText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    trackTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    trackArtist: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    codeCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    codeLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    codeValue: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 4,
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    codeInstruction: {
        fontSize: 12,
        color: Colors.textSecondary,
        opacity: 0.7,
    },
    participantsSection: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    hostBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: Colors.primary,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    participantName: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    equalizerIcon: {
        opacity: 0.8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: Colors.background, // Solid background for footer
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    endButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        paddingVertical: 16,
        borderRadius: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    endButtonText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '700',
    },
    leaveButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 16,
        borderRadius: 32,
        alignItems: 'center',
    },
    leaveButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
});
