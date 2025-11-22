import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from '../services/audioService';
import { chantService } from '../services/chantService';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../constants/Colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 70;
const TAB_BAR_HEIGHT = 80;

const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};



export const Player = () => {
    const Colors = useColors();
    const { currentTrack, isPlaying, isMinimized, setIsMinimized, position, duration } = usePlayerStore();
    const { user } = useAuthStore();
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        checkLikeStatus();
    }, [currentTrack, user]);

    useEffect(() => {
        if (currentTrack?.audio_url) {
            audioService.playTrack(currentTrack.audio_url);
        }

        // Cleanup: stop audio when component unmounts or track changes
        return () => {
            // Don't stop on track change, only on unmount
            // audioService will handle track transition
        };
    }, [currentTrack?.id]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            audioService.stop();
        };
    }, []);

    const checkLikeStatus = useCallback(async () => {
        if (currentTrack && user) {
            const liked = await chantService.checkIsLiked(currentTrack.id, user.id);
            setIsLiked(liked);
        } else {
            setIsLiked(false);
        }
    }, [currentTrack, user]);

    const toggleLike = useCallback(async () => {
        if (!currentTrack || !user) return;
        try {
            const newStatus = await chantService.toggleLike(currentTrack.id, user.id);
            setIsLiked(newStatus);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }, [currentTrack, user]);

    // Handle close button
    const handleClose = useCallback(async () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(async () => {
            await audioService.stop();
            usePlayerStore.getState().clearCurrentTrack();
        });
    }, [fadeAnim, slideAnim]);

    // Animate player in/out
    useEffect(() => {
        if (currentTrack) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [currentTrack, fadeAnim, slideAnim]);

    if (!currentTrack) return null;

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            audioService.pause();
        } else {
            audioService.resume();
        }
    }, [isPlaying]);

    const handleSlidingComplete = useCallback(async (value: number) => {
        await audioService.seekTo(value);
        setIsSeeking(false);
    }, []);

    const handleValueChange = useCallback((value: number) => {
        setIsSeeking(true);
        setSeekPosition(value);
    }, []);

    const currentPosition = isSeeking ? seekPosition : position;

    if (isMinimized) {
        return (
            <View style={styles.container}>
                <View style={styles.minimizedContainer}>
                    <LinearGradient
                        colors={[Colors.surfaceHighlight, Colors.tabBar]}
                        style={styles.minimizedContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity
                            style={styles.trackInfoRow}
                            onPress={() => setIsMinimized(false)}
                            activeOpacity={0.9}
                        >
                            <Image source={{ uri: currentTrack.artwork_url || 'https://via.placeholder.com/50' }} style={styles.minimizedArtwork} />
                            <View style={styles.minimizedTextContainer}>
                                <Text style={styles.minimizedTitle} numberOfLines={1}>{currentTrack.title}</Text>
                                <Text style={styles.minimizedArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleLike} style={styles.playButton}>
                                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? Colors.primary : Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.white} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
                                ]}
                            />
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.container,
                styles.maximizedContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }
            ]}
        >
            <LinearGradient
                colors={[Colors.surfaceHighlight, Colors.background]}
                style={styles.maximizedContent}
            >
                {isPlaying && duration === 0 && (
                    <View style={styles.bufferOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.bufferText}>Loading audio…</Text>
                    </View>
                )}
                <View style={styles.maximizedHeader}>
                    <TouchableOpacity onPress={() => setIsMinimized(true)}>
                        <Ionicons name="chevron-down" size={30} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Now Playing</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={28} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.artworkContainer}>
                    <Image source={{ uri: currentTrack.artwork_url || 'https://via.placeholder.com/300' }} style={styles.maximizedArtwork} />
                </View>

                <View style={styles.trackInfoContainer}>
                    <View>
                        <Text style={styles.maximizedTitle}>{currentTrack.title}</Text>
                        <Text style={styles.maximizedArtist}>{currentTrack.artist}</Text>
                    </View>
                    <TouchableOpacity onPress={toggleLike}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? Colors.primary : Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.progressContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={Math.max(duration, 1)}
                        value={Math.min(currentPosition, Math.max(duration, 1))}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.surfaceHighlight}
                        thumbTintColor={Colors.white}
                        onSlidingComplete={handleSlidingComplete}
                        onValueChange={handleValueChange}
                        disabled={duration === 0}
                    />
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity onPress={() => usePlayerStore.getState().playPrevious()}>
                        <Ionicons name="play-skip-back" size={35} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={togglePlay} style={styles.maximizedPlayButton}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={Colors.black} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => usePlayerStore.getState().playNext()}>
                        <Ionicons name="play-skip-forward" size={35} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + 10,
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 10,
    },
    minimizedContainer: {
        height: MINIMIZED_HEIGHT,
        marginHorizontal: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    minimizedContent: {
        flex: 1,
        padding: 8,
        justifyContent: 'center',
    },
    trackInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    minimizedArtwork: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: Colors.surfaceHighlight,
    },
    maximizedContainer: {
        top: 0,
        bottom: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: Colors.playerBackground,
    },
    maximizedContent: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    maximizedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    artworkContainer: {
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    maximizedArtwork: {
        width: SCREEN_WIDTH - 48,
        height: SCREEN_WIDTH - 48,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
    },
    trackInfoContainer: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    maximizedTitle: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    maximizedArtist: {
        color: Colors.primary,
        fontSize: 18,
    },
    progressContainer: {
        marginBottom: 40,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    timeText: {
        color: Colors.white,
        fontSize: 12,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    maximizedPlayButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bufferOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(74, 4, 4, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    bufferText: {
        marginTop: 12,
        color: Colors.white,
    },
    minimizedTextContainer: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 12,
    },
    minimizedTitle: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    minimizedArtist: {
        color: Colors.primary,
        fontSize: 12,
    },
    playButton: {
        padding: 8,
    },
    progressBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
});
