import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

const BARS = [
  { label: 'Kelime', pct: 82, color: Colors.amber },
  { label: 'Cümle', pct: 70, color: Colors.teal },
  { label: 'Yapılar', pct: 60, color: Colors.coral },
  { label: 'Hikâye', pct: 80, color: Colors.amber },
];

export default function ProgressBars() {
  return (
    <View>
      <Text style={styles.title}>A2 İlerlemen</Text>
      <View style={styles.bars}>
        {BARS.map((b) => (
          <View key={b.label} style={styles.row}>
            <Text style={styles.label}>{b.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${b.pct}%`, backgroundColor: b.color }]} />
            </View>
            <Text style={styles.pct}>{b.pct}%</Text>
          </View>
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
    marginBottom: Spacing.md,
  },
  bars: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    width: 58,
    fontSize: 12,
    color: Colors.textDim,
  },
  track: {
    flex: 1,
    height: 9,
    backgroundColor: Colors.bgDeep,
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 100,
  },
  pct: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    color: Colors.textFaint,
  },
});
