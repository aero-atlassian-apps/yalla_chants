import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TabNavigator } from './TabNavigator';
import { Player } from '../components/Player';
import { View, ActivityIndicator, ImageBackground } from 'react-native';
import { useColors } from '../constants/Colors';
import { JamSessionScreen } from '../screens/JamSessionScreen';

export type RootStackParamList = {
    Main: undefined;
    Login: undefined;
    Register: undefined;
    JamSession: { sessionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
    const { session, loading, initialize } = useAuthStore();
    const Colors = useColors();

    useEffect(() => {
        initialize();
    }, []);

    if (loading) {
        return (
            <ImageBackground
                source={require('../../assets/images/initial_welcome_loading_bg.png')}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                resizeMode="cover"
            >
                <ActivityIndicator size="large" color={Colors.primary} />
            </ImageBackground>
        );
    }

    return (
        <NavigationContainer>
            <View style={{ flex: 1 }}>
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                        animation: 'fade',
                    }}
                >
                    {session ? (
                        <Stack.Screen name="Main" component={TabNavigator} />
                    ) : (
                        <>
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="Register" component={RegisterScreen} />
                        </>
                    )}
                    <Stack.Screen name="JamSession" component={JamSessionScreen} />
                </Stack.Navigator>
                {session && <Player />}
            </View>
        </NavigationContainer>
    );
};
