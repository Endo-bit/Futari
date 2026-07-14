import { View, Text, Pressable, StyleSheet } from "react-native";
import { Smile, Meh, Moon, Heart } from "lucide-react-native";
import { C, fonts, cardShadow } from "../lib/theme";

const MOODS = [
  { id: "smile", Icon: Smile },
  { id: "meh", Icon: Meh },
  { id: "zzz", Icon: Moon },
  { id: "love", Icon: Heart },
];

export default function MoodPicker({ value, onChange, label }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {MOODS.map(({ id, Icon }) => {
          const sel = value === id;
          return (
            <Pressable key={id} onPress={() => onChange(sel ? null : id)} style={[styles.btn, sel && styles.btnSel]}>
              <Icon size={21} color={sel ? C.pinkText : C.inkSoft} fill={sel && id === "love" ? C.pinkText : "none"} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { MOODS };

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginTop: 4 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: C.inkSoft, marginBottom: 8 },
  row: { flexDirection: "row", gap: 14 },
  btn: { width: 46, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  btnSel: { backgroundColor: C.pink, borderWidth: 2.5, borderColor: C.pinkDeep },
});
