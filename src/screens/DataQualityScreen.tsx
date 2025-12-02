import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { useColors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

interface Metrics {
  total?: number;
  missing_audio_duration?: number;
  missing_team?: number;
  missing_tournament?: number;
  missing_year?: number;
  missing_artist?: number;
  missing_language?: number;
  missing_region?: number;
  missing_title_arabic?: number;
  missing_title_french?: number;
  missing_lyrics?: number;
  missing_tags?: number;
}

export const DataQualityScreen = () => {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);

  const count = async (filter: { col: string; op: 'is'; val: 'null' } | null): Promise<number> => {
    try {
      let q = supabase.from('chants').select('id', { count: 'exact', head: true });
      if (filter) {
        q = q[filter.op](filter.col as any, filter.val as any) as any;
      }
      const { count } = await q;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        count(null),
        count({ col: 'audio_duration', op: 'is', val: 'null' }),
        count({ col: 'football_team', op: 'is', val: 'null' }),
        count({ col: 'tournament', op: 'is', val: 'null' }),
        count({ col: 'year', op: 'is', val: 'null' }),
        count({ col: 'artist', op: 'is', val: 'null' }),
        count({ col: 'language', op: 'is', val: 'null' }),
        count({ col: 'region', op: 'is', val: 'null' }),
        count({ col: 'title_arabic', op: 'is', val: 'null' }),
        count({ col: 'title_french', op: 'is', val: 'null' }),
        count({ col: 'lyrics', op: 'is', val: 'null' }),
        count({ col: 'tags', op: 'is', val: 'null' }),
      ]);
      setMetrics({
        total: results[0],
        missing_audio_duration: results[1],
        missing_team: results[2],
        missing_tournament: results[3],
        missing_year: results[4],
        missing_artist: results[5],
        missing_language: results[6],
        missing_region: results[7],
        missing_title_arabic: results[8],
        missing_title_french: results[9],
        missing_lyrics: results[10],
        missing_tags: results[11],
      });
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizeStrings = async () => {
    try {
      setWorking(true);
      const { error } = await supabase.rpc('normalize_chants_fields');
      if (error) throw error;
      Alert.alert('Success', 'Normalization completed');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Normalization failed');
    } finally {
      setWorking(false);
    }
  };

  const refreshTrending = async () => {
    try {
      setWorking(true);
      const { error } = await supabase.rpc('refresh_trending_materialized');
      if (error) throw error;
      Alert.alert('Success', 'Trending views refreshed');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Refresh failed');
    } finally {
      setWorking(false);
    }
  };

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Data Quality</Text>
          <TouchableOpacity onPress={() => { setRefreshing(true); load(); }} style={styles.refreshBtn}>
            {refreshing ? <ActivityIndicator size="small" color={Colors.black} /> : <Ionicons name="refresh" size={18} color={Colors.black} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.statLine}>Total chants: {metrics.total}</Text>
            <Text style={styles.statLine}>Missing audio duration: {metrics.missing_audio_duration}</Text>
            <Text style={styles.statLine}>Missing team: {metrics.missing_team}</Text>
            <Text style={styles.statLine}>Missing tournament: {metrics.missing_tournament}</Text>
            <Text style={styles.statLine}>Missing year: {metrics.missing_year}</Text>
            <Text style={styles.statLine}>Missing artist: {metrics.missing_artist}</Text>
            <Text style={styles.statLine}>Missing language: {metrics.missing_language}</Text>
            <Text style={styles.statLine}>Missing region: {metrics.missing_region}</Text>
            <Text style={styles.statLine}>Missing Arabic title: {metrics.missing_title_arabic}</Text>
            <Text style={styles.statLine}>Missing French title: {metrics.missing_title_french}</Text>
            <Text style={styles.statLine}>Missing lyrics: {metrics.missing_lyrics}</Text>
            <Text style={styles.statLine}>Missing tags: {metrics.missing_tags}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={normalizeStrings} disabled={working}>
            {working ? <ActivityIndicator size="small" color={Colors.black} /> : <Ionicons name="build" size={18} color={Colors.black} />}
            <Text style={styles.actionText}>Normalize Strings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={refreshTrending} disabled={working}>
            {working ? <ActivityIndicator size="small" color={Colors.black} /> : <Ionicons name="trending-up" size={18} color={Colors.black} />}
            <Text style={styles.actionText}>Refresh Trending</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppBackground>
  );
};

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border || Colors.textSecondary + '20',
    padding: 12,
    marginBottom: 16,
  },
  statLine: {
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  actionText: {
    marginLeft: 6,
    color: Colors.black,
    fontWeight: '700',
  },
});
