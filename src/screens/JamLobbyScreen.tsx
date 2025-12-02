import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { JamSession, jamService } from '../services/jamService';
import { useAuthStore } from '../store/authStore';
import { GuestRestrictedView } from '../components/GuestRestrictedView';
import { AppBackground } from '../components/AppBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';

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
        setIsCreating(true);
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
        <AnimatedTouchable
            style={styles.sessionCard}
            onPress={() => handleJoinSessionFromList(item.id)}
        >
            <View style={styles.sessionIconContainer}>
                <Ionicons name="musical-notes" size={24} color={Colors.primary} />
            </View>
            <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.sessionSubtitle} numberOfLines={1}>
                    Hosted by {item.host_user_id === user?.id ? 'You' : 'User'}
                </Text>
            </View>
            <View style={styles.participantBadge}>
                <Ionicons name="people" size={14} color={Colors.textSecondary} />
                <Text style={styles.participantCount}>{item.participant_count}</Text>
            </View>
        </AnimatedTouchable>
    );

    return (
        <AppBackground>
            {isGuest ? (
                <GuestRestrictedView
                    icon="musical-notes"
                    title="Join the Jam!"
                    message="Sign in to create jam sessions, chat with friends, and listen together in real-time."
                />
            ) : (
                <FlatList
                    ListHeaderComponent={
                        <ScreenHeader
                            title="Jam Sessions"
                            subtitle="Join the chant live!"
                            backgroundImage={require('../../assets/images/jam_header.png')}
                        />
                    }
                    data={[]} // Empty, we'll use a custom content component
                    renderItem={null}
                    ListEmptyComponent={
                        <View style={styles.content}>
                            {/* Actions Container */}
                            <View style={styles.actionsContainer}>
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
                                        style={[styles.joinButton, (!joinCode.trim() || joiningByCode) && styles.buttonDisabled]}
                                        onPress={handleJoinByCode}
                                        disabled={!joinCode.trim() || joiningByCode}
                                    >
                                        {joiningByCode ? (
                                            <ActivityIndicator size="small" color={Colors.white} />
                                        ) : (
                                            <Text style={styles.buttonText}>Join</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Create Session Input (Inline) */}
                                {isCreating ? (
                                    <View style={styles.createInlineContainer}>
                                        <TextInput
                                            style={styles.createInput}
                                            placeholder="Session name"
                                            placeholderTextColor={Colors.textSecondary}
                                            value={newSessionName}
                                            onChangeText={setNewSessionName}
                                            autoFocus
                                        />
                                        <View style={styles.createButtons}>
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => { setIsCreating(false); setNewSessionName(''); }}
                                            >
                                                <Text style={styles.cancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.createConfirmButton, !newSessionName.trim() && styles.buttonDisabled]}
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
                                                <Text style={styles.buttonText}>Start</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.startJamButton}
                                        onPress={handleCreateSession}
                                    >
                                        <View style={styles.startJamIcon}>
                                            <Ionicons name="add" size={24} color={Colors.black} />
                                        </View>
                                        <Text style={styles.startJamText}>Start a new Jam</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.sectionTitle}>Active Sessions</Text>

                            {loading ? (
                                <View style={styles.centerContent}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                </View>
                            ) : loadError ? (
                                <View style={styles.centerContent}>
                                    <Ionicons name="warning-outline" size={48} color={Colors.textSecondary} />
                                    <Text style={styles.emptySubtitle}>{loadError}</Text>
                                    <TouchableOpacity onPress={loadSessions} style={styles.retryButton}>
                                        <Text style={styles.retryText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : sessions.length === 0 ? (
                                <View style={styles.centerContent}>
                                    <Ionicons name="musical-notes-outline" size={64} color={Colors.textSecondary} />
                                    <Text style={styles.emptyTitle}>No active jams</Text>
                                    <Text style={styles.emptySubtitle}>Start one and invite your friends!</Text>
                                </View>
                            ) : (
                                <FadeInView duration={400}>
                                    <FlatList
                                        data={sessions}
                                        renderItem={renderSession}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.listContent}
                                        showsVerticalScrollIndicator={false}
                                        refreshing={loading}
                                        onRefresh={loadSessions}
                                    />
                                </FadeInView>
                            )}
                        </View>
                    }
                    contentContainerStyle={styles.scrollContent}
                />
            )}
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    actionsContainer: {
        marginBottom: 32,
    },
    joinByCodeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    codeInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: 12,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    joinButton: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 8,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    startJamButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    startJamIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    startJamText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    createInlineContainer: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    createInput: {
        backgroundColor: Colors.background,
        borderRadius: 4,
        padding: 12,
        color: Colors.text,
        fontSize: 16,
        marginBottom: 12,
    },
    createButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    cancelText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    createConfirmButton: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    listContent: {
        paddingBottom: 100,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    sessionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 4,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    sessionSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    participantBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 12,
    },
    participantCount: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        padding: 12,
    },
    retryText: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
