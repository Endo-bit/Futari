import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Send } from "lucide-react-native";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";

/* "A paper plane seems to have landed. Want to check it?" — shown on Home
   while a plane from the partner is waiting, re-checked whenever Home comes
   back into view. "Later" hides it until the next visit. */
export default function PlaneInbox() {
  const router = useRouter();
  const { t, api, me, isDemo } = useApp();
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!me?.pairId || isDemo) return;
      let live = true;
      setDismissed(false);
      api
        .planeInbox()
        .then((list) => live && setCount(Array.isArray(list) ? list.length : 0))
        .catch(() => {});
      return () => {
        live = false;
      };
    }, [me?.pairId, isDemo]) // eslint-disable-line
  );

  if (!count || dismissed) return null;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Send size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.plArrived}</Text>
          <Text style={styles.body}>{t.plArrivedAsk}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => setDismissed(true)} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
          <Text style={[styles.btnLabel, { color: C.inkSoft }]}>{t.plLater}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/plane")} style={[styles.btn, styles.btnMain]} accessibilityRole="button">
          <Text style={[styles.btnLabel, { color: "#fff" }]}>{t.plCheck}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.pinkDeep, padding: 14, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.pinkDeep, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: C.ink },
  body: { fontFamily: fonts.bodyRegular, fontSize: 15, color: C.inkSoft, marginTop: 1 },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  btnGhost: { backgroundColor: "#F1E9DC" },
  btnMain: { backgroundColor: C.pinkDeep },
  btnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 15 },
});
