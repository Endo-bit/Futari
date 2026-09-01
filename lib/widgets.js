import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fromIso, isoOf } from "./format";
import { promptFor, quizFor } from "./dailyContent";
import { sdCountdown, sdTitle } from "../components/SdBanner";

/* What the Home/Lock Screen widget shows is the user's choice, made in Settings and
   remembered on the device. The widget extension itself holds no logic — this module
   renders the chosen mode into plain strings and pushes them across, so the widget
   always speaks the app's current language and never has to fetch anything. */

export const WIDGET_MODE_KEY = "futari_widget_mode";
export const WIDGET_SPECIAL_DAY_KEY = "futari_widget_special_day";

export const WIDGET_MODES = ["partnerNext", "prompt", "quiz", "daysTogether", "anniversary"];
export const DEFAULT_WIDGET_MODE = "prompt";

/** The widget is iOS-only; on anything else every call here is a no-op. */
function loadWidget() {
  if (Platform.OS !== "ios") return null;
  try {
    return require("../widgets/FutariWidget").default;
  } catch (err) {
    // No development build yet (Expo Go), or the extension isn't in this binary.
    console.warn("[widget] not available:", err?.message || err);
    return null;
  }
}

export async function getWidgetMode() {
  const saved = await AsyncStorage.getItem(WIDGET_MODE_KEY).catch(() => null);
  return WIDGET_MODES.includes(saved) ? saved : DEFAULT_WIDGET_MODE;
}

export async function setWidgetMode(mode) {
  await AsyncStorage.setItem(WIDGET_MODE_KEY, mode).catch(() => {});
}

export async function getWidgetSpecialDayId() {
  return AsyncStorage.getItem(WIDGET_SPECIAL_DAY_KEY).catch(() => null);
}

export async function setWidgetSpecialDayId(id) {
  if (id) await AsyncStorage.setItem(WIDGET_SPECIAL_DAY_KEY, id).catch(() => {});
  else await AsyncStorage.removeItem(WIDGET_SPECIAL_DAY_KEY).catch(() => {});
}

function daysBetween(fromIsoDate, toIsoDate) {
  const a = fromIso(fromIsoDate);
  const b = fromIso(toIsoDate);
  return Math.round((b - a) / 86400000);
}

/**
 * Turns the chosen mode into the four strings the widget draws.
 * Pure — every branch returns a complete set, so a missing input degrades into a
 * gentle "nothing here yet" line rather than a blank widget.
 */
export function buildWidgetProps({ mode, t, todayIso, entry, pairToday, me, appMode, specialDays, specialDayId, partnerName }) {
  const empty = { label: "Futari", title: t.widgetEmpty, body: "", value: "", unit: "" };

  switch (mode) {
    case "partnerNext": {
      const text = pairToday?.partner?.next || me?.nextPlan || "";
      return {
        label: t.widgetLabelPartnerNext.replace("{n}", partnerName),
        title: text || t.widgetEmptyPartnerNext.replace("{n}", partnerName),
        body: "",
        value: "",
        unit: "",
      };
    }

    case "prompt": {
      return {
        label: t.widgetLabelPrompt,
        title: promptFor(t, appMode, todayIso, entry),
        body: entry?.promptAnswer || "",
        value: "",
        unit: "",
      };
    }

    case "quiz": {
      return {
        label: t.widgetLabelQuiz,
        title: quizFor(t, todayIso, pairToday?.mine),
        body: "",
        value: "",
        unit: "",
      };
    }

    case "daysTogether": {
      if (!me?.startDate) return { ...empty, label: t.widgetLabelDaysTogether, title: t.widgetEmptyStartDate };
      return {
        label: t.widgetLabelDaysTogether,
        title: "",
        body: "",
        value: String(daysBetween(me.startDate, todayIso)),
        unit: t.widgetDaysUnit,
      };
    }

    case "anniversary": {
      const sd = specialDays?.find((s) => s.id === specialDayId) || specialDays?.[0];
      if (!sd) return { ...empty, label: t.widgetLabelAnniversary, title: t.widgetEmptySpecialDay };
      const n = sdCountdown(sd, todayIso);
      return {
        label: sdTitle(sd, t),
        title: n === 0 ? t.todayWord : "",
        body: "",
        value: n === 0 ? "" : String(n),
        unit: t.widgetDaysLeftUnit,
      };
    }

    default:
      return empty;
  }
}

/**
 * Pushes the current content to the widget. Safe to call often — WidgetKit
 * coalesces reloads, and every failure path is swallowed so a widget problem can
 * never take the app down with it.
 */
export async function syncWidget(context) {
  const widget = loadWidget();
  if (!widget) return;
  try {
    const mode = context.mode || (await getWidgetMode());
    const specialDayId = context.specialDayId !== undefined ? context.specialDayId : await getWidgetSpecialDayId();
    const props = buildWidgetProps({ ...context, mode, specialDayId });
    // A single entry for now, plus one at tomorrow's midnight so day counters and
    // the daily prompt roll over on their own even if the app is never opened.
    const tomorrow = fromIso(context.todayIso);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = isoOf(tomorrow);
    widget.updateTimeline([
      { date: new Date(), props },
      { date: tomorrow, props: buildWidgetProps({ ...context, mode, specialDayId, todayIso: tomorrowIso, entry: null }) },
    ]);
  } catch (err) {
    console.warn("[widget] sync failed:", err?.message || err);
  }
}
