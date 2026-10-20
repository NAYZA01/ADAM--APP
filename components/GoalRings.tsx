import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Goal {
  label: string;
  current: number;
  target: number;
  color: string;
}

const GOALS: Goal[] = [
  { label: 'Kelime', current: 8, target: 10, color: Colors.amber },
  { label: 'Cümle', current: 1, target: 3, color: Colors.teal },
  { label: 'Hikâye', current: 0, target: 1, color: Colors.coral },
];

function Ring({ current, target, color, label }: Goal) {
  const pct = Math.min(current / target, 1);
  return (
    <View style={styles.goal}>
      <View style={[styles.ringOuter, { borderColor: Colors.bgDeep }]}>
        <View
          style={[
            styles.ringProgress,
            {
              borderColor: color,
              // simple visual fill approximation
              borderTopColor: pct > 0.25 ? color : Colors.bgDeep,
              borderRightColor: pct > 0.5 ? color : Colors.bgDeep,
              borderBottomColor: pct > 0.75 ? color : Colors.bgDeep,
              borderLeftColor: pct > 0 ? color : Colors.bgDeep,
            },
          ]}
        />
        <View style={styles.ringInner}>
          <Text style={styles.ringNum}>
            {current}/{target}
          </Text>
        </View>
      </View>
      <Text style={styles.goalLabel}>{label}</Text>
    </View>
  );
}

export default function GoalRings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bugünkü Hedefin</Text>
      <Text style={styles.hint}>Günlük döngü tamamlanınca serin devam eder.</Text>
      <View style={styles.row}>
        {GOALS.map((g) => (
          <Ring key={g.label} {...g} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goal: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgDeep,
  },
  ringProgress: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
  },
  ringInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringNum: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  goalLabel: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textDim,
  },
});
