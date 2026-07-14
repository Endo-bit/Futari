import { Pressable, Text, View, StyleSheet } from "react-native";
import { C, fonts, cardShadow } from "../lib/theme";

export default function BlockCard({ icon, title, text, placeholder, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      {text ? (
        <Text style={styles.text}>{text}</Text>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 20, padding: 16, ...cardShadow },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: C.ink },
  text: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 22, color: C.ink },
  placeholder: { fontFamily: fonts.bodyItalic, fontSize: 14, color: C.inkSoft },
});
