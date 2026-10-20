import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

export type ScreenKey =
  | 'home'
  | 'vocabulary'
  | 'sentences'
  | 'expressions'
  | 'idioms'
  | 'stories'
  | 'notebook'
  | 'progress';

interface Feature {
  key: ScreenKey;
  name: string;
  sub: string;
  color: string;
  icon: string;
}

const FEATURES: Feature[] = [
  { key: 'vocabulary', name: 'Kelime Öğren', sub: '1.000 kelime · A2–B1', color: Colors.amber, icon: '📚' },
  { key: 'sentences', name: 'Cümle Kur', sub: '150–200 yapı', color: Colors.teal, icon: '🧱' },
  { key: 'expressions', name: 'Günlük İfadeler', sub: '"Sounds good." tarzı', color: Colors.coral, icon: '🎬' },
  { key: 'idioms', name: 'Deyimler', sub: '"Piece of cake"', color: Colors.amber, icon: '💬' },
  { key: 'stories', name: 'Hikâyeler', sub: 'A2 & B1 seviyeli', color: Colors.teal, icon: '📖' },
  { key: 'notebook', name: 'Kelime Defterim', sub: 'Kaydettiklerin', color: Colors.coral, icon: '📕' },
];

interface Props {
  onNavigate: (key: ScreenKey) => void;
}

export default function FeatureGrid({ onNavigate }: Props) {
  return (
    <View>
      <Text style={styles.title}>Bölümler</Text>
      <Text style={styles.hint}>Bugün nereye devam etmek istersin?</Text>
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={styles.feature}
            onPress={() => onNavigate(f.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.icon}>{f.icon}</Text>
            <Text style={styles.name}>{f.name}</Text>
            <Text style={styles.sub}>{f.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  feature: {
    width: '48%',
    backgroundColor: Colors.bgDeep,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
  },
  icon: {
    fontSize: 22,
  },
  name: {
    fontWeight: '700',
    fontSize: 13.5,
    color: Colors.text,
  },
  sub: {
    fontSize: 11,
    color: Colors.textFaint,
    lineHeight: 15,
  },
});
