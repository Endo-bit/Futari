import { useRef, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { X, Share2, Users } from "lucide-react-native";
import ShareCard from "./ShareCard";
import SaveButton from "./SaveButton";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";

/* Shows the day exactly as it will be shared before anything leaves the phone,
   then hands the rendered PNG to the system share sheet. Nothing is uploaded —
   the image is captured locally and written to the app's cache directory. */
export default function ShareSheet({ visible, onClose, entry, partner, dateText, prompt }) {
  const { t, partnerName, myName, showToast } = useApp();
  const insets = useSafeAreaInsets();
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  // A partner's words are theirs — sharing them outward is opt-in, never the default.
  const [includePartner, setIncludePartner] = useState(false);

  const partnerHasContent = !!(partner && (partner.promptAnswer || partner.happy || partner.mind || partner.next));

  const handleShare = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
      if (!(await Sharing.isAvailableAsync())) {
        showToast(t.shareUnavailable, "info");
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: t.shareDialogTitle,
      });
    } catch (err) {
      console.warn("[share] capture/share failed:", err?.message || err);
      showToast(t.shareFailed, "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.shareTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel={t.cancel}>
              <X size={19} color={C.inkSoft} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={styles.preview}
            showsVerticalScrollIndicator={false}
          >
            <ShareCard
              ref={cardRef}
              entry={entry}
              partner={partner}
              includePartner={includePartner && partnerHasContent}
              partnerName={partnerName}
              myName={myName}
              dateText={dateText}
              prompt={prompt}
              t={t}
            />
          </ScrollView>

          {partnerHasContent && (
            <Pressable onPress={() => setIncludePartner((v) => !v)} style={styles.toggleRow}>
              <View style={[styles.checkbox, includePartner && styles.checkboxOn]}>
                <Users size={12} color={includePartner ? "#fff" : C.inkSoft} />
              </View>
              <Text style={styles.toggleLabel}>{t.shareIncludePartner.replace("{n}", partnerName)}</Text>
            </Pressable>
          )}

          <View style={styles.actions}>
            <SaveButton
              onPress={handleShare}
              disabled={busy}
              label={busy ? t.sharePreparing : t.shareCta}
              icon={<Share2 size={17} color={busy ? C.inkSoft : "#fff"} />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(74,64,54,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.paperDeep,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: "92%",
    ...deepShadow,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { flex: 1, fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 40, paddingRight: 8, color: C.ink },
  closeBtn: { padding: 6 },
  preview: { alignItems: "center", paddingVertical: 6, paddingBottom: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.cardBorder },
  checkboxOn: { backgroundColor: C.pinkDeep, borderColor: C.pinkDeep },
  toggleLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, color: C.ink },
  actions: { paddingTop: 6 },
});
