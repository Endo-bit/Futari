export const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

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
