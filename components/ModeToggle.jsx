import { View, Text, Pressable, StyleSheet } from "react-native";
import { Heart, Lock } from "lucide-react-native";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

export default function ModeToggle() {
  const { mode, setMode, t } = useApp();
  const options = [
    { id: "pair", label: t.modePair, Icon: Heart },
    { id: "personal", label: t.modePersonal, Icon: Lock },
  ];
  return (
    <View style={styles.wrap}>
      {options.map(({ id, label, Icon }) => {
        const sel = mode === id;
        return (
          <Pressable key={id} onPress={() => setMode(id)} style={[styles.btn, sel && styles.btnSel]}>
            <Icon size={14} color={sel ? "#fff" : C.inkSoft} fill={id === "pair" && sel ? "#fff" : "none"} />
            <Text style={[styles.label, { color: sel ? "#fff" : C.inkSoft }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: C.card,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignSelf: "flex-start",
    ...cardShadow,
  },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15 },
  btnSel: { backgroundColor: C.pinkDeep },
  label: { fontFamily: fonts.bodyExtraBold, fontSize: 13 },
});
