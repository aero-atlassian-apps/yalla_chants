// src/services/sharingService.ts
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';
import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

// Static import to avoid Hermes issues
let Clipboard: any = null;
try {
    Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (error) {
    console.log('[SharingService] Clipboard not available on this platform');
}

export interface ShareContent {
    title: string;
    message: string;
    url: string;
}

class SharingService {
    private baseUrl = 'https://yallachant.vercel.app'; // Update with your actual domain

    // Generate deep link for a chant
    generateChantLink(chantId: string, title: string, artistName?: string): ShareContent {
        const url = `${this.baseUrl}/chant/${chantId}`;
        const artistText = artistName ? ` by ${artistName}` : '';

        return {
            title: `🎵 ${title}`,
            message: `Check out "${title}"${artistText} on Yalla Chant! 🔥⚽\n\nListen now:`,
            url,
        };
    }

    // Generate deep link for a playlist
    generatePlaylistLink(playlistId: string, title: string): ShareContent {
        const url = `${this.baseUrl}/playlist/${playlistId}`;

        return {
            title: `🎶 ${title}`,
            message: `Listen to my "${title}" playlist on Yalla Chant! 🎵`,
            url,
        };
    }

    // Generate app invite link
    generateInviteLink(referralCode?: string): ShareContent {
        const url = referralCode
            ? `${this.baseUrl}/invite/${referralCode}`
            : this.baseUrl;

        return {
            title: 'Join Yalla Chant! 🎵⚽',
            message: 'Experience authentic football chants from around the world! Download Yalla Chant now and join the celebration!',
            url,
        };
    }

    // Share using native share sheet or Web Share API
    async shareNative(content: ShareContent): Promise<boolean> {
        try {
            // Use Web Share API on web if available
            if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: content.title,
                    text: content.message,
                    url: content.url,
                });
                return true;
            }

            // Use React Native Share API on mobile
            if (Platform.OS !== 'web') {
                const result = await Share.share({
                    title: content.title,
                    message: Platform.OS === 'ios'
                        ? content.message
                        : `${content.message}\n\n${content.url}`,
                    url: Platform.OS === 'ios' ? content.url : undefined,
                });

                return result.action === Share.sharedAction;
            }

            // Fallback to clipboard on web if Web Share API not available
            await this.copyToClipboard(content.url);
            return true;
        } catch (error: any) {
            console.error('Error sharing:', error);
            // Fallback to clipboard
            try {
                await this.copyToClipboard(content.url);
                return true;
            } catch {
                return false;
            }
        }
    }

    // Check if Web Share API is available
    canUseWebShare(): boolean {
        return Platform.OS === 'web' && typeof navigator !== 'undefined' && !!navigator.share;
    }

    // Share to WhatsApp
    async shareToWhatsApp(content: ShareContent): Promise<void> {
        const message = encodeURIComponent(`${content.message}\n\n${content.url}`);

        if (Platform.OS === 'web') {
            // Web WhatsApp
            const whatsappUrl = `https://wa.me/?text=${message}`;
            window.open(whatsappUrl, '_blank');
        } else {
            // Native WhatsApp
            const whatsappUrl = `whatsapp://send?text=${message}`;
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
            } else {
                throw new Error('WhatsApp is not installed');
            }
        }
    }

    // Share to Facebook
    async shareToFacebook(content: ShareContent): Promise<void> {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`;

        if (Platform.OS === 'web') {
            window.open(facebookUrl, '_blank', 'width=600,height=400');
        } else {
            const canOpen = await Linking.canOpenURL(facebookUrl);
            if (canOpen) {
                await Linking.openURL(facebookUrl);
            } else {
                throw new Error('Cannot open Facebook');
            }
        }
    }

    // Share to Twitter/X
    async shareToTwitter(content: ShareContent): Promise<void> {
        const text = encodeURIComponent(content.message);
        const url = encodeURIComponent(content.url);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

        if (Platform.OS === 'web') {
            window.open(twitterUrl, '_blank', 'width=600,height=400');
        } else {
            const nativeTwitterUrl = `twitter://post?message=${text}&url=${url}`;
            const canOpen = await Linking.canOpenURL(nativeTwitterUrl);
            if (canOpen) {
                await Linking.openURL(nativeTwitterUrl);
            } else {
                await Linking.openURL(twitterUrl);
            }
        }
    }

    // Share to Instagram Stories (requires specific setup)
    async shareToInstagramStory(imageUri: string, stickerUri?: string): Promise<void> {
        if (Platform.OS === 'web') {
            throw new Error('Instagram Stories sharing is not available on web');
        }

        if (!await Sharing.isAvailableAsync()) {
            throw new Error('Sharing is not available on this device');
        }

        // Instagram sharing requires specific file format and permissions
        await Sharing.shareAsync(imageUri, {
            dialogTitle: 'Share to Instagram Story',
        });
    }

    // Copy link to clipboard
    async copyToClipboard(url: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
            } else {
                // Use static import instead of dynamic
                if (Clipboard) {
                    Clipboard.setString(url);
                } else {
                    throw new Error('Clipboard not available');
                }
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            throw error;
        }
    }

    // Handle incoming deep links
    async handleDeepLink(url: string): Promise<{ type: 'chant' | 'playlist' | 'invite'; id?: string; code?: string } | null> {
        try {
            const parsed = Linking.parse(url);
            const { hostname, path, queryParams } = parsed;

            // Handle different deep link formats
            if (path?.startsWith('/chant/')) {
                const chantId = path.split('/')[2];
                return { type: 'chant', id: chantId };
            }

            if (path?.startsWith('/playlist/')) {
                const playlistId = path.split('/')[2];
                return { type: 'playlist', id: playlistId };
            }

            if (path?.startsWith('/invite/')) {
                const referralCode = path.split('/')[2];
                return { type: 'invite', code: referralCode };
            }

            return null;
        } catch (error) {
            console.error('Error parsing deep link:', error);
            return null;
        }
    }

    // Track sharing events for analytics
    async trackShare(type: 'chant' | 'playlist' | 'invite', id: string, platform: string): Promise<void> {
        try {
            const u = useAuthStore.getState().user;
            if (type === 'invite') {
                return; // no server target to increment here (handled elsewhere)
            }
            await supabase.rpc('record_share_event', {
                p_target_type: type,
                p_target_id: id,
                p_user_id: u?.id || null,
                p_platform: platform,
            });
        } catch (e) {
            // swallow analytics errors
        }
    }

    // Track link opens for analytics
    async trackLinkOpen(type: 'chant' | 'playlist' | 'invite', id: string): Promise<void> {
        try {
            if (type === 'invite') {
                const u = useAuthStore.getState().user;
                await supabase.rpc('record_invite_event', {
                    p_code: id,
                    p_referrer: null,
                    p_visitor: u?.id || null,
                    p_url: Platform.OS === 'web' ? window.location.href : undefined,
                });
            }
        } catch (e) {
            // swallow errors
        }
    }
}

export const sharingService = new SharingService();
