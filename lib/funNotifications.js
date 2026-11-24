import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { fromIso } from "./format";

/* The lighter notifications that aren't the daily question: anniversaries,
   the new month's bingo card, the day before the trial ends, and a "come
   play" nudge for someone who has drifted away. All local, all re-armed on
   every launch (so the nudge only ever fires after days of silence), and
   never more than one on the same day. */

const PREFIX = "futari-fun-";
const COMEBACK_DAYS = 5;
const ANNIV_LOOKAHEAD_DAYS = 60;

function at(date, h, m = 0) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Day counts worth celebrating: 100, 200, 300, 365 and every hundred after. */
export function nextMilestones(startIso, now = new Date(), lookaheadDays = ANNIV_LOOKAHEAD_DAYS) {
  if (!startIso) return [];
  const start = fromIso(startIso);
  if (Number.isNaN(start.getTime())) return [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsed = Math.floor((today - start) / 86400000);
  const out = [];
  for (let n = elapsed + 1; n <= elapsed + lookaheadDays; n++) {
    if (n > 0 && (n % 100 === 0 || n === 365 || n === 730 || n === 1095)) {
      out.push({ days: n, date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + n) });
    }
  }
  return out;
}

/** What to schedule, as plain data (tested in lib/funNotifications.test). */
export function buildFunSeries({ t, now = new Date(), startDate = null, trialEndsAt = null, trialActive = false }) {
  const items = [];
  const fill = (s, n) => s.replaceAll("{s}", String(n));

  for (const m of nextMilestones(startDate, now)) {
    items.push({ date: at(m.date, 10), content: { title: fill(t.nfAnnivTitle, m.days), body: fill(t.nfAnnivBody, m.days), data: { url: "futari://today" } } });
  }

  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  items.push({ date: at(firstOfNext, 12), content: { title: t.nfBingoTitle, body: t.nfBingoBody, data: { url: "futari://play/bingo" } } });

  if (trialActive && trialEndsAt) {
    const end = new Date(trialEndsAt);
    const dayBefore = at(new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1), 19);
    if (dayBefore > now) items.push({ date: dayBefore, content: { title: t.nfTrialEndTitle, body: t.nfTrialEndBody } });
  }

  const comeback = at(new Date(now.getFullYear(), now.getMonth(), now.getDate() + COMEBACK_DAYS), 20, 30);
  items.push({ date: comeback, content: { title: "Futari", body: t.nfComebackPlay, data: { url: "futari://play" } } });

  // One a day at most: keep the first item for each day, in the order above.
  const seen = new Set();
  return items
    .filter((it) => it.date > now)
    .filter((it) => {
      const k = dayKey(it.date);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

export async function armFunNotifications(args) {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier?.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
  const items = buildFunSeries(args);
  for (let i = 0; i < items.length; i++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${i}`,
      content: items[i].content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: items[i].date },
    }).catch(() => {});
  }
}
