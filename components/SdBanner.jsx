import { View, Text, StyleSheet } from "react-native";
import { Heart, Cake, Star, PartyPopper } from "lucide-react-native";
import { C, fonts, cardShadow } from "../lib/theme";
import { useApp, fromIso } from "../lib/appState";

const SD_ICONS = { heart: Heart, cake: Cake, star: Star };

export function sdTitle(sd, t) {
  return sd.key ? t[sd.key === "anniv" ? "sdAnniv" : "sdBday"] : sd.title;
}
export function sdLabel(dIso, lang, monthsShort) {
  const d = fromIso(dIso);
  if (lang === "ja") return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${monthsShort[d.getMonth()]} ${d.getDate()}`;
}
export function sdMatches(sd, dIso) {
  return sd.date.slice(5) === dIso.slice(5);
}
export function sdCountdown(sd, todayIso) {
  const now = fromIso(todayIso);
  const [, m, d] = sd.date.split("-").map(Number);
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next - now) / 86400000);
}

export default function SdBanner({ dIso }) {
  const { specialDays, todayIso, t, lang } = useApp();
  const list = specialDays.filter((sd) => sdMatches(sd, dIso));
  if (!list.length) return null;
  const isToday = dIso === todayIso;

  return (
    <View style={{ gap: 8 }}>
      {list.map((sd) => {
        const Icon = SD_ICONS[sd.icon] || Heart;
        return (
          <View key={sd.id} style={styles.banner}>
            <View style={styles.iconCircle}>
              <Icon size={17} color={C.pinkText} />
            </View>
            <View>
              <Text style={styles.title}>
                {(isToday ? t.sdToday : t.sdOnThisDay).replace("{t}", sdTitle(sd, t))}
              </Text>
              <Text style={styles.date}>{sdLabel(sd.date, lang, t.monthsShort)}</Text>
            </View>
            <PartyPopper size={18} color={C.sun} style={{ marginLeft: "auto" }} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#F2E1D6", borderRadius: 18, paddingVertical: 13, paddingHorizontal: 16, ...cardShadow },
  iconCircle: { width: 34, height: 34, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 14.5, color: C.ink },
  date: { fontFamily: fonts.bodyBold, fontSize: 12, color: C.pinkText },
});
