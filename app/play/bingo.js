import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Share2 } from "lucide-react-native";
import PlayShell, { PlayButton, playStyles } from "../../components/play/PlayShell";
import FloatingHearts from "../../components/FloatingHearts";
import { C, fonts } from "../../lib/theme";
import { useApp } from "../../lib/appState";
import { playContent } from "../../lib/play/content";
import { bingoCard, bingoLines, monthKey } from "../../lib/play/logic";
import { getBingoMarks, setBingoMarks } from "../../lib/play/store";
import { shareCardImage } from "../../lib/play/share";
import { LOCALE_TAGS } from "../../lib/i18n";
import { track } from "../../lib/analytics";
import { EV } from "../../lib/events";

/* A 3×3 card of little things to do together, new each month and the same on
   both phones. Marks are kept per month on this device. */

export default function DiaryBingo() {
  const { t, lang, today, showToast } = useApp();
  const pool = playContent(lang).bingo;
  const key = monthKey(today);
  const card = bingoCard(key, pool.length);
  const [marks, setMarks] = useState([]);
  const [hearts, setHearts] = useState(false);
  const cardRef = useRef(null);
  const lines = bingoLines(marks);

  useEffect(() => {
    getBingoMarks(key).then(setMarks);
  }, [key]);

  let monthName = key;
  try {
    monthName = today.toLocaleDateString(LOCALE_TAGS[lang] || "en-US", { year: "numeric", month: "long" });
  } catch {
    // Fall back to "YYYY-MM".
  }

  const toggle = (pos) => {
    const next = marks.includes(pos) ? marks.filter((m) => m !== pos) : [...marks, pos];
    const before = bingoLines(marks);
    const after = bingoLines(next);
    setMarks(next);
    setBingoMarks(key, next);
    if (after > before) {
      setHearts(true);
      setTimeout(() => setHearts(false), 2400);
      track(EV.GAME_FINISHED, { game: "bingo", lines: after });
    }
  };

  const share = async () => {
    try {
      const ok = await shareCardImage(cardRef, { dialogTitle: t.plShare });
      if (ok) track(EV.GAME_SHARED, { game: "bingo", as: "image" });
      else showToast(t.shareUnavailable, "info");
    } catch {
      showToast(t.shareFailed, "info");
    }
  };

  return (
    <PlayShell footer={<PlayButton label={t.plShare} onPress={share} tone="ghost" icon={<Share2 size={18} color={C.pinkText} />} />}>
      <View ref={cardRef} collapsable={false} style={styles.sheet}>
        <Text style={styles.title}>{t.plBingoTitle.replace("{d}", monthName)}</Text>
        <Text style={playStyles.soft}>{lines > 0 ? `${t.plBingoWin} ${t.plBingoLines.replace("{s}", String(lines))}` : t.plBingoHint}</Text>
        <View style={styles.grid}>
          {card.map((itemIdx, pos) => {
            const on = marks.includes(pos);
            return (
              <Pressable key={pos} onPress={() => toggle(pos)} style={[styles.cell, on && styles.cellOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <Text style={[styles.cellText, on && styles.cellTextOn]}>{pool[itemIdx]}</Text>
                {on && <Text style={styles.stamp}>♥</Text>}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.brand}>
          <Image source={require("../../assets/icon.png")} style={styles.brandIcon} />
          <Text style={styles.brandName}>Futari</Text>
        </View>
      </View>
      <FloatingHearts active={hearts} />
    </PlayShell>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: C.paper, borderRadius: 22, paddingVertical: 8, gap: 10, alignSelf: "stretch" },
  title: { fontFamily: fonts.scriptBold, fontSize: 34, lineHeight: 46, paddingRight: 10, color: C.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  cell: { width: "31%", aspectRatio: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, borderColor: C.cardBorder, padding: 8, alignItems: "center", justifyContent: "center" },
  cellOn: { backgroundColor: C.pink, borderColor: C.pinkDeep },
  cellText: { fontFamily: fonts.bodyBold, fontSize: 13.5, lineHeight: 18, color: C.ink, textAlign: "center" },
  cellTextOn: { color: C.pinkText },
  stamp: { position: "absolute", top: 4, right: 8, fontSize: 15, color: C.pinkText },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-end" },
  brandIcon: { width: 22, height: 22, borderRadius: 6 },
  brandName: { fontFamily: fonts.scriptBold, fontSize: 20, lineHeight: 28, paddingRight: 6, color: C.ink },
});
