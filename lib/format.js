/* Day-of-year from the calendar fields only.
   The old `(d - new Date(y, 0, 0)) / 86400000` version mixed a midnight-based
   reference with an arbitrary time-of-day, so in any timezone that observes DST
   the same calendar date resolved to two different numbers: `new Date()` (today,
   some time in the afternoon) kept its day, while `fromIso(date)` (a past day,
   local midnight) lost an hour and floored down to the previous one. That is why
   a day's prompt / couple question silently changed when it was reopened from the
   calendar. Date.UTC() has no DST, so the same Y/M/D always maps to the same day. */
export const dayOfYear = (d) =>
  Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);

/** Local calendar date as `YYYY-MM-DD`. */
export const isoOf = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
/** `YYYY-MM-DD` back to local midnight. */
export const fromIso = (s) => new Date(s + "T00:00:00");

const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  fr: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
  de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  it: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"],
  pt: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
};

/* Languages that write a date largest-part-first, as numbers with a marker
   after each. Everything that prints a date goes through the helpers below —
   this used to be `lang === "ja"` repeated in five files, which is one check
   per file to forget when a language like this is added. */
const YMD = {
  ja: { y: "年", m: "月", d: "日", gap: "", weekday: (w) => `（${w}）` },
  zh: { y: "年", m: "月", d: "日", gap: "", weekday: (w) => ` 周${w}` },
  ko: { y: "년", m: "월", d: "일", gap: " ", weekday: (w) => ` (${w})` },
};

/** "9月30日" / "9월 30일" / "Sep 30" */
export function monthDayLabel(d, t, lang) {
  const f = YMD[lang];
  if (f) return `${d.getMonth() + 1}${f.m}${f.gap}${d.getDate()}${f.d}`;
  return `${t.monthsShort[d.getMonth()]} ${d.getDate()}`;
}

/** "2026年9月30日" / "2026년 9월 30일" / "Sep 30, 2026" */
export function fullDateLabel(d, t, lang) {
  const f = YMD[lang];
  if (f) return `${d.getFullYear()}${f.y}${f.gap}${monthDayLabel(d, t, lang)}`;
  return `${monthDayLabel(d, t, lang)}, ${d.getFullYear()}`;
}

/** "2026年" / "2026년" / "2026" */
export function yearLabel(year, lang) {
  const f = YMD[lang];
  return f ? `${year}${f.y}` : String(year);
}

/** "2026年 9月" / "2026년 9월" / "September 2026" */
export function yearMonthLabel(year, month, t, lang) {
  if (YMD[lang]) return `${yearLabel(year, lang)} ${t.months[month]}`;
  return `${t.months[month]} ${year}`;
}

/** "9月30日（水）" / "9月30日 周三" / "9월 30일 (수)" / "Wed, Sep 30" */
export function dateLabel(d, t, lang) {
  const f = YMD[lang];
  if (f) return `${monthDayLabel(d, t, lang)}${f.weekday(t.weekdays[d.getDay()])}`;
  const wd = WEEKDAYS[lang] || WEEKDAYS.en;
  return `${wd[d.getDay()]}, ${monthDayLabel(d, t, lang)}`;
}

/** The heading of a past day's page: "9月30日のページ" / "Page of 30/09/2026". */
export function pageTitle(d, t, lang, localeTag) {
  if (t.pageOfDate) return t.pageOfDate.replace("{d}", monthDayLabel(d, t, lang));
  return `${t.pageOf} ${d.toLocaleDateString(localeTag || lang)}`;
}
