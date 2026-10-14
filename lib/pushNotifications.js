import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  // shouldShowAlert was removed in SDK 57 — a banner and a list entry are now
  // asked for separately, and passing the old key does nothing.
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/* Where the OS stands on notifications, in the four states the app cares about.

   "provisional" is iOS's quiet delivery: granted without ever showing the
   permission prompt, notifications land in Notification Center with no banner or
   sound. It is what someone who taps "Not now" during onboarding gets, so that
   the app still has some way back to them — before this, a person who declined
   (or who closed the app before the prompt was ever reached) was unreachable
   for good. expo-notifications reports it as granted:false, hence the check. */
export async function notificationAccess() {
  if (!Device.isDevice) return "denied";
  const s = await Notifications.getPermissionsAsync();
  if (s.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return "provisional";
  if (s.granted || s.status === "granted") return "granted";
  if (s.status === "denied") return "denied";
  return "undetermined";
}

/** True when something we schedule will be delivered, loudly or quietly. */
export function canDeliver(access) {
  return access === "granted" || access === "provisional";
}

/**
 * Asks the OS. With `provisional`, asks for quiet delivery only, which iOS grants
 * without showing anything. Returns the resulting access state.
 */
export async function requestNotificationAccess({ provisional = false } = {}) {
  if (!Device.isDevice) return "denied";
  await ensureAndroidChannel();
  const current = await notificationAccess();
  if (current === "granted" || current === "denied") return current;
  if (provisional && current === "provisional") return current;
  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: provisional },
  });
  return notificationAccess();
}

/** Requests full (non-provisional) permission — used when the user asked for reminders outright. */
export async function ensureNotificationPermission() {
  return (await requestNotificationAccess()) === "granted";
}

async function expoPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

/** Requests permission and returns an Expo push token, or null if unavailable/denied. Needed only for server-driven (reveal-time) pushes. */
export async function registerForPushNotifications() {
  if (!(await ensureNotificationPermission())) return null;
  return expoPushToken();
}

/** A push token without ever showing a prompt — provisional access is enough for quiet pushes. */
export async function pushTokenIfAllowed() {
  if (!canDeliver(await notificationAccess())) return null;
  return expoPushToken().catch(() => null);
}

/* The reminder is a short series of one-off notifications rather than one DAILY
   trigger, so each can carry that day's actual question instead of the same
   "your diary is waiting" every night — and so a day already written on can be
   left out. The series is re-armed every time the app is opened. */
const LEGACY_REMINDER_ID = "futari-daily-reminder";
const SERIES_PREFIX = "futari-reminder-";

/** Replaces the whole reminder series with `items`: [{ date, content }]. */
export async function scheduleReminderSeries(items) {
  await cancelReminderSeries();
  for (let i = 0; i < items.length; i++) {
    const { date, content } = items[i];
    await Notifications.scheduleNotificationAsync({
      identifier: `${SERIES_PREFIX}${i}`,
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }).catch(() => {});
  }
}

export async function cancelReminderSeries() {
  await Notifications.cancelScheduledNotificationAsync(LEGACY_REMINDER_ID).catch(() => {});
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier?.startsWith(SERIES_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
}

const INVITE_NUDGE_ID = "futari-invite-nudge";

/** One reminder, a day after an invite went out, in case the link got lost. */
export async function scheduleInviteNudge(content, date) {
  await Notifications.cancelScheduledNotificationAsync(INVITE_NUDGE_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: INVITE_NUDGE_ID,
    content: { ...content, data: { url: "futari://invite" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  }).catch(() => {});
}

export async function cancelInviteNudge() {
  await Notifications.cancelScheduledNotificationAsync(INVITE_NUDGE_ID).catch(() => {});
}
