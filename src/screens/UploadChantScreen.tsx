import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { uploadService, UploadMetadata } from '../services/uploadService';
import { useAuthStore } from '../store/authStore';
import { useCountries } from '../hooks/useChants';
import { useColors } from '../constants/Colors';
import { AppBackground } from '../components/AppBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { FadeInView } from '../components/FadeInView';
import { AnimatedTouchable } from '../components/AnimatedTouchable';

export const UploadChantScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { countries } = useCountries();
    const Colors = useColors();
    const styles = useMemo(() => createStyles(Colors), [Colors]);

    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [footballTeam, setFootballTeam] = useState('');
    const [tags, setTags] = useState('');
    const [language, setLanguage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handlePickFile = async () => {
        try {
            const file = await uploadService.pickAudioFile();
            if (file) {
                setSelectedFile(file);
                // Auto-fill title from filename if empty
                if (!title) {
                    const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
                    setTitle(filename);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            Alert.alert('Error', 'Please select an audio file');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to upload');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(10);

            // Upload to storage
            const audioUrl = await uploadService.uploadToStorage(
                selectedFile,
                user.id,
                (progress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            setUploadProgress(80);

            // Get duration
            const duration = await uploadService.getAudioDuration(selectedFile.uri);

            // Create metadata
            const metadata: UploadMetadata = {
                title: title.trim(),
                description: description.trim() || undefined,
                country_id: selectedCountry || undefined,
                football_team: footballTeam.trim() || undefined,
                tags: tags.trim() ? tags.split(',').map(t => t.trim()) : undefined,
                language: language.trim() || undefined,
            };

            // Create upload record
            await uploadService.createUpload(
                audioUrl,
                metadata,
                duration,
                selectedFile.size || 0,
                user.id
            );

            setUploadProgress(100);

            Alert.alert(
                'Success!',
                'Your chant has been uploaded and is pending moderation. You will be notified once it\' approved.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );

            // Reset form
            setSelectedFile(null);
            setTitle('');
            setDescription('');
            setSelectedCountry('');
            setFootballTeam('');
            setTags('');
            setLanguage('');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <AppBackground>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <ScreenHeader
                    title="Upload Chant"
                    subtitle="Share your passion"
                    backgroundImage={require('../../assets/images/stadium_background.png')}
                />

                <FadeInView style={styles.content}>
                    {/* File Picker */}
                    <AnimatedTouchable
                        style={styles.filePickerButton}
                        onPress={handlePickFile}
                        disabled={uploading}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={selectedFile ? 'musical-note' : 'cloud-upload-outline'}
                                size={32}
                                color={selectedFile ? Colors.primary : Colors.textSecondary}
                            />
                        </View>
                        <View style={styles.fileInfo}>
                            <Text style={styles.filePickerText}>
                                {selectedFile ? selectedFile.name : 'Select Audio File'}
                            </Text>
                            {selectedFile ? (
                                <Text style={styles.fileSize}>
                                    {((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB
                                </Text>
                            ) : (
                                <Text style={styles.fileHint}>Tap to browse files</Text>
                            )}
                        </View>
                        {selectedFile && (
                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                        )}
                    </AnimatedTouchable>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter chant title"
                                placeholderTextColor={Colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                                editable={!uploading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe your chant (optional)"
                                placeholderTextColor={Colors.textSecondary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                editable={!uploading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Country</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                                <TouchableOpacity
                                    style={[styles.countryChip, !selectedCountry && styles.countryChipActive]}
                                    onPress={() => setSelectedCountry('')}
                                    disabled={uploading}
                                >
                                    <Text style={[styles.countryName, !selectedCountry && styles.countryNameActive]}>None</Text>
                                </TouchableOpacity>
                                {countries.map((country) => (
                                    <TouchableOpacity
                                        key={country.id}
                                        style={[styles.countryChip, selectedCountry === country.id && styles.countryChipActive]}
                                        onPress={() => setSelectedCountry(country.id)}
                                        disabled={uploading}
                                    >
                                        <Text style={styles.countryEmoji}>{country.flag_emoji}</Text>
                                        <Text style={[styles.countryName, selectedCountry === country.id && styles.countryNameActive]}>
                                            {country.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Football Team</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Raja Casablanca, Atlas Lions"
                                placeholderTextColor={Colors.textSecondary}
                                value={footballTeam}
                                onChangeText={setFootballTeam}
                                editable={!uploading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Tags (comma separated)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., derby, ultras, celebration"
                                placeholderTextColor={Colors.textSecondary}
                                value={tags}
                                onChangeText={setTags}
                                editable={!uploading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Language</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Arabic, French, English"
                                placeholderTextColor={Colors.textSecondary}
                                value={language}
                                onChangeText={setLanguage}
                                editable={!uploading}
                            />
                        </View>
                    </View>

                    {/* Upload Progress */}
                    {uploading && (
                        <View style={styles.progressContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                            </View>
                        </View>
                    )}

                    {/* Upload Button */}
                    <AnimatedTouchable
                        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                        onPress={handleUpload}
                        disabled={uploading || !selectedFile || !title.trim()}
                    >
                        <Ionicons name="cloud-upload" size={24} color={Colors.white} />
                        <Text style={styles.uploadButtonText}>
                            {uploading ? 'Uploading...' : 'Upload Chant'}
                        </Text>
                    </AnimatedTouchable>

                    <Text style={styles.disclaimer}>
                        * Your chant will be reviewed before appearing publicly. Please ensure it follows community guidelines.
                    </Text>

                    <View style={{ height: 100 }} />
                </FadeInView>
            </ScrollView>
        </AppBackground>
    );
};

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderStyle: 'dashed',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    fileInfo: {
        flex: 1,
    },
    filePickerText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    fileHint: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    fileSize: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    formSection: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 0,
    },
    label: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    countryScroll: {
        marginTop: 0,
    },
    countryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    countryChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    countryEmoji: {
        fontSize: 16,
        marginRight: 8,
    },
    countryName: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    countryNameActive: {
        color: Colors.white,
    },
    progressContainer: {
        alignItems: 'center',
        marginVertical: 24,
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    progressText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 3,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    uploadButton: {
        backgroundColor: Colors.primary,
        borderRadius: 30,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    uploadButtonDisabled: {
        backgroundColor: Colors.surfaceLight,
        shadowOpacity: 0,
    },
    uploadButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    disclaimer: {
        color: Colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
        paddingHorizontal: 16,
    },
});
