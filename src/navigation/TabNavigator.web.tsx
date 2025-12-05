import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/Colors';

// A simple component to simulate a tab bar on the web
export const TabNavigator = () => {
    const navigation = useNavigation();
    const Colors = useColors();

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: 50,
            backgroundColor: Colors.tabBar.background,
            borderBottomWidth: 1,
            borderBottomColor: Colors.black,
        },
        tab: {
            padding: 10,
        },
        tabText: {
            color: Colors.tabBar.active,
            fontSize: 16,
        },
    });

    // Mock navigation. In a real scenario, you'd have screens to navigate to.
    const navigateTo = (screenName: string) => {
        // Since we don't have the full screen setup for web in this context,
        // we'll just log the navigation action.
        console.log(`Navigating to ${screenName}`);
        // Example of how you would navigate:
        // navigation.navigate(screenName);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.tab} onPress={() => navigateTo('Home')}>
                <Text style={styles.tabText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => navigateTo('Search')}>
                <Text style={styles.tabText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => navigateTo('Library')}>
                <Text style={styles.tabText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => navigateTo('Playlists')}>
                <Text style={styles.tabText}>Playlists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => navigateTo('Profile')}>
                <Text style={styles.tabText}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TabNavigator;
