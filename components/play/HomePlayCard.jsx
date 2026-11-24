import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Dices, ChevronRight } from "lucide-react-native";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";

/* The way back into the games once signed in: one quiet row on Home. */
export default function HomePlayCard() {
  const router = useRouter();
  const { t } = useApp();
  return (
    <Pressable onPress={() => router.push("/play")} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} accessibilityRole="button">
      <View style={styles.icon}>
        <Dices size={18} color={C.pinkText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{t.plHubTitle}</Text>
        <Text style={styles.body}>{t.plHubSub}</Text>
      </View>
      <ChevronRight size={18} color={C.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 14 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 15.5, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 19, color: C.inkSoft, marginTop: 1 },
});
