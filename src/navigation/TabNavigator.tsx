import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JamLobbyScreen } from '../screens/JamLobbyScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const Colors = useColors();
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.tabBar.background,
                    borderTopWidth: 0,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                    position: 'absolute', // Floating effect
                    elevation: 0,
                },
                tabBarActiveTintColor: Colors.tabBar.active, // White
                tabBarInactiveTintColor: Colors.tabBar.inactive,
                tabBarBackground: () => (
                    <View style={{ flex: 1, backgroundColor: Colors.tabBar.background }} /> // Ensure background is dark
                ),
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                    tabBarLabel: t('navigation.home')
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
                    tabBarLabel: t('navigation.search')
                }}
            />
            {/* Jam Tab - TEMPORARILY DISABLED (Feature incomplete)
                Requires: 
                - Database schema fixes (foreign key jam_participants -> user_profiles)
                - Duplicate join handling (upsert instead of insert)
                - Delete session functionality
                - Playback controls implementation
                - Real-time synchronization completion
                See: implementation_plan.md for full details
            <Tab.Screen
                name="Jam"
                component={JamLobbyScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
                    tabBarLabel: t('jam.title')
                }}
            />
            */}
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="library" size={size} color={color} />,
                    tabBarLabel: t('navigation.library')
                }}
            />
            <Tab.Screen
                name="Playlists"
                component={PlaylistsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
                    tabBarLabel: t('navigation.playlists')
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                    tabBarLabel: t('navigation.profile')
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;