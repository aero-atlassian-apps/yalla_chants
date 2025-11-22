import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

export interface ShareContent {
    title: string;
    message: string;
    url: string;
}

class SharingService {
    private baseUrl = 'https://yallachants.com'; // Update with your actual domain

    // Generate deep link for a chant
    generateChantLink(chantId: string, title: string): ShareContent {
        const url = Linking.createURL(`chant/${chantId}`);

        return {
            title: `🎵 ${title}`,
            message: `Check out this amazing football chant on Yalla Chants! 🔥⚽`,
            url: `${this.baseUrl}/chant/${chantId}`,
        };
    }

    // Generate deep link for a playlist
    generatePlaylistLink(playlistId: string, title: string): ShareContent {
        const url = Linking.createURL(`playlist/${playlistId}`);

        return {
            title: `🎶 ${title}`,
            message: `Listen to my playlist on Yalla Chants! 🎵`,
            url: `${this.baseUrl}/playlist/${playlistId}`,
        };
    }

    // Generate app invite link
    generateInviteLink(referralCode?: string): ShareContent {
        const url = referralCode
            ? `${this.baseUrl}/invite/${referralCode}`
            : this.baseUrl;

        return {
            title: 'Join Yalla Chants! 🎵⚽',
            message: 'Experience authentic African football chants! Download Yalla Chants now and join the celebration!',
            url,
        };
    }

    // Share using native share sheet
    async shareNative(content: ShareContent): Promise<boolean> {
        try {
            const result = await Share.share({
                title: content.title,
                message: Platform.OS === 'ios'
                    ? content.message
                    : `${content.message}\n\n${content.url}`,
                url: Platform.OS === 'ios' ? content.url : undefined,
            });

            return result.action === Share.sharedAction;
        } catch (error: any) {
            console.error('Error sharing:', error);
            return false;
        }
    }

    // Share to WhatsApp
    async shareToWhatsApp(content: ShareContent): Promise<void> {
        const message = encodeURIComponent(`${content.message}\n\n${content.url}`);
        const whatsappUrl = `whatsapp://send?text=${message}`;

        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
            await Linking.openURL(whatsappUrl);
        } else {
            throw new Error('WhatsApp is not installed');
        }
    }

    // Share to Facebook
    async shareToFacebook(content: ShareContent): Promise<void> {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`;

        const canOpen = await Linking.canOpenURL(facebookUrl);
        if (canOpen) {
            await Linking.openURL(facebookUrl);
        } else {
            throw new Error('Cannot open Facebook');
        }
    }

    // Share to Twitter
    async shareToTwitter(content: ShareContent): Promise<void> {
        const text = encodeURIComponent(content.message);
        const url = encodeURIComponent(content.url);
        const twitterUrl = `twitter://post?message=${text}&url=${url}`;
        const webTwitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

        const canOpen = await Linking.canOpenURL(twitterUrl);
        if (canOpen) {
            await Linking.openURL(twitterUrl);
        } else {
            await Linking.openURL(webTwitterUrl);
        }
    }

    // Share to Instagram Stories (requires specific setup)
    async shareToInstagramStory(imageUri: string, stickerUri?: string): Promise<void> {
        if (!await Sharing.isAvailableAsync()) {
            throw new Error('Sharing is not available on this device');
        }

        // Instagram sharing requires specific file format and permissions
        // This is a simplified version
        await Sharing.shareAsync(imageUri, {
            dialogTitle: 'Share to Instagram Story',
        });
    }

    // Copy link to clipboard
    async copyToClipboard(url: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                await navigator.clipboard.writeText(url);
            } else {
                const Clipboard = (await import('@react-native-clipboard/clipboard')).default;
                Clipboard.setString(url);
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
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
}

export const sharingService = new SharingService();
