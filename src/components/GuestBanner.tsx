import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { useColors } from '../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useGuestStore } from '../store/guestStore'
import { CountrySelector } from './CountrySelector'
import { useChants } from '../hooks/useChants'

export const GuestBanner = () => {
  const { isGuest } = useAuthStore()
  const { selectedCountryId } = useGuestStore()
  const { countries } = useChants()
  const Colors = useColors()
  const navigation = useNavigation()
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  
  if (!isGuest) return null as any
  
  const selectedCountry = countries.find(c => c.id === selectedCountryId)
  const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginTop: 8 },
    banner: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border || 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    leftSection: { flex: 1 },
    text: { color: Colors.text, fontWeight: '600', marginBottom: 4 },
    countryButton: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    countryText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', marginRight: 4 },
    cta: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    ctaText: { color: '#FFF', fontWeight: '700', marginLeft: 8 }
  })
  const handleCountrySelect = async (countryId: string) => {
    await useGuestStore.getState().setGuestCountry(countryId)
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.banner}>
          <View style={styles.leftSection}>
            <Text style={styles.text}>You are browsing as guest</Text>
            {selectedCountry && (
              <TouchableOpacity 
                style={styles.countryButton} 
                onPress={() => setShowCountrySelector(true)}
              >
                <Text style={styles.countryText}>
                  {selectedCountry.flag_emoji} {selectedCountry.name}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.cta} onPress={() => (navigation as any).navigate('Login')}>
            <Ionicons name="log-in" size={16} color={'#FFF'} />
            <Text style={styles.ctaText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <CountrySelector
        visible={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onCountrySelect={handleCountrySelect}
      />
    </>
  )
}
