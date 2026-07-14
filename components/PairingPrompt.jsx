import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

export default function PairingPrompt() {
  const router = useRouter();
  const { t } = useApp();
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Heart size={22} color={C.pinkText} />
      </View>
      <Text style={styles.title}>{t.pairingTitle}</Text>
      <Text style={styles.sub}>{t.notPaired}</Text>
      <Pressable style={styles.btn} onPress={() => router.push("/(tabs)/settings")}>
        <Text style={styles.btnLabel}>{t.goToPairing}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 20, paddingVertical: 22, paddingHorizontal: 20, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center", gap: 10, ...cardShadow },
  iconCircle: { width: 46, height: 46, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5, color: C.ink },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: C.inkSoft, textAlign: "center", maxWidth: 260 },
  btn: { marginTop: 6, backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  btnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: "#fff" },
});
