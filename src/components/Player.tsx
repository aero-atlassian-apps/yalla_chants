import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Animated, ScrollView, Platform, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from '../services/audioService';
import { chantService, Chant } from '../services/chantService';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { sharingService } from '../services/sharingService';
import { showInfoToast } from '../services/toastService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const formatTime = (millis: number) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

export const Player = () => {
    const Colors = useColors();
    const { t } = useTranslation();
    const { currentTrack, isPlaying, isMinimized, setIsMinimized, position, duration, playNext, playPrevious, isBuffering, shuffleEnabled, repeatMode, toggleShuffle, setRepeatMode } = usePlayerStore();
    const { user } = useAuthStore();
    const useSafeNavigation = () => {
        try {
            return useNavigation<NativeStackNavigationProp<RootStackParamList>>() as any;
        } catch {
            return { navigate: () => {} } as any;
        }
    };
    const navigation = useSafeNavigation();
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [chantDetails, setChantDetails] = useState<Chant | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);
    const styles = useMemo(() => createStyles(Colors), [Colors]);
    const [repeatHover, setRepeatHover] = useState(false);
    const [shuffleHover, setShuffleHover] = useState(false);
    const [prevHover, setPrevHover] = useState(false);
    const [nextHover, setNextHover] = useState(false);
    const [playHover, setPlayHover] = useState(false);
    const [lowEnd, setLowEnd] = useState(false);
    const [perfTier, setPerfTier] = useState<'low' | 'medium' | 'high'>('high');
    const [artworkError, setArtworkError] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        checkLikeStatus();
    }, [currentTrack, user]);

    useEffect(() => {
        if (currentTrack?.id) {
            loadChantDetails();
        }
    }, [currentTrack?.id]);

    const loadChantDetails = useCallback(async () => {
        if (!currentTrack?.id) return;
        try {
            const details = await chantService.getChantById(currentTrack.id);
            setChantDetails(details);
        } catch (error) {
            console.error('Error loading chant details:', error);
        }
    }, [currentTrack?.id]);

    useEffect(() => {
        if (currentTrack?.audio_url) {
            audioService.playTrack(currentTrack.audio_url, {
                title: currentTrack.title,
                artist: currentTrack.artist,
                artwork: currentTrack.artwork_url,
                id: currentTrack.id
            });
        }
        return () => { };
    }, [currentTrack?.id]);

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
        if (!currentTrack) return;
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        try {
            const newStatus = await chantService.toggleLike(currentTrack.id, user.id);
            setIsLiked(newStatus);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }, [currentTrack, user, navigation]);

    const shareCurrent = useCallback(async () => {
        if (!currentTrack) return;
        const content = sharingService.generateChantLink(currentTrack.id, currentTrack.title, currentTrack.artist);
        const ok = await sharingService.shareNative(content);
        if (ok) {
            await sharingService.trackShare('chant', currentTrack.id, Platform.OS);
        }
    }, [currentTrack]);

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

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        (async () => {
            try {
                let isLow = false;
                if (Platform.OS !== 'web') {
                    const totalMem = await Device.getMaxMemoryAsync();
                    if (typeof totalMem === 'number' && totalMem > 0) {
                        isLow = totalMem < 2 * 1024 * 1024 * 1024;
                    }
                    if (SCREEN_WIDTH <= 360) isLow = true;
                } else {
                    isLow = false;
                }
                setLowEnd(isLow);
            } catch {
                setLowEnd(Platform.OS === 'android' && SCREEN_WIDTH <= 360);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                let isLow = false;
                let tier: 'low' | 'medium' | 'high' = 'high';
                if (Platform.OS !== 'web') {
                    const totalMem = await Device.getMaxMemoryAsync();
                    if (typeof totalMem === 'number' && totalMem > 0) {
                        if (totalMem < 2 * 1024 * 1024 * 1024) { isLow = true; tier = 'low'; }
                        else if (totalMem < 3 * 1024 * 1024 * 1024) { tier = 'medium'; }
                        else { tier = 'high'; }
                    }
                    if (SCREEN_WIDTH <= 360) { isLow = true; tier = 'low'; }
                    const model = (Device.modelName || '').toLowerCase();
                    const mediumModels = [/galaxy\s*a10/, /galaxy\s*a20/, /moto\s*e/, /redmi\s*7/, /redmi\s*8/, /iphone\s*7/, /iphone\s*8/];
                    if (!isLow && mediumModels.some(r => r.test(model))) { tier = 'medium'; }
                } else {
                    isLow = false; tier = 'high';
                }
                setLowEnd(isLow);
                setPerfTier(tier);
            } catch {
                const fallbackLow = Platform.OS === 'android' && SCREEN_WIDTH <= 360;
                setLowEnd(fallbackLow);
                setPerfTier(fallbackLow ? 'low' : 'high');
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const cached = await AsyncStorage.getItem('perf:fps');
                if (!cached) {
                    let frames = 0;
                    let start = Date.now();
                    let last = start;
                    const sample = () => {
                        frames++;
                        last = Date.now();
                        if (last - start < 2000) {
                            (global as any).requestAnimationFrame(sample);
                        }
                    };
                    (global as any).requestAnimationFrame(sample);
                    setTimeout(async () => {
                        const elapsed = Date.now() - start;
                        const fps = Math.round((frames / elapsed) * 1000);
                        await AsyncStorage.setItem('perf:fps', String(fps));
                        if (fps < 40 && perfTier !== 'low') setPerfTier('low');
                        else if (fps < 55 && perfTier === 'high') setPerfTier('medium');
                    }, 2100);
                } else {
                    const fpsNum = parseInt(cached, 10);
                    if (!Number.isNaN(fpsNum)) {
                        if (fpsNum < 40 && perfTier !== 'low') setPerfTier('low');
                        else if (fpsNum < 55 && perfTier === 'high') setPerfTier('medium');
                    }
                }
            } catch {}
        })();
    }, []);

    useEffect(() => {
        if (isPlaying && !lowEnd) {
            const amp = perfTier === 'high' ? 1.02 : perfTier === 'medium' ? 1.015 : 1.0;
            const dur = perfTier === 'high' ? 800 : perfTier === 'medium' ? 950 : 800;
             const ease = perfTier === 'high' ? Easing.out(Easing.quad) : perfTier === 'medium' ? Easing.out(Easing.cubic) : Easing.linear;
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: amp,
                        duration: dur,
                        easing: ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: dur,
                        easing: ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            pulseAnim.stopAnimation();
        }
    }, [isPlaying, pulseAnim, lowEnd, perfTier]);

    const artworkSource = (!artworkError && currentTrack?.artwork_url)
        ? { uri: currentTrack.artwork_url }
        : currentTrack?.flag_url
            ? { uri: currentTrack.flag_url }
            : require('../../assets/images/chant-placeholder.png');

    const isFlag = !currentTrack?.artwork_url && !!currentTrack?.flag_url;

    const togglePlay = useCallback(async () => {
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (isPlaying) {
            audioService.pause();
        } else {
            audioService.resume();
        }
    }, [isPlaying]);

    const closeMinimized = useCallback(async () => {
        try {
            await audioService.stop();
        } finally {
            usePlayerStore.getState().clearCurrentTrack();
        }
    }, []);

    const handleSlidingComplete = useCallback(async (value: number) => {
        await audioService.seekTo(value);
        setIsSeeking(false);
    }, []);

    const handleValueChange = useCallback((value: number) => {
        setIsSeeking(true);
        setSeekPosition(value);
    }, []);

    const currentPosition = isSeeking ? seekPosition : position;

    if (!currentTrack) return null;

    if (isMinimized) {
        return (
            <View style={styles.container}>
                <View style={styles.minimizedContainer}>
                    <LinearGradient
                        colors={[Colors.surfaceLight, Colors.tabBar.background]}
                        style={styles.minimizedContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity
                            style={styles.trackInfoRow}
                            onPress={() => setIsMinimized(false)}
                            activeOpacity={0.9}
                        >
                            <Image source={artworkSource} style={styles.minimizedArtwork} />
                            <View style={styles.minimizedTextContainer}>
                                <Text style={styles.minimizedTitle} numberOfLines={1}>{currentTrack.title}</Text>
                                <Text style={styles.minimizedArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleLike} style={styles.minimizedButton}>
                                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? Colors.primary : Colors.textSecondary} />
                            </TouchableOpacity>
                    <TouchableOpacity onPress={togglePlay} style={styles.minimizedButton}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeMinimized} style={styles.minimizedButton}>
                        <Ionicons name="close" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    {isBuffering && (
                        <ActivityIndicator size="small" color={Colors.goldMuted} style={{ marginLeft: 4 }} />
                    )}
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
                colors={[Colors.backgroundAlt, Colors.background]}
                style={styles.maximizedContent}
            >
                {/* Header */}
                <View style={styles.maximizedHeader}>
                    <TouchableOpacity onPress={() => setIsMinimized(true)} style={styles.headerButton}>
                        <Ionicons name="chevron-down" size={28} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('playerEnhanced.nowPlaying')}</Text>
                </View>

                {/* Artwork */}
                <Animated.View
                    style={[
                        styles.artworkContainer,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    {/* Size-adaptive wrapper to keep content above the fold */}
                    <View style={[styles.artworkWrapper, { width: Math.min(SCREEN_WIDTH - 64, 420), height: Math.min(SCREEN_WIDTH - 64, 420) }]}>
                        <Image
                            source={artworkSource}
                            style={[
                                styles.maximizedArtwork,
                                isFlag && { backgroundColor: 'transparent' }
                            ]}
                            resizeMode={isFlag ? 'contain' : 'cover'}
                            onError={() => setArtworkError(true)}
                        />
                        {artworkError && (
                            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="musical-notes" size={56} color={Colors.goldMuted} />
                            </View>
                        )}
                        {isBuffering && (
                            <View style={styles.bufferBadge}>
                                <ActivityIndicator size="small" color={Colors.goldMuted} />
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Track Info */}
                <View style={styles.trackInfoContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.maximizedTitle} numberOfLines={1}>{currentTrack.title}</Text>
                        <Text style={styles.maximizedArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                    </View>
                    <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? Colors.primary : Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {duration > 0 ? (
                        <Slider
                            style={styles.slider}
                            value={Math.min(Math.max(currentPosition, 0), Math.max(duration, 1))}
                            minimumValue={0}
                            maximumValue={Math.max(duration, 1)}
                            onSlidingComplete={handleSlidingComplete}
                            onValueChange={handleValueChange}
                            minimumTrackTintColor={Colors.goldBright}
                            maximumTrackTintColor={Colors.surfaceLight}
                            thumbTintColor={Colors.goldBright}
                        />
                    ) : (
                        <View style={{ height: 40, justifyContent: 'center' }}>
                            <View style={{ height: 2, backgroundColor: Colors.surfaceLight }} />
                            <Text style={[styles.timeText, { textAlign: 'center', marginTop: 8 }]}>Tap play to start</Text>
                        </View>
                    )}
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.secondaryControl} onPress={toggleShuffle}>
                        <View onPointerEnter={() => Platform.OS === 'web' && setShuffleHover(true)} onPointerLeave={() => Platform.OS === 'web' && setShuffleHover(false)} style={[shuffleHover && Platform.OS === 'web' ? { transform: [{ scale: 1.05 }] } : undefined, shuffleHover && Platform.OS === 'web' ? styles.webHoverShadow : undefined]}>
                            <Ionicons name="shuffle" size={24} color={shuffleEnabled ? Colors.primary : Colors.goldMuted} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={async () => { if (Platform.OS !== 'web') await Haptics.selectionAsync(); usePlayerStore.getState().playPrevious(); }} style={styles.mainControl}>
                        <View onPointerEnter={() => Platform.OS === 'web' && setPrevHover(true)} onPointerLeave={() => Platform.OS === 'web' && setPrevHover(false)} style={[prevHover ? { transform: [{ scale: 1.05 }] } : undefined, prevHover && Platform.OS === 'web' ? styles.webHoverShadow : undefined]}>
                            <Ionicons name="play-skip-back" size={32} color={Colors.text} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlay} style={[styles.playPauseButton, (Platform.OS === 'web' && playHover) ? { transform: [{ scale: 1.03 }] } : undefined, (Platform.OS === 'web' && playHover) ? styles.webHoverShadow : undefined]}>
                        {/* @ts-ignore web-only */}
                        <View onPointerEnter={() => Platform.OS === 'web' && setPlayHover(true)} onPointerLeave={() => Platform.OS === 'web' && setPlayHover(false)}>
                            {isPlaying && duration === 0 ? (
                                <ActivityIndicator size="small" color={Colors.black} />
                            ) : (
                                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={Colors.black} style={{ marginLeft: isPlaying ? 0 : 4 }} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={async () => { if (Platform.OS !== 'web') await Haptics.selectionAsync(); usePlayerStore.getState().playNext(); }} style={styles.mainControl}>
                        <View onPointerEnter={() => Platform.OS === 'web' && setNextHover(true)} onPointerLeave={() => Platform.OS === 'web' && setNextHover(false)} style={[nextHover ? { transform: [{ scale: 1.05 }] } : undefined, nextHover && Platform.OS === 'web' ? styles.webHoverShadow : undefined]}>
                            <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryControl} onPress={() => {
                        const next = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
                        setRepeatMode(next);
                        if (Platform.OS !== 'web' && next === 'one') {
                            showInfoToast('Repeat One');
                        }
                    }}>
                        <View style={{ position: 'relative' }} onPointerEnter={() => Platform.OS === 'web' && setRepeatHover(true)} onPointerLeave={() => Platform.OS === 'web' && setRepeatHover(false)}>
                            <Ionicons name="repeat" size={24} color={repeatMode !== 'off' ? Colors.primary : Colors.goldMuted} />
                            {repeatMode === 'one' && (
                                <View style={styles.repeatOneBadge}>
                                    <Text style={styles.repeatOneText}>1</Text>
                                </View>
                            )}
                            {repeatHover && Platform.OS === 'web' && repeatMode === 'one' && (
                                <View style={styles.repeatTooltip}>
                                    <Text style={styles.repeatTooltipText}>Repeat One</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {chantDetails?.lyrics && (
                    <View style={styles.lyricsHeader}>
                        <TouchableOpacity style={styles.lyricsToggle} onPress={() => setShowLyrics(!showLyrics)}>
                            <Ionicons name={showLyrics ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.text} />
                            <Text style={styles.lyricsToggleText}>{showLyrics ? t('player.hideLyrics', 'Hide Lyrics') : t('player.showLyrics', 'Show Lyrics')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showLyrics && chantDetails?.lyrics && (
                    <View style={styles.lyricsContainer}>
                        <ScrollView style={styles.lyricsScroll} contentContainerStyle={{ paddingBottom: 8 }}>
                            <Text style={styles.lyricsText}>{chantDetails.lyrics}</Text>
                        </ScrollView>
                    </View>
                )}

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.bottomActionButton} onPress={shareCurrent}>
                        <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

            </LinearGradient>
        </Animated.View>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 80, // Above tab bar
        zIndex: 100,
    },
    minimizedContainer: {
        height: 70,
        marginHorizontal: 8,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.3)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }),
    },
    minimizedContent: {
        flex: 1,
        flexDirection: 'column',
    },
    trackInfoRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    minimizedArtwork: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: Colors.surface,
    },
    minimizedTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    minimizedTitle: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    minimizedArtist: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    minimizedButton: {
        padding: 8,
    },
    progressBarBackground: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.goldBright,
    },

    // Maximized Styles
    maximizedContainer: {
        top: 0,
        bottom: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: Colors.background,
    },
    maximizedContent: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 24,
    },
    maximizedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    artworkContainer: {
        alignItems: 'center',
        marginBottom: 40,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px 10px 20px rgba(0,0,0,0.5)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }),
        elevation: 15,
    },
    artworkWrapper: {
        width: SCREEN_WIDTH - 64,
        height: SCREEN_WIDTH - 64,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    maximizedArtwork: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    trackInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleContainer: {
        flex: 1,
        marginRight: 16,
    },
    maximizedTitle: {
        color: Colors.text,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    maximizedArtist: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    likeButton: {
        padding: 8,
    },
    progressContainer: {
        marginBottom: 32,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: -8,
    },
    timeText: {
        color: Colors.goldMuted,
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    mainControl: {
        padding: 12,
    },
    secondaryControl: {
        padding: 12,
    },
    playPauseButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.4)' }
            : { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }),
        elevation: 8,
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    bottomActionButton: {
        padding: 12,
    },
    webHoverShadow: Platform.OS === 'web'
        ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.25)' }
        : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    repeatOneBadge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 14,
        alignItems: 'center',
    },
    repeatOneText: {
        color: Colors.black,
        fontSize: 10,
        fontWeight: '700',
    },
    repeatTooltip: {
        position: 'absolute',
        top: 24,
        left: -12,
        backgroundColor: Colors.surface,
        borderColor: Colors.border || Colors.textSecondary + '20',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    repeatTooltipText: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
    },
    bufferOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    bufferText: {
        color: Colors.white,
        marginTop: 10,
        fontSize: 16,
    },
    bufferBadge: {
        position: 'absolute',
        right: 12,
        top: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 12,
        padding: 6,
    },
    lyricsHeader: {
        alignItems: 'center',
        marginBottom: 8,
    },
    lyricsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    lyricsToggleText: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: '700',
    },
    lyricsContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border || Colors.textSecondary + '20',
        padding: 12,
        marginHorizontal: 8,
        marginBottom: 16,
    },
    lyricsScroll: {
        maxHeight: 220,
    },
    lyricsText: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
});
