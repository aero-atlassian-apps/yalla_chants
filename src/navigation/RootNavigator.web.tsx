import React, { useEffect } from 'react'
import { View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/authStore'
import { Player } from '../components/Player'
import { MosaicLoading } from '../components/MosaicLoading'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { useThemeStore } from '../store/themeStore'
import TabNavigator from './TabNavigator'
import { InviteFriendsScreen } from '../screens/InviteFriendsScreen'

export const RootNavigator = () => {
  const { session, isGuest, loading, initialize } = useAuthStore()
  const { loadForUser } = useThemeStore()
  useEffect(() => { initialize() }, [])
  useEffect(() => { const id = session?.user?.id; if (id) loadForUser(id) }, [session])
  if (loading) return <MosaicLoading />

  const Stack = createNativeStackNavigator()
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          initialRouteName={(session || isGuest) ? 'Main' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
        </Stack.Navigator>
        <Player />
      </View>
    </NavigationContainer>
  )
}

export default RootNavigator;
