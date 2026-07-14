import { Pressable, Text, StyleSheet } from "react-native";
import { C, fonts, cardShadow } from "../lib/theme";

export default function SaveButton({ onPress, label, icon, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.btn, disabled ? styles.disabled : styles.enabled]}
    >
      {icon}
      <Text style={[styles.label, { color: disabled ? C.inkSoft : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  enabled: { backgroundColor: C.pinkDeep, ...cardShadow, shadowOpacity: 0.22 },
  disabled: { backgroundColor: "#E9DFD2" },
  label: { fontFamily: fonts.bodyExtraBold, fontSize: 16 },
});
