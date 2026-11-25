import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import KeyboardScrollView from "./KeyboardScrollView";
import { C, fonts } from "../lib/theme";
import { useApp } from "../lib/appState";

/* Editing a page that was already saved — Premium, opened from the calendar.
   All four parts on one sheet; "Save changes" sends them together. The server
   enforces the Premium rule too (PREMIUM_REQUIRED), and that answer sends the
   user to the paywall instead of failing quietly. */

const FIELDS = [
  { key: "promptAnswer", label: "littlePrompt", ph: "promptAnswerPh" },
  { key: "happy", label: "happy", ph: "happyPh" },
  { key: "mind", label: "mind", ph: "mindPh" },
  { key: "next", label: "next", ph: "nextPh" },
];

export default function EditPageSheet({ visible, onClose, dateIso, entry, onPremiumRequired }) {
  const insets = useSafeAreaInsets();
  const { t, api, spaceId, setEntries, showToast } = useApp();
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setValues(Object.fromEntries(FIELDS.map((f) => [f.key, entry?.[f.key] || ""])));
  }, [visible]); // eslint-disable-line

  const save = async () => {
    if (!spaceId) return;
    const patch = {};
    for (const f of FIELDS) {
      const v = (values[f.key] || "").trim();
      if (v !== (entry?.[f.key] || "")) patch[f.key] = v;
    }
    if (!Object.keys(patch).length) {
      onClose?.();
      return;
    }
    setBusy(true);
    try {
      await api.saveEntry(spaceId, dateIso, patch);
      setEntries((es) => ({ ...es, [dateIso]: { ...(es[dateIso] || {}), ...patch } }));
      showToast(t.savedToast);
      onClose?.();
    } catch (err) {
      if (err?.message === "PREMIUM_REQUIRED") {
        onClose?.();
        onPremiumRequired?.();
      } else {
        showToast(t.plErrNet, "info");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.plBack}>
            <X size={24} color={C.inkSoft} />
          </Pressable>
        </View>
        <KeyboardScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t.pgEditPage}</Text>
          {FIELDS.map((f) => (
            <View key={f.key} style={{ gap: 6 }}>
              <Text style={styles.label}>{t[f.label]}</Text>
              <TextInput
                value={values[f.key] || ""}
                onChangeText={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                placeholder={t[f.ph]}
                placeholderTextColor="#9C907F"
                multiline
                style={styles.input}
              />
            </View>
          ))}
          <Pressable onPress={busy ? undefined : save} style={styles.primary} accessibilityRole="button">
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryLabel}>{t.pgSaveEdits}</Text>}
          </Pressable>
        </KeyboardScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  top: { height: 52, justifyContent: "center", paddingHorizontal: 18 },
  content: { paddingHorizontal: 22, paddingBottom: 30, gap: 14, maxWidth: 520, width: "100%", alignSelf: "center" },
  title: { fontFamily: fonts.scriptBold, fontSize: 34, lineHeight: 46, paddingRight: 10, color: C.ink },
  label: { fontFamily: fonts.bodyExtraBold, fontSize: 13, letterSpacing: 0.8, color: C.pinkText },
  input: { minHeight: 70, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 13, fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 23, color: C.ink, textAlignVertical: "top" },
  primary: { borderRadius: 999, paddingVertical: 16, alignItems: "center", backgroundColor: C.pinkDeep, minHeight: 54, justifyContent: "center", marginTop: 6 },
  primaryLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16.5, color: "#fff" },
});
