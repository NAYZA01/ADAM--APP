import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

const STEPS = ['Yeni', '1g', '3g', '7g', '14g', '30g'];
// index 2 is "now"
const CURRENT = 2;

export default function SpacedRep() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tekrar Zamanlaması</Text>
      <Text style={styles.hint}>"abandon" kelimesi spaced repetition döngüsünde.</Text>
      <View style={styles.track}>
        {STEPS.map((_, i) => (
          <React.Fragment key={i}>
            <View
              style={[
                styles.dot,
                i < CURRENT && styles.dotDone,
                i === CURRENT && styles.dotNow,
              ]}
            />
            {i < STEPS.length - 1 && <View style={styles.line} />}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.labels}>
        {STEPS.map((s) => (
          <Text key={s} style={styles.label}>
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
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
    marginBottom: Spacing.sm,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.line,
  },
  dotDone: {
    backgroundColor: Colors.teal,
  },
  dotNow: {
    backgroundColor: Colors.amber,
    shadowColor: Colors.amber,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.line,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 9.5,
    color: Colors.textFaint,
    width: 34,
    textAlign: 'center',
  },
});
