import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/expo";
import { T, LANGS, detectLang } from "./i18n";
import { isoOf, fromIso } from "./format";
import { useApi } from "./api";
import { useEntitlement } from "./entitlement";
import {
  DEFAULT_WIDGET_MODE,
  getWidgetMode,
  getWidgetSpecialDayId,
  setWidgetMode,
  setWidgetSpecialDayId,
  syncWidget,
} from "./widgets";

const EMPTY = { happy: "", mind: "", mindTag: "us", next: "", mood: null, promptAnswer: "", quizChoice: null, prompt: "", quizQuestion: "" };

/* Defined in ./format so date helpers have one home and modules that need them
   (dailyContent, widgets) don't have to import from this provider. Re-exported here
   because most screens already reach for them alongside `useApp`. */
export { isoOf, fromIso };

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { isPremium } = useEntitlement();

  const [lang, setLangState] = useState("en");
  useEffect(() => {
    AsyncStorage.getItem("futari_lang").then((saved) => {
      setLangState(saved && LANGS.includes(saved) ? saved : detectLang());
    });
  }, []);
  const t = T[lang];
  const setLang = useCallback(
    (l) => {
      setLangState(l);
      AsyncStorage.setItem("futari_lang", l).catch(() => {});
      api.saveUserLang(l).catch(() => {});
    },
    [api]
  );

  /* Not a one-time useMemo: the app is often left open (foregrounded, tab not
     closed) across midnight, and a stale `today` silently kept yesterday's page
     as "today's page". Re-check on foreground for an instant correction after
     backgrounding, and poll while foregrounded to catch the rollover even if the
     app is never backgrounded at all. */
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refreshIfDayChanged = () => {
      setToday((prev) => (isoOf(prev) === isoOf(new Date()) ? prev : new Date()));
    };
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshIfDayChanged();
    });
    const interval = setInterval(refreshIfDayChanged, 60000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);
  const todayIso = isoOf(today);

  const [me, setMe] = useState(null);
  const [mode, setModeState] = useState("personal");
  const refreshMe = useCallback(async () => {
    const data = await api.getMe();
    setMe(data);
    if (!data.pairId) setModeState("personal");
    return data;
  }, [api]);
  useEffect(() => {
    if (!isSignedIn) return;
    refreshMe().then((data) => {
      if (data.pairId) setModeState("pair");
    });
  }, [isSignedIn]); // eslint-disable-line

  const setMode = useCallback((m) => setModeState(m), []);
  const spaceId = me ? (mode === "pair" && me.pairSpaceId ? me.pairSpaceId : me.personalSpaceId) : null;
  const partnerName = me?.partner?.firstName || t.partnerFallback;
  const myName = user?.firstName || t.me;
  const describeQuizChoice = useCallback(
    (choice, isMine) => {
      if (!choice) return t.homeNotAnswered;
      if (isMine) return choice === "me" ? myName : partnerName;
      return choice === "me" ? partnerName : myName;
    },
    [t, myName, partnerName]
  );

  const [entries, setEntries] = useState({});
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    api.listMyEntries(spaceId).then((data) => {
      if (!cancelled) setEntries(data);
    });
    return () => {
      cancelled = true;
    };
  }, [spaceId]); // eslint-disable-line

  const getEntry = useCallback((dIso) => entries[dIso] || EMPTY, [entries]);
  const patchEntry = useCallback(
    (dIso, patch) => {
      setEntries((es) => ({ ...es, [dIso]: { ...(es[dIso] || EMPTY), ...patch } }));
      if (!spaceId) return;
      api.saveEntry(spaceId, dIso, patch).then(() => {
        if (mode === "pair" && dIso === todayIso) refreshPairToday();
      });
    },
    [spaceId, mode, todayIso] // eslint-disable-line
  );

  const [pairToday, setPairToday] = useState(null);
  const refreshPairToday = useCallback(async () => {
    if (!me?.pairSpaceId) {
      setPairToday(null);
      return;
    }
    setPairToday(await api.getPairDay(me.pairSpaceId, todayIso));
  }, [api, me?.pairSpaceId, todayIso]);
  useEffect(() => {
    if (me?.pairSpaceId) refreshPairToday();
  }, [me?.pairSpaceId]); // eslint-disable-line

  const [specialDays, setSpecialDays] = useState([]);
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    api.listSpecialDays(spaceId).then((data) => {
      if (!cancelled) setSpecialDays(data);
    });
    return () => {
      cancelled = true;
    };
  }, [spaceId]); // eslint-disable-line

  const wroteToday = useCallback(() => {
    const e = getEntry(todayIso);
    return !!(e.happy || e.mind || e.next || e.promptAnswer);
  }, [getEntry, todayIso]);

  const streak = useMemo(() => {
    let n = 0;
    const d = new Date(today);
    if (!wroteToday()) d.setDate(d.getDate() - 1);
    while (true) {
      const e = entries[isoOf(d)];
      if (e && (e.happy || e.mind || e.next || e.promptAnswer)) {
        n++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return n;
  }, [entries, today]); // eslint-disable-line

  /* Home/Lock Screen widget. The chosen mode lives on the device (it's a per-phone
     preference, not per-account), and every input the widget can show is pushed
     across whenever it changes — the widget never talks to the network itself. */
  const [widgetMode, setWidgetModeState] = useState(DEFAULT_WIDGET_MODE);
  const [widgetSpecialDayId, setWidgetSpecialDayIdState] = useState(null);
  useEffect(() => {
    getWidgetMode().then(setWidgetModeState);
    getWidgetSpecialDayId().then(setWidgetSpecialDayIdState);
  }, []);
  const chooseWidgetMode = useCallback((m) => {
    setWidgetModeState(m);
    setWidgetMode(m);
  }, []);
  const chooseWidgetSpecialDay = useCallback((id) => {
    setWidgetSpecialDayIdState(id);
    setWidgetSpecialDayId(id);
  }, []);

  useEffect(() => {
    syncWidget({
      mode: widgetMode,
      specialDayId: widgetSpecialDayId,
      t,
      todayIso,
      entry: entries[todayIso] || null,
      pairToday,
      me,
      appMode: mode,
      specialDays,
      partnerName,
    });
  }, [widgetMode, widgetSpecialDayId, t, todayIso, entries, pairToday, me, mode, specialDays, partnerName]);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, icon = "check") => {
    setToast({ msg, icon });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  // Only the very first (auto-triggered) run of the tutorial pitches the pairing
  // trial — replays from Settings ("How Futari works") never should, regardless of
  // pairing status.
  const [tutorialIsFirstRun, setTutorialIsFirstRun] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("futari_tutorial_seen").then((seen) => {
      if (!seen) {
        setTutorialIsFirstRun(true);
        setTutorialOpen(true);
      }
    });
  }, []);
  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    setTutorialStep(0);
    AsyncStorage.setItem("futari_tutorial_seen", "1").catch(() => {});
  }, []);
  const openTutorial = useCallback(() => {
    setTutorialStep(0);
    setTutorialIsFirstRun(false);
    setTutorialOpen(true);
  }, []);

  /* Entitlement = a live subscription OR an unexpired free trial. The trial half
     is server state (users/<uid>.trialStartedAt), so it survives signing out,
     reinstalling and switching devices in a way RevenueCat's local cache does not. */
  const trialActive = !!me?.trialActive;
  const trialAvailable = !!me?.trialAvailable;
  const trialDaysLeft = me?.trialDaysLeft ?? 0;
  const trialDayIndex = me?.trialDayIndex ?? 0;
  const trialEndsAt = me?.trialEndsAt ?? null;
  // me.premiumActive is what RevenueCat's webhook last told the server. Trust
  // either source: the device may know about a purchase before the webhook lands,
  // and the server still knows after a sign-out clears the local cache.
  const entitled = isPremium || !!me?.premiumActive || trialActive;
  // Pairing is reachable while entitled, and also before a first-ever trial —
  // that is what lets a new couple pair without entering payment details.
  const canPair = entitled || trialAvailable;

  /* Releasing a lapsed pairing is the SERVER's job (the RevenueCat webhook, plus
     the daily cron that also enforces trial expiry). It used to be done here, and
     that was wrong: signing out clears the local RevenueCat cache, so isPremium
     briefly reads false while `me` still holds a pairing — and the app would
     unpair a perfectly valid subscriber on their way out. The client now only
     reflects what the server decided. */

  const value = {
    api,
    lang, setLang, t,
    today, todayIso,
    me, setMe, refreshMe,
    mode, setMode, spaceId, partnerName, myName, describeQuizChoice,
    entries, setEntries, getEntry, patchEntry,
    pairToday, setPairToday, refreshPairToday,
    specialDays, setSpecialDays,
    wroteToday, streak,
    isPremium, entitled, canPair,
    trialActive, trialAvailable, trialDaysLeft, trialDayIndex, trialEndsAt,
    widgetMode, chooseWidgetMode, widgetSpecialDayId, chooseWidgetSpecialDay,
    toast, showToast,
    tutorialOpen, tutorialStep, setTutorialStep, tutorialIsFirstRun, openTutorial, closeTutorial,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
