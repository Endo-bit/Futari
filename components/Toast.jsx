import { View, Text, StyleSheet } from "react-native";
import { Heart, Check } from "lucide-react-native";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

export default function ToastView() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        {toast.icon === "heart" ? (
          <Heart size={14} color={C.pinkDeep} fill={C.pinkDeep} />
        ) : toast.icon === "info" ? null : (
          <View style={styles.checkBadge}>
            <Check size={11} color="#fff" strokeWidth={3} />
          </View>
        )}
        <Text style={styles.msg}>{toast.msg}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: 96, left: 0, right: 0, alignItems: "center", zIndex: 60 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.ink,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: "85%",
    ...deepShadow,
    shadowOpacity: 0.18,
  },
  checkBadge: { width: 17, height: 17, borderRadius: 999, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  msg: { fontFamily: fonts.bodyBold, fontSize: 13, color: C.paper },
});
