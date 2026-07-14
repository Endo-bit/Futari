import { View, Text, StyleSheet } from "react-native";
import { C, fonts, cardShadow } from "../lib/theme";

export function FieldCard({ tag, tc, text }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.tag, { color: tc }]}>{tag}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

export function PairFieldCards({ entry, t }) {
  return (
    <>
      {!!entry?.promptAnswer && <FieldCard tag={t.littlePrompt} tc={C.sun} text={entry.promptAnswer} />}
      {!!entry?.happy && <FieldCard tag={t.tagHappy} tc={C.pinkText} text={entry.happy} />}
      {!!entry?.mind && <FieldCard tag={t.tagMind} tc={C.blue} text={entry.mind} />}
      {!!entry?.next && <FieldCard tag={t.tagNext} tc={C.green} text={entry.next} />}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    ...cardShadow,
  },
  tag: { fontFamily: fonts.bodyExtraBold, fontSize: 10.5, letterSpacing: 1, marginBottom: 5 },
  text: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 20, color: C.ink },
});
