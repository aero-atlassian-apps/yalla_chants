import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export interface UploadMetadata {
    title: string;
    description?: string;
    country_id?: string;
    football_team?: string;
    tags?: string[];
    language?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

class UploadService {
    // Pick audio file from device
    async pickAudioFile(): Promise<DocumentPicker.DocumentPickerAsset | null> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return null;
            }

            const file = result.assets[0];

            // Validate file size (max 50MB)
            if (file.size && file.size > 50 * 1024 * 1024) {
                throw new Error('File size must be less than 50MB');
            }

            // Validate file type
            const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'];
            if (file.mimeType && !validTypes.includes(file.mimeType)) {
                throw new Error('Invalid file type. Please select an MP3, WAV, or M4A file');
            }

            return file;
        } catch (error: any) {
            console.error('Error picking audio file:', error);
            throw error;
        }
    }

    // Upload file to Supabase Storage
    async uploadToStorage(
        file: DocumentPicker.DocumentPickerAsset,
        userId: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop() || 'mp3';
            const filename = `${userId}/${timestamp}.${extension}`;

            // For React Native, we'll use the FormData approach
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'audio/mpeg',
            } as any);

            // Upload to Supabase Storage using the REST API
            const { data, error } = await supabase.storage
                .from('user-uploads')
                .upload(filename, formData as any, {
                    contentType: file.mimeType || 'audio/mpeg',
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // Get audio duration from file
    async getAudioDuration(uri: string): Promise<number> {
        // This would use expo-av to load and get duration
        // For now, return estimated based on file size
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists && fileInfo.size) {
                // Rough estimate: 1MB = ~60 seconds at 128kbps
                return Math.floor((fileInfo.size / 1024 / 1024) * 60);
            }
            return 180; // Default 3 minutes
        } catch (error) {
            console.error('Error getting duration:', error);
            return 180;
        }
    }

    // Create upload record in database
    async createUpload(
        audioUrl: string,
        metadata: UploadMetadata,
        duration: number,
        fileSize: number,
        userId: string
    ): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('user_uploads')
                .insert([
                    {
                        user_id: userId,
                        title: metadata.title,
                        description: metadata.description,
                        audio_file_url: audioUrl,
                        audio_duration: duration,
                        audio_format: 'mp3',
                        audio_file_size: fileSize,
                        country_id: metadata.country_id,
                        football_team: metadata.football_team,
                        tags: metadata.tags || [],
                        language: metadata.language,
                        status: 'pending',
                    },
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error: any) {
            console.error('Error creating upload:', error);
            throw error;
        }
    }

    // Get user's uploads
    async getUserUploads(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('user_uploads')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error: any) {
            console.error('Error fetching user uploads:', error);
            throw error;
        }
    }

    // Get approved uploads
    async getApprovedUploads(limit: number = 50): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('user_uploads')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error: any) {
            console.error('Error fetching approved uploads:', error);
            throw error;
        }
    }

    // Delete upload
    async deleteUpload(uploadId: string, userId: string): Promise<void> {
        try {
            // First get the upload to find the file URL
            const { data: upload, error: fetchError } = await supabase
                .from('user_uploads')
                .select('audio_file_url, user_id')
                .eq('id', uploadId)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            if (upload.user_id !== userId) {
                throw new Error('Unauthorized');
            }

            // Extract filename from URL
            const filename = upload.audio_file_url.split('/').pop();
            const path = `${userId}/${filename}`;

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('user-uploads')
                .remove([path]);

            if (storageError) {
                console.error('Error deleting from storage:', storageError);
            }

            // Delete from database
            const { error: dbError } = await supabase
                .from('user_uploads')
                .delete()
                .eq('id', uploadId)
                .eq('user_id', userId);

            if (dbError) {
                throw dbError;
            }
        } catch (error: any) {
            console.error('Error deleting upload:', error);
            throw error;
        }
    }

    // Like/unlike upload
    async toggleLike(uploadId: string, userId: string): Promise<boolean> {
        try {
            // Check if already liked
            const { data: existing } = await supabase
                .from('user_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('upload_id', uploadId)
                .single();

            if (existing) {
                // Unlike
                await supabase
                    .from('user_likes')
                    .delete()
                    .eq('id', existing.id);
                return false;
            } else {
                // Like
                await supabase
                    .from('user_likes')
                    .insert([{ user_id: userId, upload_id: uploadId }]);
                return true;
            }
        } catch (error: any) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }
}

export const uploadService = new UploadService();
