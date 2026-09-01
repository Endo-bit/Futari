import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  const { isPremium, isLoading: entitlementLoading, isAvailable: entitlementAvailable } = useEntitlement();

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

  const today = useMemo(() => new Date(), []);
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

  // Pairing is a premium feature — if entitlement lapses (trial/subscription ended,
  // refunded, etc.) while still paired, drop the pairing automatically instead of
  // silently leaving premium-gated access in place. Only act once RevenueCat has
  // actually reported a real (non-loading) status — on builds where purchases aren't
  // available at all (Expo Go, web preview) isPremium is always false, and that must
  // never be read as "the subscription ended".
  useEffect(() => {
    if (!entitlementAvailable || entitlementLoading || isPremium || !me?.pairId) return;
    api
      .unpair()
      .then(() => refreshMe())
      .then(() => showToast(t.autoUnpairedToast, "info"))
      .catch(() => {});
  }, [isPremium, entitlementLoading, entitlementAvailable, me?.pairId]); // eslint-disable-line

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
