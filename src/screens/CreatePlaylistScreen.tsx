// src/screens/CreatePlaylistScreen.tsx
import React, { useState } from 'react';
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
import { MosaicBackground } from '../components/MosaicBackground';

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
        <MosaicBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Colors.text }]}>
                        {isEditing ? t('playlists.edit') : t('playlists.create')}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Name Input */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: Colors.text }]}>
                            {t('playlists.name')} *
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                { color: Colors.text, backgroundColor: Colors.surface, borderColor: Colors.border },
                            ]}
                            placeholder={t('playlists.namePlaceholder')}
                            placeholderTextColor={Colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                            maxLength={100}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: Colors.text }]}>
                            {t('playlists.description')}
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { color: Colors.text, backgroundColor: Colors.surface, borderColor: Colors.border },
                            ]}
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
                    <View style={[styles.section, styles.toggleSection]}>
                        <View style={styles.toggleInfo}>
                            <View style={styles.toggleHeader}>
                                <Ionicons
                                    name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                                    size={20}
                                    color={Colors.text}
                                />
                                <Text style={[styles.toggleLabel, { color: Colors.text }]}>
                                    {isPublic ? t('playlists.public') : t('playlists.private')}
                                </Text>
                            </View>
                            <Text style={[styles.toggleDescription, { color: Colors.textSecondary }]}>
                                {isPublic
                                    ? 'Anyone with the link can view this playlist'
                                    : 'Only you can view this playlist'}
                            </Text>
                        </View>
                        <Switch
                            value={isPublic}
                            onValueChange={setIsPublic}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: Colors.primary },
                            isLoading && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </MosaicBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        paddingTop: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleInfo: {
        flex: 1,
        marginRight: 20,
    },
    toggleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    toggleLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    toggleDescription: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 30,
        marginTop: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
