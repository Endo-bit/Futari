import { useRef, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, Share, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as StoreReview from "expo-store-review";
import { X, Share2, Type } from "lucide-react-native";
import InviteCard from "./InviteCard";
import SaveButton from "./SaveButton";
import { C, fonts, deepShadow } from "../lib/theme";
import { useApp } from "../lib/appState";
import { pairingLink } from "../lib/deepLinks";
import { track } from "../lib/analytics";
import { EV } from "../lib/events";

const FALLBACK_URL = "https://futari-nine.vercel.app";

/* With a code, the link IS the pairing — tapping it opens the app already
   holding the code, and /pair/<code> on the web offers the App Store to anyone
   who doesn't have it yet, keeping the code for after they install. Without one
   this is the generic "you might like this" share, so a store link is right. */
function inviteUrl(code) {
  if (code) return pairingLink(code);
  return StoreReview.storeUrl() || FALLBACK_URL;
}

/* Inviting a friend used to send a bare line of text. It now sends the same
   paper page the app is made of, previewed before anything leaves the phone.
   The plain-text route stays as a second button, because some places (SMS, a
   search field, a note) want a link rather than a picture. */
export default function InviteSheet({ visible, onClose, code }) {
  const { t, showToast } = useApp();
  const insets = useSafeAreaInsets();
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const shareImage = async () => {
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
        dialogTitle: code ? t.pairInviteShareTitle : t.inviteFriendShareTitle,
      });
      track(EV.INVITE_SHARED, { method: "image", pairing: !!code });
    } catch (err) {
      console.warn("[invite] capture/share failed:", err?.message || err);
      showToast(t.shareFailed, "info");
    } finally {
      setBusy(false);
    }
  };

  const shareText = async () => {
    const template = code ? t.pairInviteMessage : t.inviteFriendMessage;
    const title = code ? t.pairInviteShareTitle : t.inviteFriendShareTitle;
    const message = template.replace("{url}", inviteUrl(code));
    try {
      await Share.share(Platform.OS === "android" ? { message, title } : { message });
      track(EV.INVITE_SHARED, { method: "text", pairing: !!code });
    } catch {
      // dismissed — nothing to do
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.inviteFriend}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel={t.cancel}>
              <X size={19} color={C.inkSoft} />
            </Pressable>
          </View>

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={styles.preview} showsVerticalScrollIndicator={false}>
            <InviteCard ref={cardRef} t={t} code={code} />
          </ScrollView>

          <View style={styles.actions}>
            <SaveButton
              onPress={shareImage}
              disabled={busy}
              label={busy ? t.sharePreparing : t.inviteShareImage}
              icon={<Share2 size={17} color={busy ? C.inkSoft : "#fff"} />}
            />
            <Pressable onPress={shareText} style={styles.textBtn}>
              <Type size={14} color={C.pinkText} />
              <Text style={styles.textBtnLabel}>{t.inviteShareText}</Text>
            </Pressable>
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
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { flex: 1, fontFamily: fonts.scriptSemiBold, fontSize: 27, lineHeight: 40, paddingRight: 8, color: C.ink },
  closeBtn: { padding: 6 },
  preview: { alignItems: "center", paddingVertical: 6, paddingBottom: 14 },
  actions: { paddingTop: 4, gap: 4 },
  textBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  textBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: C.pinkText },
});
