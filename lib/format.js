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
};

export function dateLabel(d, t, lang) {
  if (lang === "ja") return `${d.getMonth() + 1}月${d.getDate()}日（${t.weekdays[d.getDay()]}）`;
  const wd = WEEKDAYS[lang];
  return `${wd[d.getDay()]}, ${t.monthsShort[d.getMonth()]} ${d.getDate()}`;
}
