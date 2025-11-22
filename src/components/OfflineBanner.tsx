import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../constants/Colors';

export const OfflineBanner = () => {
  const Colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: Colors.error }] }>
      <Text style={[styles.text, { color: Colors.white }]}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
