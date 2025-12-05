import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { linking } from './LinkingConfiguration';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TabNavigator } from './TabNavigator';
import { Player } from '../components/Player';
import { View } from 'react-native';
import { useColors } from '../constants/Colors';
import { JamSessionScreen } from '../screens/JamSessionScreen';
import { PlaylistDetailScreen } from '../screens/PlaylistDetailScreen';
import { CreatePlaylistScreen } from '../screens/CreatePlaylistScreen';
import { Playlist } from '../types/playlist';
import { MosaicLoading } from '../components/MosaicLoading';
import { InviteFriendsScreen } from '../screens/InviteFriendsScreen';
import { useThemeStore } from '../store/themeStore';
import { useGuestStore } from '../store/guestStore';

export type RootStackParamList = {
    Main: undefined;
    Login: undefined;
    Register: undefined;
    JamSession: { sessionId: string };
    PlaylistDetail: { playlistId: string; title?: string };
    CreatePlaylist: { playlist?: Playlist };
    InviteFriends: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
    const { session, isGuest, loading, initialize } = useAuthStore();
    const { loadGuestState } = useGuestStore();
    const Colors = useColors();
    const { loadForUser } = useThemeStore();

    useEffect(() => {
        const initializeApp = async () => {
            // Load guest state first
            await loadGuestState();
            // Then initialize auth
            await initialize();
        };
        initializeApp();
    }, []);

    useEffect(() => {
        const userId = session?.user?.id;
        if (userId) {
            loadForUser(userId);
        }
    }, [session]);

    if (loading) {
        return <MosaicLoading />;
    }

    return (
        <NavigationContainer linking={linking}>
            <View style={{ flex: 1 }}>
                <Stack.Navigator
                    initialRouteName={session || isGuest ? 'Main' : 'Login'}
                    screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                    }}
                >
                    <Stack.Screen name="Main" component={TabNavigator} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
                    <Stack.Screen name="CreatePlaylist" component={CreatePlaylistScreen} />
                    <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
                    <Stack.Screen name="JamSession" component={JamSessionScreen} />
                </Stack.Navigator>
                <Player />
            </View>
        </NavigationContainer>
    );
};
