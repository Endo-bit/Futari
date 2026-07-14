import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, ChevronDown, Heart, Cake, Star, Plus, Lock, Trash2 } from "lucide-react-native";
import PaperBg from "../../components/PaperBg";
import ModeToggle from "../../components/ModeToggle";
import PairingPrompt from "../../components/PairingPrompt";
import DateField from "../../components/DateField";
import { C, fonts, cardShadow } from "../../lib/theme";
import { useApp, isoOf } from "../../lib/appState";
import { sdTitle, sdLabel, sdCountdown } from "../../components/SdBanner";
import { useEntitlement } from "../../lib/entitlement";

const SD_ICONS = { heart: Heart, cake: Cake, star: Star };

export default function JournalScreen() {
  const router = useRouter();
  const { t, lang, today, todayIso, me, mode, api, entries, specialDays, setSpecialDays, streak, showToast, spaceId } = useApp();
  const { isPremium } = useEntitlement();

  const [calY, setCalY] = useState(today.getFullYear());
  const [calM, setCalM] = useState(today.getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);

  const [sdFormOpen, setSdFormOpen] = useState(false);
  const [sdNewTitle, setSdNewTitle] = useState("");
  const [sdNewDate, setSdNewDate] = useState(null);
  const [sdNewIcon, setSdNewIcon] = useState("heart");

  const base = new Date(calY, calM, 1);
  const firstDay = base.getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const stepMonth = (dir) => {
    let m = calM + dir, y = calY;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalM(m);
    setCalY(y);
  };

  const sdForDate = (dIso) => specialDays.filter((sd) => sd.date.slice(5) === dIso.slice(5));

  const openAddForm = () => {
    if (!isPremium && specialDays.length >= 1) {
      router.push("/paywall");
      return;
    }
    setSdFormOpen((o) => !o);
  };

  const submitSpecialDay = async () => {
    if (!sdNewTitle.trim() || !sdNewDate || !spaceId) return;
    try {
      const { id } = await api.addSpecialDay(spaceId, { title: sdNewTitle.trim(), date: sdNewDate, icon: sdNewIcon });
      setSpecialDays((s) => [...s, { id, title: sdNewTitle.trim(), date: sdNewDate, icon: sdNewIcon }]);
      setSdNewTitle("");
      setSdNewDate(null);
      setSdFormOpen(false);
      showToast(t.addedToast, "heart");
    } catch (err) {
      showToast(err.message, "info");
    }
  };

  const handleDeleteSpecialDay = (sd) => {
    if (!spaceId) return;
    Alert.alert("", t.sdDeleteConfirm.replace("{t}", sdTitle(sd, t)), [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await api.removeSpecialDay(spaceId, sd.id);
            setSpecialDays((s) => s.filter((x) => x.id !== sd.id));
          } catch (err) {
            showToast(err.message, "info");
          }
        },
      },
    ]);
  };

  return (
    <PaperBg>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.h1}>{t.journalTitle}</Text>
          <View style={styles.streakPill}>
            <Heart size={13} color={C.pinkText} fill={C.pinkText} />
            <Text style={styles.streakPillText}>
              {streak} {t.streak}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <ModeToggle />
        </View>

        {mode === "pair" && !me?.pairId ? (
          <View style={[styles.section, { marginTop: 14 }]}>
            <PairingPrompt />
          </View>
        ) : (
          <>
            <View style={[styles.section, { marginTop: 10 }]}>
              <View style={styles.calCard}>
                <View style={styles.calNav}>
                  <Pressable onPress={() => stepMonth(-1)}>
                    <ChevronLeft size={19} color={C.inkSoft} />
                  </Pressable>
                  <Pressable onPress={() => setPickerOpen((p) => !p)} style={styles.calTitleBtn}>
                    <Text style={styles.calTitle}>
                      {lang === "ja" ? `${calY}年 ${t.months[calM]}` : `${t.months[calM]} ${calY}`}
                    </Text>
                    <ChevronDown size={16} color={C.pinkText} />
                  </Pressable>
                  <Pressable onPress={() => stepMonth(1)}>
                    <ChevronRight size={19} color={C.inkSoft} />
                  </Pressable>
                </View>

                {pickerOpen && (
                  <View style={styles.yearMonthPicker}>
                    <View style={styles.yearNav}>
                      <Pressable onPress={() => setCalY((y) => y - 1)}>
                        <ChevronLeft size={17} color={C.inkSoft} />
                      </Pressable>
                      <Text style={styles.yearLabel}>{lang === "ja" ? `${calY}年` : calY}</Text>
                      <Pressable onPress={() => setCalY((y) => y + 1)}>
                        <ChevronRight size={17} color={C.inkSoft} />
                      </Pressable>
                    </View>
                    <View style={styles.monthGrid}>
                      {t.monthsShort.map((m, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            setCalM(i);
                            setPickerOpen(false);
                          }}
                          style={[styles.monthBtn, i === calM && styles.monthBtnSel]}
                        >
                          <Text style={[styles.monthBtnLabel, { color: i === calM ? "#fff" : C.ink }]}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.weekdayRow}>
                  {t.weekdays.map((w, i) => (
                    <Text key={i} style={styles.weekdayLabel}>
                      {w}
                    </Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {cells.map((day, i) => {
                    if (!day) return <View key={i} style={styles.cell} />;
                    const dIso = isoOf(new Date(calY, calM, day));
                    const isToday = dIso === todayIso;
                    const en = entries[dIso];
                    const filled = !!(en && (en.happy || en.mind || en.next));
                    const sds = sdForDate(dIso);
                    const isFuture = dIso > todayIso;
                    return (
                      <Pressable
                        key={i}
                        disabled={isFuture}
                        onPress={() => (isToday ? router.push("/(tabs)/today") : router.push(`/entry/${dIso}`))}
                        style={[styles.cell, isToday && styles.cellToday, filled && styles.cellFilled]}
                      >
                        <Text style={[styles.cellText, isFuture && styles.cellTextFuture, filled && styles.cellTextFilled]}>{day}</Text>
                        {sds.length > 0 && <Heart size={7} color={C.pinkText} fill={C.pinkText} style={{ marginTop: 1 }} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.section, { marginTop: 6 }]}>
              <View style={styles.sdCard}>
                <View style={styles.sdHeader}>
                  <Text style={styles.sdTitle}>{t.specialDays}</Text>
                  <Pressable onPress={openAddForm} style={styles.sdAddBtn}>
                    {!isPremium && specialDays.length >= 1 ? (
                      <Lock size={14} color={C.pinkText} />
                    ) : (
                      <Plus size={16} color={C.pinkText} style={{ transform: [{ rotate: sdFormOpen ? "45deg" : "0deg" }] }} />
                    )}
                  </Pressable>
                </View>

                {!isPremium && (
                  <Text style={styles.sdLimitNote}>{t.specialDaysLimitNote}</Text>
                )}

                {sdFormOpen && (
                  <View style={styles.sdForm}>
                    <TextInput
                      value={sdNewTitle}
                      onChangeText={setSdNewTitle}
                      placeholder={t.sdTitlePh}
                      placeholderTextColor="#B3A794"
                      style={styles.sdFormInput}
                    />
                    <DateField value={sdNewDate} onChange={setSdNewDate} placeholder={t.sdYearPh} />
                    <View style={styles.sdIconRow}>
                      {Object.entries(SD_ICONS).map(([id, Icon]) => (
                        <Pressable
                          key={id}
                          onPress={() => setSdNewIcon(id)}
                          style={[styles.sdIconBtn, sdNewIcon === id && styles.sdIconBtnSel]}
                        >
                          <Icon size={16} color={C.pinkText} />
                        </Pressable>
                      ))}
                      <Pressable
                        onPress={submitSpecialDay}
                        disabled={!sdNewTitle.trim() || !sdNewDate}
                        style={[styles.sdAddSubmit, sdNewTitle.trim() && sdNewDate ? styles.sdAddSubmitOn : styles.sdAddSubmitOff]}
                      >
                        <Text style={{ fontFamily: fonts.bodyExtraBold, fontSize: 13.5, color: sdNewTitle.trim() && sdNewDate ? "#fff" : C.inkSoft }}>
                          {t.add}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                <View>
                  {specialDays
                    .slice()
                    .sort((a, b) => sdCountdown(a, todayIso) - sdCountdown(b, todayIso))
                    .map((sd, i, arr) => {
                      const Icon = SD_ICONS[sd.icon] || Heart;
                      const n = sdCountdown(sd, todayIso);
                      return (
                        <View key={sd.id} style={[styles.sdRow, i < arr.length - 1 && styles.sdRowBorder]}>
                          <View style={styles.sdRowIcon}>
                            <Icon size={15} color={C.pinkText} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sdRowTitle} numberOfLines={1}>
                              {sdTitle(sd, t)}
                            </Text>
                            <Text style={styles.sdRowDate}>{sdLabel(sd.date, lang, t.monthsShort)}</Text>
                          </View>
                          <Text style={[styles.sdRowCountdown, { color: n === 0 ? C.pinkText : C.inkSoft }]}>
                            {n === 0 ? t.todayWord : t.inDays.replace("{n}", n)}
                          </Text>
                          <Pressable onPress={() => handleDeleteSpecialDay(sd)} hitSlop={8} style={styles.sdDeleteBtn}>
                            <Trash2 size={15} color="#C0605C" />
                          </Pressable>
                        </View>
                      );
                    })}
                </View>
              </View>
            </View>
          </>
        )}

        <Text style={styles.privacyNote}>{t.privacyNote}</Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </PaperBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 },
  h1: { fontFamily: fonts.scriptSemiBold, fontSize: 34, lineHeight: 50, paddingVertical: 4, paddingRight: 10, color: C.ink },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  streakPillText: { fontFamily: fonts.bodyExtraBold, fontSize: 13, color: C.pinkText },
  section: { paddingHorizontal: 18 },
  calCard: { backgroundColor: C.card, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  calNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 6 },
  calTitleBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  calTitle: { fontFamily: fonts.scriptSemiBold, fontSize: 24, lineHeight: 36, paddingVertical: 3, paddingRight: 7, color: C.ink },
  yearMonthPicker: { backgroundColor: C.paper, borderRadius: 16, padding: 12, marginBottom: 12 },
  yearNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22, marginBottom: 10 },
  yearLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 16, color: C.ink },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  monthBtn: { width: "22%", paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: "#fff" },
  monthBtnSel: { backgroundColor: C.pinkDeep },
  monthBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  weekdayRow: { flexDirection: "row" },
  weekdayLabel: { flex: 1, textAlign: "center", fontFamily: fonts.bodyExtraBold, fontSize: 11, color: C.inkSoft, paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  cellToday: { borderWidth: 2, borderColor: C.pinkDeep },
  cellFilled: { backgroundColor: C.pink },
  cellText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: C.ink },
  cellTextFuture: { color: "#C9BEAC" },
  cellTextFilled: { color: C.pinkText, fontFamily: fonts.bodyExtraBold },
  sdCard: { backgroundColor: C.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.cardBorder, ...cardShadow },
  sdHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sdTitle: { fontFamily: fonts.scriptSemiBold, fontSize: 23, lineHeight: 34, paddingVertical: 3, paddingRight: 7, color: C.ink },
  sdAddBtn: { backgroundColor: C.pink, borderRadius: 999, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  sdLimitNote: { fontFamily: fonts.bodyRegular, fontSize: 12, color: C.inkSoft, marginBottom: 10 },
  sdForm: { backgroundColor: C.paper, borderRadius: 16, padding: 12, marginBottom: 12, gap: 9 },
  sdFormInput: { fontFamily: fonts.bodyRegular, fontSize: 14, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff", color: C.ink },
  sdIconRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  sdIconBtn: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  sdIconBtnSel: { borderWidth: 2, borderColor: C.pinkDeep, backgroundColor: C.pink },
  sdAddSubmit: { marginLeft: "auto", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 20 },
  sdAddSubmitOn: { backgroundColor: C.pinkDeep },
  sdAddSubmitOff: { backgroundColor: "#E9DFD2" },
  sdRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10 },
  sdRowBorder: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  sdRowIcon: { width: 32, height: 32, borderRadius: 999, backgroundColor: C.pink, alignItems: "center", justifyContent: "center" },
  sdRowTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: C.ink },
  sdRowDate: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: C.inkSoft },
  sdRowCountdown: { fontFamily: fonts.bodyExtraBold, fontSize: 12 },
  sdDeleteBtn: { marginLeft: 6, padding: 4 },
  privacyNote: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: C.inkSoft, textAlign: "center", marginHorizontal: 30, marginTop: 8 },
});
