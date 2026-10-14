import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCalendars } from "expo-localization";
import {
  canDeliver,
  cancelReminderSeries,
  notificationAccess,
  pushTokenIfAllowed,
  requestNotificationAccess,
  scheduleReminderSeries,
} from "./pushNotifications";
import { promptFor } from "./dailyContent";
import { isoOf } from "./format";
import { track } from "./analytics";
import { EV } from "./events";

/* The daily reminder, in one place.

   It was in two before, and they disagreed. The app scheduled a local
   notification at a time the user picked; the server ran a cron at a fixed
   12:00 UTC and pushed to anyone with reminderOn — 9pm in Tokyo, 4am on the US
   west coast — using a reminderTime it was never sent and dropped on the floor.

   The reminder is now entirely on the device: a week of one-off notifications,
   each carrying that day's question, re-armed whenever the app is opened and
   leaving out a day that has already been written on. Two quieter ones follow
   after ten and fourteen days, for someone who has drifted away. The server is
   told `reminderLocal`, so its own hourly reminder push leaves this device's
   user alone instead of nudging them a second time.

   It is asked for during onboarding, before an account exists, which is why
   none of the scheduling needs the api. Declining there still gets iOS's quiet
   "provisional" delivery — notification centre only — so nobody is left with
   no way back. */

export const REMINDER_ON_KEY = "futari_reminder_on";
export const REMINDER_TIME_KEY = "futari_reminder_time";
export const DEFAULT_REMINDER_TIME = "21:00";

/** IANA zone, e.g. "Asia/Tokyo". Null if the platform won't say. */
export function deviceTimeZone() {
  try {
    return getCalendars()?.[0]?.timeZone || null;
  } catch {
    return null;
  }
}

function parseTime(time) {
  const [h, m] = String(time || DEFAULT_REMINDER_TIME).split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 21, minute: Number.isFinite(m) ? m : 0 };
}

export async function readLocalPrefs() {
  const [on, time] = await Promise.all([
    AsyncStorage.getItem(REMINDER_ON_KEY).catch(() => null),
    AsyncStorage.getItem(REMINDER_TIME_KEY).catch(() => null),
  ]);
  return { on: on === "1", onKnown: on != null, time: time || DEFAULT_REMINDER_TIME };
}

const SERIES_DAYS = 7;
const COMEBACK_DAYS = [10, 14];

/** The notifications to schedule from `now`: a week of daily questions, then two gentle check-ins. */
export function buildReminderSeries({ t, time, paired = false, skipToday = false, now = new Date() }) {
  const { hour, minute } = parseTime(time);
  const at = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const items = [];
  for (let i = 0; i < SERIES_DAYS; i++) {
    if (i === 0 && skipToday) continue;
    const date = at(i);
    if (date <= now) continue;
    const prompt = promptFor(t, paired ? "pair" : "personal", isoOf(date), null);
    items.push({ date, content: { title: t.notifPromptTitle, body: prompt } });
  }
  for (const days of COMEBACK_DAYS) {
    items.push({ date: at(days), content: { title: "Futari", body: t.notifComebackBody } });
  }
  return items;
}

/** Re-arms the series from today. A no-op (beyond clearing it) while the reminder is off. */
export async function armReminders({ t, paired = false, skipToday = false }) {
  const { on, time } = await readLocalPrefs();
  if (!on || !canDeliver(await notificationAccess())) {
    if (!on) await cancelReminderSeries();
    return false;
  }
  await scheduleReminderSeries(buildReminderSeries({ t, time, paired, skipToday }));
  return true;
}

/**
 * Turns the reminder on without an account: asks the OS (quietly, with
 * `provisional`) and schedules. Returns the resulting access state; anything
 * other than "granted" / "provisional" means nothing was turned on.
 */
export async function enableReminderLocal({ t, time = DEFAULT_REMINDER_TIME, provisional = false, source, paired = false }) {
  track(EV.NOTIF_PROMPTED, { source, provisional });
  const access = await requestNotificationAccess({ provisional });
  if (!canDeliver(access)) {
    track(EV.NOTIF_DENIED, { source });
    return access;
  }
  track(access === "provisional" ? EV.NOTIF_PROVISIONAL : EV.NOTIF_GRANTED, { source });
  await AsyncStorage.multiSet([
    [REMINDER_ON_KEY, "1"],
    [REMINDER_TIME_KEY, time],
  ]).catch(() => {});
  await armReminders({ t, paired });
  track(EV.REMINDER_ENABLED, { time, source, provisional: access === "provisional" });
  return access;
}

/**
 * The server's copy of the reminder settings, plus this device's push token.
 * Sent once per launch: the time zone may have changed since, and a token taken
 * before sign-in (or under provisional access) has to reach the server for the
 * partner-wrote push to have anywhere to go.
 */
export async function syncNotificationsToServer({ api }) {
  const { on, time } = await readLocalPrefs();
  // The server overwrites revealNotifOn with whatever is sent, so send back what
  // it already has rather than a default that would undo the user's choice.
  const current = await api.getNotificationPrefs().catch(() => null);
  if (!current) return;
  await api
    .saveNotificationPrefs({
      reminderOn: on,
      reminderLocal: true,
      revealNotifOn: current.revealNotifOn !== false,
      reminderTime: time,
      timeZone: deviceTimeZone(),
    })
    .catch(() => {});
  const token = await pushTokenIfAllowed();
  if (token) await api.saveExpoPushToken(token).catch(() => {});
}

/**
 * Settings' switch: the user asked outright, so this asks for full permission.
 * Returns false when it was refused — the caller decides what to say, and
 * nothing is written, so the switch doesn't end up reading "on" while the OS
 * silently drops every notification.
 */
export async function enableReminder({ api, t, time = DEFAULT_REMINDER_TIME, revealNotifOn = true, source, paired }) {
  const access = await enableReminderLocal({ t, time, source, paired });
  if (access !== "granted") return false;
  await api
    .saveNotificationPrefs({ reminderOn: true, reminderLocal: true, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  const token = await pushTokenIfAllowed();
  if (token) await api.saveExpoPushToken(token).catch(() => {});
  return true;
}

export async function disableReminder({ api, time = DEFAULT_REMINDER_TIME, revealNotifOn = true }) {
  await cancelReminderSeries();
  await AsyncStorage.setItem(REMINDER_ON_KEY, "0").catch(() => {});
  await api
    .saveNotificationPrefs({ reminderOn: false, reminderLocal: true, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  track(EV.REMINDER_DISABLED);
}

/** Changing the hour: reschedule locally and tell the server, in that order. */
export async function changeReminderTime({ api, t, time, on, revealNotifOn = true, paired }) {
  await AsyncStorage.setItem(REMINDER_TIME_KEY, time).catch(() => {});
  if (on) await armReminders({ t, paired });
  api
    .saveNotificationPrefs({ reminderOn: !!on, reminderLocal: true, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  track(EV.REMINDER_TIME_CHANGED, { time });
}
