import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getCapsules, saveCapsules } from "./store";
import { addMonths } from "./logic";

/* Time capsules: a letter sealed on this device, opened on a chosen day. A
   local notification is scheduled for that morning so the moment isn't
   missed; if notifications are off, the capsule simply shows as ready. */

const NOTIF_PREFIX = "futari-capsule-";

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function sealCapsule({ text, months, t }) {
  const now = new Date();
  const opens = addMonths(now, months);
  opens.setHours(9, 0, 0, 0);
  const capsule = { id: newId(), text: text.trim(), createdAt: now.toISOString(), opensAt: opens.toISOString(), openedAt: null };
  const list = await getCapsules();
  await saveCapsules([capsule, ...list]);
  if (Platform.OS !== "web") {
    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIF_PREFIX}${capsule.id}`,
      content: { title: t.nfCapsuleTitle, body: t.nfCapsuleBody, data: { url: "futari://play/capsule" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: opens },
    }).catch(() => {});
  }
  return capsule;
}

export async function markCapsuleOpened(id) {
  const list = await getCapsules();
  const next = list.map((c) => (c.id === id && !c.openedAt ? { ...c, openedAt: new Date().toISOString() } : c));
  await saveCapsules(next);
  return next;
}
