import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

const DIAL_DATA = {
  textbook: {
    tag: 'Standart ifade',
    text: 'I am very tired.',
    angle: -55,
  },
  real: {
    tag: 'Doğal konuşma',
    text: "I'm exhausted.",
    angle: 55,
  },
};

type Mode = 'textbook' | 'real';

export default function FrequencyDial() {
  const [mode, setMode] = useState<Mode>('textbook');
  const data = DIAL_DATA[mode];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Frekansı Ayarla</Text>
      <Text style={styles.subtitle}>
        Aynı cümle, iki frekans. Kitapta yazılan ile sokakta duyulan arasında geçiş yap.
      </Text>

      <View style={styles.dialArea}>
        {/* Simple visual dial representation */}
        <View style={styles.arcContainer}>
          <View style={styles.arc}>
            <Text style={styles.arcLabelLeft}>DERS KİTABI</Text>
            <Text style={styles.arcLabelRight}>GERÇEK HAYAT</Text>
            <View
              style={[
                styles.needle,
                { transform: [{ rotate: `${data.angle}deg` }] },
              ]}
            />
            <View style={styles.centerDot} />
          </View>
        </View>

        <View style={styles.exampleArea}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'textbook' && styles.toggleActive]}
              onPress={() => setMode('textbook')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'textbook' && styles.toggleTextActive]}>
                Ders Kitabı
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'real' && styles.toggleActive]}
              onPress={() => setMode('real')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'real' && styles.toggleTextActive]}>
                Gerçek Hayat
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTag}>{data.tag}</Text>
            <Text
              style={[
                styles.exampleText,
                mode === 'real' ? styles.exampleReal : styles.exampleTextbook,
              ]}
            >
              {data.text}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceHi,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  dialArea: {
    gap: Spacing.md,
  },
  arcContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  arc: {
    width: 220,
    height: 110,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: Colors.line,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  arcLabelLeft: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.textFaint,
    fontWeight: '500',
  },
  arcLabelRight: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.textFaint,
    fontWeight: '500',
  },
  needle: {
    position: 'absolute',
    bottom: 0,
    width: 3,
    height: 90,
    backgroundColor: Colors.amber,
    borderRadius: 2,
    transformOrigin: 'bottom',
  },
  centerDot: {
    position: 'absolute',
    bottom: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.amber,
  },
  exampleArea: {
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textDim,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  toggleTextActive: {
    color: Colors.amberDark,
  },
  exampleBox: {
    backgroundColor: Colors.bgDeep,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    minHeight: 80,
  },
  exampleTag: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textFaint,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  exampleTextbook: {
    color: Colors.textDim,
  },
  exampleReal: {
    color: Colors.teal,
  },
});
