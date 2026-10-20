import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

type Status = 'done' | 'active' | 'pending';

const ITEMS: { num: string; title: string; status: Status; statusText: string }[] = [
  { num: '01', title: 'Basic Sentences', status: 'done', statusText: 'tamamlandı' },
  { num: '02', title: 'Present Simple', status: 'done', statusText: 'tamamlandı' },
  { num: '03', title: 'Present Continuous', status: 'active', statusText: 'devam ediyor' },
  { num: '04', title: 'Past Simple', status: 'pending', statusText: 'sırada' },
  { num: '05', title: 'Future with will', status: 'pending', statusText: 'sırada' },
];

export default function Roadmap() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eğitim Rotası</Text>
      {ITEMS.map((item, i) => (
        <View key={item.num} style={styles.item}>
          <View style={styles.left}>
            <View
              style={[
                styles.num,
                item.status === 'done' && styles.numDone,
                item.status === 'active' && styles.numActive,
              ]}
            >
              <Text
                style={[
                  styles.numText,
                  (item.status === 'done' || item.status === 'active') && styles.numTextActive,
                ]}
              >
                {item.num}
              </Text>
            </View>
            {i < ITEMS.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.textWrap}>
            <Text
              style={[
                styles.itemTitle,
                item.status !== 'active' && styles.itemTitleDim,
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.status}>{item.statusText}</Text>
          </View>
        </View>
      ))}
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
    marginBottom: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
  },
  left: {
    alignItems: 'center',
    width: 28,
  },
  num: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.bgDeep,
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  numDone: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  numActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  numText: {
    fontSize: 11,
    color: Colors.textDim,
  },
  numTextActive: {
    color: Colors.amberDark,
    fontWeight: '700',
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.line,
    marginVertical: 2,
  },
  textWrap: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 18,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
  },
  itemTitleDim: {
    color: Colors.textDim,
  },
  status: {
    fontSize: 10.5,
    color: Colors.textFaint,
    marginTop: 2,
  },
});
