import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { useColors } from '../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

export const GuestBanner = () => {
  const { isGuest } = useAuthStore()
  const Colors = useColors()
  const navigation = useNavigation()
  if (!isGuest) return null as any
  const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginTop: 8 },
    banner: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border || 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    text: { color: Colors.text, fontWeight: '600' },
    cta: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    ctaText: { color: '#FFF', fontWeight: '700', marginLeft: 8 }
  })
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.text}>You are browsing as guest</Text>
        <TouchableOpacity style={styles.cta} onPress={() => (navigation as any).navigate('Profile')}>
          <Ionicons name="log-in" size={16} color={'#FFF'} />
          <Text style={styles.ctaText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
