
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from '../services/audioService';
import { chantService, Chant } from '../services/chantService';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import * as Haptics from 'expo-haptics';

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
    const { currentTrack, isPlaying, isMinimized, setIsMinimized, position, duration, playNext, playPrevious, isBuffering, shuffleEnabled, toggleShuffle, setRepeatMode, repeatMode } = usePlayerStore();
    const { user } = useAuthStore();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (currentTrack) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [currentTrack]);

    useEffect(() => {
        const checkLike = async () => {
            if (currentTrack && user) {
                const liked = await chantService.checkIsLiked(currentTrack.id, user.id);
                setIsLiked(liked);
            }
        };
        checkLike();
    }, [currentTrack, user]);

    const handleTogglePlay = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPlaying) {
            audioService.pause();
        } else {
            audioService.resume();
        }
    }, [isPlaying]);

    const handleLike = useCallback(async () => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }
        if (currentTrack) {
            const newStatus = await chantService.toggleLike(currentTrack.id, user.id);
            setIsLiked(newStatus);
        }
    }, [user, currentTrack, navigation]);

    const handleSlidingComplete = (value: number) => {
        audioService.seekTo(value);
        setIsSeeking(false);
    };

    const artworkSource = currentTrack?.artwork_url ? { uri: currentTrack.artwork_url } : require('../../assets/images/chant-placeholder.png');
    const currentPosition = isSeeking ? seekPosition : position;

    if (!currentTrack) return null;

    if (isMinimized) {
        return (
            <Animated.View style={[styles.minimizedContainer, { transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setIsMinimized(false)}>
                    <BlurView intensity={100} tint="dark" style={styles.minimizedBlur}>
                        <Image source={artworkSource} style={styles.minimizedArtwork} />
                        <View style={styles.minimizedTextContainer}>
                            <Text style={styles.minimizedTitle} numberOfLines={1}>{currentTrack.title}</Text>
                            <Text style={styles.minimizedArtist} numberOfLines={1}>{currentTrack.artist}</Text>
                        </View>
                        <TouchableOpacity onPress={handleTogglePlay} style={styles.minimizedButton}>
                            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => usePlayerStore.getState().clearCurrentTrack()} style={styles.minimizedButton}>
                            <Ionicons name="close" size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </BlurView>
                    <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.maximizedContainer, { transform: [{ translateY: slideAnim }] }]}>
            <Image source={artworkSource} style={styles.artworkBackground} blurRadius={30} />
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.maximizedHeader}>
                    <TouchableOpacity onPress={() => setIsMinimized(true)}>
                        <Ionicons name="chevron-down" size={32} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.maximizedContent}>
                    <Image source={artworkSource} style={styles.maximizedArtwork} />
                    <View style={styles.trackInfoContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.maximizedTitle}>{currentTrack.title}</Text>
                            <Text style={styles.maximizedArtist}>{currentTrack.artist}</Text>
                        </View>
                        <TouchableOpacity onPress={handleLike}>
                            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? Colors.primary : Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressContainer}>
                        <Slider
                            style={styles.slider}
                            value={currentPosition}
                            minimumValue={0}
                            maximumValue={duration}
                            onValueChange={(value) => {
                                setIsSeeking(true);
                                setSeekPosition(value);
                            }}
                            onSlidingComplete={handleSlidingComplete}
                            minimumTrackTintColor={Colors.primary}
                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                            thumbTintColor={Colors.white}
                        />
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                    </View>

                    <View style={styles.controlsContainer}>
                        <TouchableOpacity onPress={toggleShuffle}>
                            <Ionicons name="shuffle" size={28} color={shuffleEnabled ? Colors.primary : Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={playPrevious}>
                            <Ionicons name="play-skip-back" size={36} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleTogglePlay} style={styles.playPauseButton}>
                            {isBuffering ? <ActivityIndicator color={Colors.black} /> : <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color={Colors.black} style={{ marginLeft: isPlaying ? 0 : 3 }} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={playNext}>
                            <Ionicons name="play-skip-forward" size={36} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setRepeatMode(repeatMode === 'off' ? 'repeat-track' : 'off')}>
                            <Ionicons name={repeatMode === 'off' ? 'repeat' : 'repeat-outline'} size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    minimizedContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 80 : 60,
        left: 8,
        right: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    minimizedBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    minimizedArtwork: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    minimizedTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    minimizedTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    minimizedArtist: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    minimizedButton: {
        padding: 8,
    },
    progressBarBackground: {
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
    },
    maximizedContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    artworkBackground: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    maximizedHeader: {
        marginTop: Platform.OS === 'ios' ? 50 : 20,
        marginLeft: 20,
        alignSelf: 'flex-start',
    },
    maximizedContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    maximizedArtwork: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        borderRadius: 16,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    trackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    titleContainer: {
        flex: 1,
    },
    maximizedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    maximizedArtist: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    progressContainer: {
        width: '100%',
        marginBottom: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        marginTop: 20,
    },
    playPauseButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
