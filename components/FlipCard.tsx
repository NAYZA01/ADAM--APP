import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Word } from '../types';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  word: Word;
}

export default function FlipCard({ word }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setFlipped(!flipped)}
      style={styles.card}
    >
      {!flipped ? (
        <View style={[styles.face, styles.front]}>
          <Text style={styles.main}>{word.word}</Text>
          <Text style={styles.tr}>{word.translation}</Text>
          <Text style={styles.tap}>dokun ↻</Text>
        </View>
      ) : (
        <View style={[styles.face, styles.back]}>
          <Text style={styles.type}>{word.type}</Text>
          <Text style={styles.forms}>{word.forms}</Text>
          <Text style={styles.ex}>“{word.example}”</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    height: 158,
    marginRight: 12,
  },
  face: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: 14,
    justifyContent: 'space-between',
  },
  front: {
    backgroundColor: Colors.bgDeep,
  },
  back: {
    backgroundColor: Colors.surfaceHi,
  },
  main: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  tr: {
    fontSize: 12,
    color: Colors.textDim,
  },
  tap: {
    fontSize: 10,
    color: Colors.textFaint,
  },
  type: {
    fontSize: 10,
    color: Colors.amber,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  forms: {
    fontSize: 11,
    color: Colors.textDim,
    lineHeight: 16,
    marginTop: 4,
  },
  ex: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.teal,
    lineHeight: 15,
  },
});
