import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { jamService, JamSession } from '../services/jamService';
import { useAuthStore } from '../store/authStore';
import { MosaicBackground } from '../components/MosaicBackground';

export const JamLobbyScreen = ({ navigation }: any) => {
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
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
        } else {
            setIsCreating(true);
        }
    };

    const handleJoinSession = async (sessionId: string) => {
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
            setJoiningByCode(true);
            const session = await jamService.joinByCode(joinCode.trim(), user.id);
            navigation.navigate('JamSession', { sessionId: session.id });
            setJoinCode('');
        } catch (error: any) {
            Alert.alert('Invalid Code', error.message);
        } finally {
            setJoiningByCode(false);
        }
    };

    const renderSession = ({ item }: { item: JamSession }) => (
        <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => handleJoinSession(item.id)}
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
        <MosaicBackground>
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
        </MosaicBackground>
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
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinByCodeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    codeInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: 16,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    joinButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinButtonDisabled: {
        backgroundColor: Colors.textSecondary,
        opacity: 0.5,
    },
    joinButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    createInlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    createInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: 12,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    createInlineButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    cancelInlineButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    cancelText: {
        color: Colors.textSecondary,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sessionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    sessionDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    participantBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceHighlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    participantCount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.secondary,
    },
    sessionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    joinCode: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    nowPlaying: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nowPlayingText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
});
