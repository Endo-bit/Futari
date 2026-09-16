import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCalendars } from "expo-localization";
import {
  ensureNotificationPermission,
  registerForPushNotifications,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "./pushNotifications";
import { track } from "./analytics";
import { EV } from "./events";

/* The daily reminder, in one place.

   It was in two before, and they disagreed. The app scheduled a local
   notification at a time the user picked; the server ran a cron at a fixed
   12:00 UTC and pushed to anyone with reminderOn — 9pm in Tokyo, 4am on the US
   west coast — using a reminderTime it was never sent and dropped on the floor.
   Now the chosen time and the device's time zone both go to the server, the cron
   runs hourly and only fires for people whose local clock has actually reached
   their time.

   The bigger fix is that reminderOn no longer defaults to off behind a switch in
   the fourth tab. A diary nobody is reminded to write is a diary nobody writes:
   the tutorial asks for this directly, while the reveal is still fresh. */

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

export function reminderContent(t) {
  return { title: t.reminderNotifTitle, body: t.reminderNotifBody };
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

/**
 * Turns the reminder on: asks for permission, schedules the on-device daily
 * notification, and tells the server when and in which zone to push.
 *
 * Returns false when permission was refused — the caller decides what to say,
 * and nothing is written, so the switch doesn't end up reading "on" while the OS
 * silently drops every notification.
 */
export async function enableReminder({ api, t, time = DEFAULT_REMINDER_TIME, revealNotifOn = true, source }) {
  track(EV.NOTIF_PROMPTED, { source });
  const granted = await ensureNotificationPermission();
  if (!granted) {
    track(EV.NOTIF_DENIED, { source });
    return false;
  }
  track(EV.NOTIF_GRANTED, { source });

  const { hour, minute } = parseTime(time);
  await scheduleDailyReminder(hour, minute, reminderContent(t));
  await AsyncStorage.multiSet([
    [REMINDER_ON_KEY, "1"],
    [REMINDER_TIME_KEY, time],
  ]).catch(() => {});

  await api
    .saveNotificationPrefs({ reminderOn: true, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});

  /* Permission is granted, so take the push token now. Waiting until someone
     opens Settings is what left most accounts unreachable: the partner-wrote
     nudge, the one notification that actually brings both people back, had
     nowhere to be delivered. */
  const token = await registerForPushNotifications().catch(() => null);
  if (token) await api.saveExpoPushToken(token).catch(() => {});

  track(EV.REMINDER_ENABLED, { time, source });
  return true;
}

export async function disableReminder({ api, time = DEFAULT_REMINDER_TIME, revealNotifOn = true }) {
  await cancelDailyReminder();
  await AsyncStorage.setItem(REMINDER_ON_KEY, "0").catch(() => {});
  await api
    .saveNotificationPrefs({ reminderOn: false, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  track(EV.REMINDER_DISABLED);
}

/** Re-arms the OS schedule on launch, and keeps the server's copy of the time honest. */
export async function resyncReminder({ api, t, revealNotifOn = true }) {
  const { on, time } = await readLocalPrefs();
  if (!on) return { on: false, time };
  const granted = await ensureNotificationPermission();
  if (!granted) return { on: false, time };
  const { hour, minute } = parseTime(time);
  await scheduleDailyReminder(hour, minute, reminderContent(t)).catch(() => {});
  api
    .saveNotificationPrefs({ reminderOn: true, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  return { on: true, time };
}

/** Changing the hour: reschedule locally and tell the server, in that order. */
export async function changeReminderTime({ api, t, time, on, revealNotifOn = true }) {
  await AsyncStorage.setItem(REMINDER_TIME_KEY, time).catch(() => {});
  if (on) {
    const { hour, minute } = parseTime(time);
    await scheduleDailyReminder(hour, minute, reminderContent(t)).catch(() => {});
  }
  api
    .saveNotificationPrefs({ reminderOn: !!on, revealNotifOn, reminderTime: time, timeZone: deviceTimeZone() })
    .catch(() => {});
  track(EV.REMINDER_TIME_CHANGED, { time });
}
