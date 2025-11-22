import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { JamLobbyScreen } from '../screens/JamLobbyScreen';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const Colors = useColors();
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.tabBar,
                    borderTopWidth: 0,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                    tabBarLabel: 'Home'
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
                    tabBarLabel: 'Search'
                }}
            />
            <Tab.Screen
                name="Jam"
                component={JamLobbyScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
                    tabBarLabel: 'Jam'
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="library" size={size} color={color} />,
                    tabBarLabel: 'Library'
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                    tabBarLabel: 'Profile'
                }}
            />
        </Tab.Navigator>
    );
};
