import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { usePlaylistStore } from '../store/playlistStore';
import { AppBackground } from '../components/AppBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';

export const CreatePlaylistScreen = () => {
    const Colors = useColors();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute();
    // @ts-ignore
    const editingPlaylist = route.params?.playlist;

    const { createPlaylist, updatePlaylist } = usePlaylistStore();

    const [name, setName] = useState(editingPlaylist?.name || '');
    const [description, setDescription] = useState(editingPlaylist?.description || '');
    const [isPublic, setIsPublic] = useState(editingPlaylist?.is_public || false);
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!editingPlaylist;
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('common.error'), t('playlists.namePlaceholder'));
            return;
        }

        setIsLoading(true);
        try {
            if (isEditing) {
                await updatePlaylist(editingPlaylist.id, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    is_public: isPublic,
                });
                Alert.alert(t('playlists.updateSuccess'));
            } else {
                await createPlaylist({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    is_public: isPublic,
                });
                Alert.alert(t('playlists.createSuccess'));
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppBackground>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title={isEditing ? t('playlists.edit') : t('playlists.create')}
                    subtitle="Customize your collection"
                    backgroundImage={require('../../assets/images/stadium_background.png')}
                />

                <FadeInView style={styles.content}>
                    {/* Name Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            {t('playlists.name')} *
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('playlists.namePlaceholder')}
                            placeholderTextColor={Colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                            maxLength={100}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.section}>
                        <Text style={styles.label}>
                            {t('playlists.description')}
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('playlists.descriptionPlaceholder')}
                            placeholderTextColor={Colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                        />
                    </View>

                    {/* Public/Private Toggle */}
                    <View style={styles.toggleSection}>
                        <View style={styles.toggleInfo}>
                            <View style={styles.toggleHeader}>
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                </View>
                                <Text style={styles.toggleLabel}>
                                    {isPublic ? t('playlists.public') : t('playlists.private')}
                                </Text>
                            </View>
                            <Text style={styles.toggleDescription}>
                                {isPublic
                                    ? 'Anyone with the link can view this playlist'
                                    : 'Only you can view this playlist'}
                            </Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={setIsPublic}
                            trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
                            thumbColor={Colors.white}
                        />
                    </View>

                    {/* Save Button */}
                    <AnimatedTouchable
                        style={[
                            styles.saveButton,
                            isLoading && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            </>
                        )}
                    </AnimatedTouchable>
                </FadeInView>
            </ScrollView>
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        color: Colors.text,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    toggleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        marginBottom: 32,
    },
    toggleInfo: {
        flex: 1,
        marginRight: 20,
    },
    toggleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    toggleDescription: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        paddingLeft: 44, // Align with text
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 30,
        gap: 12,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        opacity: 0.6,
        backgroundColor: Colors.surfaceLight,
        shadowOpacity: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
