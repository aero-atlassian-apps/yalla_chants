import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { jamService, JamSession } from '../services/jamService';
import { useAuthStore } from '../store/authStore';
import GradientBackground from '../components/GradientBackground';

export const JamLobbyScreen = ({ navigation }: any) => {
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const insets = useSafeAreaInsets();
    const { user, isGuest } = useAuthStore();
    const [sessions, setSessions] = useState<JamSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [joiningByCode, setJoiningByCode] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const data = await jamService.getActiveSessions();
            setSessions(data);
        } catch (error: any) {
            console.error('Error loading sessions:', error);
            setLoadError(error?.message || 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreateSession = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a session');
            return;
        }

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Create Jam Session',
                'Enter a name for your session',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Create',
                        onPress: async (sessionName?: string) => {
                            if (!sessionName?.trim()) return;
                            try {
                                const session = await jamService.createSession(
                                    sessionName.trim(),
                                    '',
                                    true,
                                    user.id
                                );
                                navigation.navigate('JamSession', { sessionId: session.id });
                            } catch (error: any) {
                                Alert.alert('Error', error.message);
                            }
                        },
                    },
                ],
                'plain-text'
            );
        }
    };

    const handleJoinSessionFromList = async (sessionId: string) => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to join');
            return;
        }

        try {
            await jamService.joinSession(sessionId, user.id);
            navigation.navigate('JamSession', { sessionId });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleJoinByCode = async () => {
        if (!joinCode.trim() || !user) return;

        try {
            // `setJoiningByCode(true)` is replaced by `isLoading` from useJamStore
            const session = await jamService.joinByCode(joinCode.trim(), user.id);
            navigation.navigate('JamSession', { sessionId: session.id });
            setJoinCode('');
        } catch (error: any) {
            Alert.alert('Invalid Code', error.message);
        } finally {
            // `setJoiningByCode(false)` is replaced by `isLoading` from useJamStore
        }
    };

    const renderSession = ({ item }: { item: JamSession }) => (
        <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => handleJoinSessionFromList(item.id)}
        >
            <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{item.title}</Text>
                    {item.description && (
                        <Text style={styles.sessionDescription}>{item.description}</Text>
                    )}
                </View>
                <View style={styles.participantBadge}>
                    <Ionicons name="people" size={16} color={Colors.secondary} />
                    <Text style={styles.participantCount}>{item.participant_count}</Text>
                </View>
            </View>
            <View style={styles.sessionFooter}>
                <Text style={styles.joinCode}>Code: {item.join_code}</Text>
                {item.is_playing && (
                    <View style={styles.nowPlaying}>
                        <Ionicons name="musical-note" size={14} color={Colors.primary} />
                        <Text style={styles.nowPlayingText}>Now Playing</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <GradientBackground>
            {isGuest ? (
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.centerContainer}>
                        <Ionicons name="lock-closed" size={80} color={Colors.secondary} />
                        <Text style={styles.emptyTitleModal}>Guest Mode</Text>
                        <Text style={styles.emptySubtitleModal}>
                            Sign in to create and join Jam Sessions with friends!
                        </Text>
                        <TouchableOpacity
                            style={[styles.signInBtn, { backgroundColor: Colors.primary, marginTop: 24 }]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.signInBtnText}>Sign In / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Jam Sessions 🎵</Text>
                        <TouchableOpacity onPress={handleCreateSession} style={[styles.createButton, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="add" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    {isCreating && (
                        <View style={styles.createInlineContainer}>
                            <TextInput
                                style={styles.createInput}
                                placeholder="Session name"
                                placeholderTextColor={Colors.textSecondary}
                                value={newSessionName}
                                onChangeText={setNewSessionName}
                            />
                            <TouchableOpacity
                                style={[styles.createInlineButton, !newSessionName.trim() && styles.joinButtonDisabled]}
                                onPress={async () => {
                                    if (!user || !newSessionName.trim()) return;
                                    try {
                                        const session = await jamService.createSession(
                                            newSessionName.trim(),
                                            '',
                                            true,
                                            user.id
                                        );
                                        setIsCreating(false);
                                        setNewSessionName('');
                                        navigation.navigate('JamSession', { sessionId: session.id });
                                    } catch (error: any) {
                                        Alert.alert('Error', error.message);
                                    }
                                }}
                                disabled={!newSessionName.trim()}
                            >
                                <Text style={styles.joinButtonText}>Create</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelInlineButton} onPress={() => { setIsCreating(false); setNewSessionName(''); }}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Join by Code */}
                    <View style={styles.joinByCodeContainer}>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Enter join code"
                            placeholderTextColor={Colors.textSecondary}
                            value={joinCode}
                            onChangeText={(text) => setJoinCode(text.toUpperCase())}
                            autoCapitalize="characters"
                            maxLength={8}
                        />
                        <TouchableOpacity
                            style={[styles.joinButton, { backgroundColor: Colors.primary }, (!joinCode.trim() || joiningByCode) && styles.joinButtonDisabled]}
                            onPress={handleJoinByCode}
                            disabled={!joinCode.trim() || joiningByCode}
                        >
                            {joiningByCode ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.joinButtonText}>Join</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Active Sessions */}
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : loadError ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="warning" size={80} color={Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>Unable to load sessions</Text>
                            <Text style={styles.emptySubtitle}>{loadError}</Text>
                            <TouchableOpacity style={[styles.joinButton, { marginTop: 16, backgroundColor: Colors.primary }]} onPress={loadSessions}>
                                <Text style={styles.joinButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : sessions.length === 0 ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="musical-notes-outline" size={80} color={Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>No Active Sessions</Text>
                            <Text style={styles.emptySubtitle}>Create one to start jamming with friends!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={sessions}
                            renderItem={renderSession}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshing={loading}
                            onRefresh={loadSessions}
                        />
                    )}
                </View>
            )}
        </GradientBackground >
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    joinByCodeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    codeInput: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    joinButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    joinButtonDisabled: {
        backgroundColor: Colors.surfaceLight,
        opacity: 0.5,
    },
    joinButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    createInlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    createInput: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    createInlineButton: {
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    cancelInlineButton: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    cancelText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sessionCard: {
        backgroundColor: 'rgba(0, 77, 37, 0.8)', // Dark Green with opacity
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.secondary, // Gold border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    sessionDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    participantBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.2)', // Gold tint
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    participantCount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.secondary,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitleModal: { // Renamed to avoid conflict
        fontSize: 24,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitleModal: { // Renamed to avoid conflict
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        opacity: 0.8,
    },
    createButtonModal: { // Renamed to avoid conflict
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    joinCode: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 1,
    },
    nowPlaying: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nowPlayingText: {
        fontSize: 12,
        color: Colors.secondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
