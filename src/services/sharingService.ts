import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

export interface ShareContent {
    title: string;
    message: string;
    url: string;
}

class SharingService {
    private baseUrl = 'https://yallachant.app'; // Update with your actual domain

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
                const Clipboard = (await import('@react-native-clipboard/clipboard')).default;
                Clipboard.setString(url);
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            throw error;
        }
    }

    // Handle incoming deep links
    async handleDeepLink(url: string): Promise<{ type: string; id?: string; code?: string } | null> {
        try {
            const parsed = Linking.parse(url);
            const { hostname, path, queryParams } = parsed;

            // Handle chant deep links: /chant/:id
            if (path?.startsWith('chant/')) {
                const id = path.replace('chant/', '');
                return { type: 'chant', id };
            }

            // Handle playlist deep links: /playlist/:id
            if (path?.startsWith('playlist/')) {
                const id = path.replace('playlist/', '');
                return { type: 'playlist', id };
            }

            // Handle invite deep links: /invite/:code
            if (path?.startsWith('invite/')) {
                const code = path.replace('invite/', '');
                return { type: 'invite', code };
            }

            // Handle referral parameters
            if (queryParams?.ref) {
                return { type: 'referral', code: queryParams.ref as string };
            }

            return null;
        } catch (error) {
            console.error('Error parsing deep link:', error);
            return null;
        }
    }

    // Track share analytics
    async trackShare(
        contentType: 'chant' | 'playlist' | 'invite',
        contentId: string,
        platform: string
    ): Promise<void> {
        try {
            // Log to analytics service (Mixpanel, Google Analytics, etc.)
            console.log('Share tracked:', { contentType, contentId, platform });

            // Could also update share_count in database
            // await supabase.from('chants').update({ share_count: ... })
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }

    // Track when a shared link is opened
    async trackLinkOpen(
        contentType: string,
        contentId: string,
        referralSource?: string
    ): Promise<void> {
        try {
            console.log('Link opened:', { contentType, contentId, referralSource });

            // Track in analytics
            // Track attribution for viral growth metrics
        } catch (error) {
            console.error('Error tracking link open:', error);
        }
    }
}

export const sharingService = new SharingService();
