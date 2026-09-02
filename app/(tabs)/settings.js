import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, Share, StyleSheet, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import * as Clipboard from "expo-clipboard";
import {
  Heart, Globe, Bell, Download, Trash2, Link2Off, Check, Lock, HelpCircle, Sparkles, ChevronRight, CreditCard, Send,
  LayoutGrid,
} from "lucide-react-native";
import InviteSheet from "../../components/InviteSheet";
import PaperBg from "../../components/PaperBg";
import Pill from "../../components/Pill";
import TimeField from "../../components/TimeField";
import { C, fonts, cardShadow } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { LANGS, T } from "../../lib/i18n";
import { buildExportText } from "../../lib/exportText";
import { WIDGET_MODES } from "../../lib/widgets";
import { sdTitle } from "../../components/SdBanner";
import {
  registerForPushNotifications,
  ensureNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "../../lib/pushNotifications";

const REMINDER_ON_KEY = "futari_reminder_on";
const REMINDER_TIME_KEY = "futari_reminder_time";

function Row({ icon, label, right, onPress, danger, last }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ width: 20, alignItems: "center" }}>{icon}</View>
      <Text style={[styles.rowLabel, danger && { color: "#C0605C" }]}>{label}</Text>
      {right}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    t, lang, setLang, me, setMe, refreshMe, partnerName, api, showToast, openTutorial, todayIso,
    specialDays, widgetMode, chooseWidgetMode, widgetSpecialDayId, chooseWidgetSpecialDay,
    isPremium, entitled, canPair, trialActive, trialDaysLeft,
  } = useApp();

  const [reminderOn, setReminderOn] = useState(false);
  const [revealNotifOn, setRevealNotifOn] = useState(true);
  const [reminderTime, setReminderTime] = useState("21:00");
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const reminderContent = (tt) => ({ title: tt.reminderNotifTitle, body: tt.reminderNotifBody });

  useEffect(() => {
    (async () => {
      const [storedOn, storedTime] = await Promise.all([
        AsyncStorage.getItem(REMINDER_ON_KEY),
        AsyncStorage.getItem(REMINDER_TIME_KEY),
      ]);
      const p = await api.getNotificationPrefs().catch(() => ({}));
      const wantsRevealNotif = p.revealNotifOn ?? true;
      setRevealNotifOn(wantsRevealNotif);
      setPushSubscribed(!!p.hasSubscription);

      const on = storedOn != null ? storedOn === "1" : !!p.reminderOn;
      const time = storedTime || p.reminderTime || "21:00";
      setReminderOn(on);
      setReminderTime(time);

      if (on) {
        const granted = await ensureNotificationPermission();
        if (granted) {
          const [h, m] = time.split(":").map(Number);
          scheduleDailyReminder(h, m, reminderContent(t)).catch(() => {});
        }
      }

      // Reveal-time notifications default to on server-side, but we only ever get an
      // Expo push token onto the server once the user grants permission — do that
      // proactively here instead of waiting for a toggle tap that may never happen
      // (the switch already reads as "on" so there's nothing to tap).
      if (wantsRevealNotif && !p.hasSubscription) {
        const token = await registerForPushNotifications().catch(() => null);
        if (token) {
          await api.saveExpoPushToken(token).catch(() => {});
          setPushSubscribed(true);
        }
      }
    })();
  }, []); // eslint-disable-line

  const ensurePushRegistered = async () => {
    if (pushSubscribed) return true;
    const token = await registerForPushNotifications();
    if (!token) {
      showToast(t.pushDenied, "info");
      return false;
    }
    await api.saveExpoPushToken(token);
    setPushSubscribed(true);
    return true;
  };
  const toggleReminder = async () => {
    const next = !reminderOn;
    if (next) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        showToast(t.pushDenied, "info");
        return;
      }
      const [h, m] = reminderTime.split(":").map(Number);
      await scheduleDailyReminder(h, m, reminderContent(t));
    } else {
      await cancelDailyReminder();
    }
    setReminderOn(next);
    await AsyncStorage.setItem(REMINDER_ON_KEY, next ? "1" : "0");
    api.saveNotificationPrefs({ reminderOn: next, revealNotifOn, reminderTime }).catch(() => {});
  };
  const toggleRevealNotif = async () => {
    const next = !revealNotifOn;
    if (next && !(await ensurePushRegistered())) return;
    setRevealNotifOn(next);
    await api.saveNotificationPrefs({ reminderOn, revealNotifOn: next, reminderTime });
  };
  const changeReminderTime = async (time) => {
    setReminderTime(time);
    await AsyncStorage.setItem(REMINDER_TIME_KEY, time);
    if (reminderOn) {
      const [h, m] = time.split(":").map(Number);
      await scheduleDailyReminder(h, m, reminderContent(t));
    }
    api.saveNotificationPrefs({ reminderOn, revealNotifOn, reminderTime: time }).catch(() => {});
  };

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [redeemInput, setRedeemInput] = useState("");
  const [pairingBusy, setPairingBusy] = useState(false);

  useEffect(() => {
    if (!inviteCode || me?.pairId) return;
    const timer = setInterval(async () => {
      const data = await refreshMe();
      if (data.pairId) {
        setInviteCode(null);
        showToast(t.pairedToast, "heart");
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [inviteCode, me?.pairId]); // eslint-disable-line

  /** Pairing is reachable while entitled and also on a never-used free trial. */
  const requirePairing = () => {
    if (canPair) return true;
    router.push("/paywall");
    return false;
  };
  /** Export is a paid/trial feature, but a fresh trial does not unlock it early. */
  const requireEntitlement = () => {
    if (entitled) return true;
    router.push("/paywall");
    return false;
  };

  const handleCreateInvite = async () => {
    if (!requirePairing()) return;
    setPairingBusy(true);
    try {
      const { code } = await api.createInvite();
      setInviteCode(code);
    } catch (err) {
      showToast(err.message, "info");
    } finally {
      setPairingBusy(false);
    }
  };
  const handleRedeem = async () => {
    if (!requirePairing()) return;
    if (!redeemInput.trim()) return;
    setPairingBusy(true);
    try {
      await api.redeemInvite(redeemInput);
      setRedeemInput("");
      await refreshMe();
      showToast(t.pairedToast, "heart");
    } catch (err) {
      showToast(err.message, "info");
    } finally {
      setPairingBusy(false);
    }
  };
  const handleCopyCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    showToast(t.codeCopied, "heart");
  };
  const handleUnpair = () => {
    Alert.alert("", t.unpairConfirm.replace("{n}", partnerName), [
      { text: t.cancel, style: "cancel" },
      {
        text: t.unpair.replace("{n}", partnerName),
        style: "destructive",
        onPress: async () => {
          await api.unpair();
          setInviteCode(null);
          await refreshMe();
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (!requireEntitlement()) return;
    if (!me) return;
    try {
      const data = await api.exportMyData(me.personalSpaceId, me.pairSpaceId);
      const text = buildExportText(data, t, partnerName);
      await Share.share({ message: text, title: `futari-export-${todayIso}` });
    } catch (err) {
      if (err?.message) showToast(err.message, "info");
    }
  };

  const handleManageSubscription = () => {
    const url =
      Platform.OS === "ios"
        ? "itms-apps://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    Linking.openURL(url).catch(() => {});
  };

  const handleDeleteAccount = () => {
    Alert.alert("", t.deleteAccConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteAcc,
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteAccount();
            showToast(t.deleteAccDone, "heart");
            await signOut();
            router.replace("/");
          } catch (err) {
            showToast(err?.message || t.demoToast, "info");
          }
        },
      },
    ]);
  };

  return (
    <PaperBg>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>{t.settingsTitle}</Text>
        </View>

        <View style={[styles.section, { gap: 14 }]}>
          <View style={styles.card}>
            {me?.pairId ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.avatarPair}>
                  <View style={[styles.avatarDot, { left: 0, backgroundColor: C.pinkDeep }]} />
                  <View style={[styles.avatarDot, { left: 14, backgroundColor: C.green }]} />
                </View>
                <View>
                  <Text style={styles.pairedWith}>
                    {t.pairedWith} {partnerName}
                  </Text>
                  {!!me.pairedAt && (
                    <Text style={styles.pairedSince}>
                      {t.pairedSince.replace("{d}", new Date(me.pairedAt).toLocaleDateString(lang))}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Heart size={16} color={C.pinkText} />
                  <Text style={styles.pairingTitle}>{t.pairingTitle}</Text>
                </View>
                <Text style={styles.notPaired}>{t.notPaired}</Text>

                {canPair ? (
                  <View style={styles.premiumNote}>
                    <Sparkles size={13} color={C.pinkText} />
                    <Text style={styles.premiumNoteText}>
                      {trialActive
                        ? t.trialDaysLeftNote.replace("{n}", String(trialDaysLeft))
                        : entitled
                        ? t.paywallFeaturePairing
                        : t.trialFreeNote.replace("{n}", String(t.trialDays))}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.premiumNote}>
                    <Lock size={13} color={C.pinkText} />
                    <Text style={styles.premiumNoteText}>{t.trialEndedNote}</Text>
                  </View>
                )}

                {inviteCode ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={styles.inviteCode}>{inviteCode}</Text>
                    <Pressable onPress={handleCopyCode} style={styles.copyBtn}>
                      <Text style={styles.copyBtnLabel}>{t.copyCode}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={handleCreateInvite} disabled={pairingBusy} style={styles.generateBtn}>
                    <Text style={styles.generateBtnLabel}>{t.generateInvite}</Text>
                  </Pressable>
                )}

                <View style={styles.divider} />

                <Text style={styles.enterCodeTitle}>{t.enterCodeTitle}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={redeemInput}
                    onChangeText={(v) => setRedeemInput(v.toUpperCase())}
                    placeholder={t.enterCodePh}
                    placeholderTextColor="#B3A794"
                    maxLength={6}
                    style={styles.redeemInput}
                  />
                  <Pressable
                    onPress={handleRedeem}
                    disabled={pairingBusy || !redeemInput.trim()}
                    style={[styles.redeemBtn, redeemInput.trim() ? styles.redeemBtnOn : styles.redeemBtnOff]}
                  >
                    <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: redeemInput.trim() ? "#fff" : C.inkSoft }}>
                      {t.redeemCode}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {!isPremium && (
            <Pressable onPress={() => router.push("/paywall")} style={styles.premiumCard}>
              <View style={styles.premiumCardIcon}>
                <Sparkles size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumCardTitle}>
                  {trialActive ? t.trialCardTitle.replace("{n}", String(trialDaysLeft)) : t.paywallTitle}
                </Text>
                <Text style={styles.premiumCardSub}>
                  {trialActive ? t.trialCardSub : t.upgradeToPremium}
                </Text>
              </View>
              <ChevronRight size={18} color="#fff" />
            </Pressable>
          )}

          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Globe size={17} color={C.inkSoft} />
              <Text style={styles.cardHeading}>{t.language}</Text>
            </View>
            <View style={styles.langWrap}>
              {LANGS.map((l) => {
                const sel = lang === l;
                return (
                  <Pressable key={l} onPress={() => setLang(l)} style={[styles.langBtn, sel && styles.langBtnSel]}>
                    {sel && <Check size={13} color={C.pinkText} />}
                    <Text style={[styles.langLabel, { color: sel ? C.pinkText : C.inkSoft }]}>{T[l].langName}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {Platform.OS === "ios" && (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <LayoutGrid size={17} color={C.inkSoft} />
                <Text style={styles.cardHeading}>{t.widgetTitle}</Text>
              </View>
              <Text style={styles.widgetHint}>{t.widgetHowTo}</Text>

              <View style={styles.widgetOptions}>
                {WIDGET_MODES.map((m) => {
                  const sel = widgetMode === m;
                  return (
                    <Pressable key={m} onPress={() => chooseWidgetMode(m)} style={[styles.widgetOption, sel && styles.widgetOptionSel]}>
                      <View style={[styles.radio, sel && styles.radioOn]}>{sel && <Check size={11} color="#fff" />}</View>
                      <Text style={[styles.widgetOptionLabel, sel && { color: C.pinkText }]}>
                        {t.widgetOptions[m].replace("{n}", partnerName)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {widgetMode === "anniversary" && (
                <View style={styles.widgetSubSection}>
                  <Text style={styles.widgetSubLabel}>{t.widgetWhichDay}</Text>
                  {specialDays.length === 0 ? (
                    <Text style={styles.widgetHint}>{t.widgetNoSpecialDays}</Text>
                  ) : (
                    <View style={styles.widgetChips}>
                      {specialDays.map((sd) => {
                        const sel = (widgetSpecialDayId || specialDays[0]?.id) === sd.id;
                        return (
                          <Pressable
                            key={sd.id}
                            onPress={() => chooseWidgetSpecialDay(sd.id)}
                            style={[styles.widgetChip, sel && styles.widgetChipSel]}
                          >
                            <Text style={[styles.widgetChipLabel, { color: sel ? C.pinkText : C.inkSoft }]} numberOfLines={1}>
                              {sdTitle(sd, t)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={[styles.card, { paddingVertical: 4, paddingHorizontal: 18 }]}>
            <Row icon={<Send size={17} color={C.inkSoft} />} label={t.inviteFriend} onPress={() => setInviteSheetOpen(true)} />
            <Row icon={<HelpCircle size={17} color={C.inkSoft} />} label={t.tutorialReplay} onPress={openTutorial} />
            <Row icon={<Bell size={17} color={C.inkSoft} />} label={t.reminder} right={<Pill on={reminderOn} />} onPress={toggleReminder} />
            {reminderOn && (
              <Row
                icon={<Bell size={17} color={C.inkSoft} />}
                label={t.reminderTimeLabel}
                right={<TimeField value={reminderTime} onChange={changeReminderTime} />}
              />
            )}
            <Row icon={<Heart size={17} color={C.inkSoft} />} label={t.revealNotif} right={<Pill on={revealNotifOn} />} onPress={toggleRevealNotif} />
            <Row
              icon={entitled ? <Download size={17} color={C.inkSoft} /> : <Lock size={17} color={C.inkSoft} />}
              label={t.exportData}
              onPress={handleExport}
            />
            {!!me?.pairId && (
              <Row icon={<Link2Off size={17} color="#C0605C" />} label={t.unpair.replace("{n}", partnerName)} onPress={handleUnpair} danger />
            )}
            {isPremium && (
              <Row icon={<CreditCard size={17} color={C.inkSoft} />} label={t.manageSubscription} onPress={handleManageSubscription} />
            )}
            <Row icon={<Trash2 size={17} color="#C0605C" />} label={t.deleteAcc} onPress={handleDeleteAccount} danger last />
          </View>

          <Text style={styles.privacyNote}>{t.privacyNote}</Text>
        </View>
      </ScrollView>

      <InviteSheet visible={inviteSheetOpen} onClose={() => setInviteSheetOpen(false)} code={inviteCode} />
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 },
  h1: { fontFamily: fonts.scriptSemiBold, fontSize: 34, lineHeight: 50, paddingVertical: 4, paddingRight: 10, color: C.ink },
  section: { paddingHorizontal: 18, paddingTop: 8 },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  premiumCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.pinkDeep, borderRadius: 20, padding: 16, ...cardShadow },
  premiumCardIcon: { width: 34, height: 34, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  premiumCardTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 15, color: "#fff" },
  premiumCardSub: { fontFamily: fonts.bodyRegular, fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  avatarPair: { width: 44, height: 32 },
  avatarDot: { position: "absolute", width: 32, height: 32, borderRadius: 999, opacity: 0.85 },
  pairedWith: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink },
  pairedSince: { fontFamily: fonts.bodyBold, fontSize: 12, color: C.pinkText },
  pairingTitle: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink },
  notPaired: { fontFamily: fonts.bodyRegular, fontSize: 13, color: C.inkSoft },
  premiumNote: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.pink, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  premiumNoteText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: C.pinkText, flex: 1 },
  inviteCode: { fontFamily: fonts.scriptBold, fontSize: 28, lineHeight: 42, paddingVertical: 3, paddingRight: 8, letterSpacing: 3, color: C.ink },
  copyBtn: { borderRadius: 999, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 16 },
  copyBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: C.pinkText },
  generateBtn: { backgroundColor: C.pinkDeep, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16, alignSelf: "flex-start" },
  generateBtnLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, color: "#fff" },
  divider: { height: 1, backgroundColor: C.cardBorder },
  enterCodeTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: C.ink },
  redeemInput: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: 14, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff", color: C.ink, letterSpacing: 2 },
  redeemBtn: { borderRadius: 999, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  redeemBtnOn: { backgroundColor: C.pinkDeep },
  redeemBtnOff: { backgroundColor: "#E9DFD2" },
  cardHeading: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink },
  widgetHint: { fontFamily: fonts.bodyRegular, fontSize: 12, color: C.inkSoft, lineHeight: 18, marginBottom: 10 },
  widgetOptions: { gap: 7 },
  widgetOption: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff" },
  widgetOptionSel: { borderColor: C.pinkDeep, backgroundColor: C.pink },
  widgetOptionLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, color: C.ink },
  radio: { width: 18, height: 18, borderRadius: 999, borderWidth: 1.5, borderColor: C.cardBorder, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: C.pinkDeep, borderColor: C.pinkDeep },
  widgetSubSection: { marginTop: 12 },
  widgetSubLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 11, letterSpacing: 1, color: C.inkSoft, marginBottom: 8 },
  widgetChips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  widgetChip: { maxWidth: "100%", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff" },
  widgetChipSel: { borderColor: C.pinkDeep, backgroundColor: C.pink },
  widgetChipLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  langWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff" },
  langBtnSel: { borderColor: C.pinkDeep, backgroundColor: C.pink },
  langLabel: { fontFamily: fonts.bodyBold, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  rowLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: C.ink },
  privacyNote: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: C.inkSoft, textAlign: "center", marginHorizontal: 12, lineHeight: 19 },
});
