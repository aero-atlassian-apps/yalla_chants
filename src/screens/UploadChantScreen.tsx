import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { uploadService, UploadMetadata } from '../services/uploadService';
import { useAuthStore } from '../store/authStore';
import { useCountries } from '../hooks/useChants';

export const UploadChantScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { countries } = useCountries();

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
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#000']}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Chant</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* File Picker */}
                <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={handlePickFile}
                    disabled={uploading}
                >
                    <Ionicons
                        name={selectedFile ? 'musical-note' : 'add-circle-outline'}
                        size={48}
                        color={selectedFile ? '#1DB954' : '#666'}
                    />
                    <Text style={styles.filePickerText}>
                        {selectedFile ? selectedFile.name : 'Select Audio File'}
                    </Text>
                    {selectedFile && (
                        <Text style={styles.fileSize}>
                            {((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Title */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter chant title"
                        placeholderTextColor="#666"
                        value={title}
                        onChangeText={setTitle}
                        editable={!uploading}
                    />
                </View>

                {/* Description */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your chant (optional)"
                        placeholderTextColor="#666"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        editable={!uploading}
                    />
                </View>

                {/* Country */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Country</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                        <TouchableOpacity
                            style={[styles.countryChip, !selectedCountry && styles.countryChipActive]}
                            onPress={() => setSelectedCountry('')}
                            disabled={uploading}
                        >
                            <Text style={styles.countryName}>None</Text>
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

                {/* Football Team */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Football Team</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Raja Casablanca, Atlas Lions"
                        placeholderTextColor="#666"
                        value={footballTeam}
                        onChangeText={setFootballTeam}
                        editable={!uploading}
                    />
                </View>

                {/* Tags */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tags (comma separated)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., derby, ultras, celebration"
                        placeholderTextColor="#666"
                        value={tags}
                        onChangeText={setTags}
                        editable={!uploading}
                    />
                </View>

                {/* Language */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Language</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Arabic, French, English"
                        placeholderTextColor="#666"
                        value={language}
                        onChangeText={setLanguage}
                        editable={!uploading}
                    />
                </View>

                {/* Upload Progress */}
                {uploading && (
                    <View style={styles.progressContainer}>
                        <ActivityIndicator size="large" color="#1DB954" />
                        <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                        </View>
                    </View>
                )}

                {/* Upload Button */}
                <TouchableOpacity
                    style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={uploading || !selectedFile || !title.trim()}
                >
                    <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                    <Text style={styles.uploadButtonText}>
                        {uploading ? 'Uploading...' : 'Upload Chant'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    * Your chant will be reviewed before appearing publicly. Please ensure it follows community guidelines.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    filePickerButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    filePickerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    fileSize: {
        color: '#666',
        fontSize: 14,
        marginTop: 4,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    countryScroll: {
        marginTop: 8,
    },
    countryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    countryChipActive: {
        backgroundColor: '#1DB954',
        borderColor: '#1DB954',
    },
    countryEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    countryName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    countryNameActive: {
        color: '#000',
    },
    progressContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    progressText: {
        color: '#1DB954',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1DB954',
    },
    uploadButton: {
        backgroundColor: '#1DB954',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    uploadButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    uploadButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
    },
    disclaimer: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});
