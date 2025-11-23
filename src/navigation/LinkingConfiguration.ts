// src/navigation/LinkingConfiguration.ts
import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
    prefixes: [
        'yallachant://',
        'https://yallachant.app',
        'https://www.yallachant.app',
        Linking.createURL('/'),
    ],
    config: {
        screens: {
            Home: {
                path: '',
                screens: {
                    HomeTab: 'home',
                    SearchTab: 'search',
                    LibraryTab: 'library',
                    JamTab: 'jam',
                    ProfileTab: 'profile',
                },
            },
            ChantDetail: {
                path: 'chant/:id',
                parse: {
                    id: (id: string) => id,
                },
            },
            Playlist: {
                path: 'playlist/:id',
                parse: {
                    id: (id: string) => id,
                },
            },
            Invite: {
                path: 'invite/:code?',
                parse: {
                    code: (code: string) => code || '',
                },
            },
        },
    },
    async getInitialURL() {
        // Check if app was opened from a deep link
        const url = await Linking.getInitialURL();
        if (url != null) {
            return url;
        }

        // If not, check if there's a notification (for future push notifications)
        // const notification = await Notifications.getLastNotificationResponseAsync();
        // return notification?.notification.request.content.data.url;

        return null;
    },
    subscribe(listener) {
        // Listen to incoming links from deep linking
        const onReceiveURL = ({ url }: { url: string }) => {
            listener(url);
        };

        // Listen to expo push notifications (for future use)
        const subscription = Linking.addEventListener('url', onReceiveURL);

        return () => {
            subscription.remove();
        };
    },
};
