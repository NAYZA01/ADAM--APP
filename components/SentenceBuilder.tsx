import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

const CORRECT_ORDER = ['yesterday', 'I', 'went', 'to', 'school'];
const POOL = ['I', 'went', 'school', 'yesterday', 'to'];

export default function SentenceBuilder() {
  const [placed, setPlaced] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const isUsed = (idx: number) => placed.includes(idx);

  const addWord = (idx: number) => {
    if (isUsed(idx)) return;
    setPlaced([...placed, idx]);
    setFeedback(null);
  };

  const removeWord = (idx: number) => {
    setPlaced(placed.filter((i) => i !== idx));
    setFeedback(null);
  };

  const check = () => {
    const built = placed.map((i) => POOL[i]);
    const ok =
      built.length === CORRECT_ORDER.length &&
      built.every((w, i) => w === CORRECT_ORDER[i]);
    setFeedback({
      text: ok
        ? '✅ Doğru! "I went to school yesterday."'
        : '❌ Tekrar dene — sıralamayı kontrol et.',
      ok,
    });
  };

  const reset = () => {
    setPlaced([]);
    setFeedback(null);
  };

  return (
    <View>
      <Text style={styles.title}>Cümle Kurma Fabrikası</Text>
      <Text style={styles.hint}>
        Parçaları sırayla seç: <Text style={styles.hintBold}>yesterday · I · went · to · school</Text>
      </Text>

      <View style={styles.target}>
        {placed.length === 0 ? (
          <Text style={styles.placeholder}>Kelimelere dokunarak cümleyi buraya sırayla ekle…</Text>
        ) : (
          placed.map((idx) => (
            <TouchableOpacity
              key={`p-${idx}`}
              style={styles.chipPlaced}
              onPress={() => removeWord(idx)}
            >
              <Text style={styles.chipPlacedText}>{POOL[idx]}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.pool}>
        {POOL.map((word, idx) => (
          <TouchableOpacity
            key={`pool-${idx}`}
            style={[styles.chip, isUsed(idx) && styles.chipUsed]}
            onPress={() => addWord(idx)}
            disabled={isUsed(idx)}
          >
            <Text style={[styles.chipText, isUsed(idx) && styles.chipTextUsed]}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnCheck} onPress={check}>
          <Text style={styles.btnCheckText}>Kontrol Et</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReset} onPress={reset}>
          <Text style={styles.btnResetText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      {feedback && (
        <Text style={[styles.feedback, feedback.ok ? styles.ok : styles.bad]}>
          {feedback.text}
        </Text>
      )}
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
    lineHeight: 18,
  },
  hintBold: {
    color: Colors.text,
    fontWeight: '600',
  },
  target: {
    minHeight: 52,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  placeholder: {
    color: Colors.textFaint,
    fontSize: 13,
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  chipUsed: {
    backgroundColor: Colors.line,
    opacity: 0.4,
  },
  chipText: {
    color: Colors.amberDark,
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextUsed: {
    color: Colors.textFaint,
  },
  chipPlaced: {
    backgroundColor: Colors.bgDeep,
    borderWidth: 1,
    borderColor: Colors.amber,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  chipPlacedText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  btnCheck: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  btnCheckText: {
    color: Colors.tealDark,
    fontWeight: '700',
    fontSize: 13,
  },
  btnReset: {
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  btnResetText: {
    color: Colors.textDim,
    fontSize: 13,
  },
  feedback: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  ok: {
    color: Colors.teal,
  },
  bad: {
    color: Colors.coral,
  },
});
