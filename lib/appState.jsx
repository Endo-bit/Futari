import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { T, LANGS, detectLang } from "./i18n";
import { useApi } from "./api";

const EMPTY = { happy: "", mind: "", mindTag: "us", next: "", mood: null, promptAnswer: "", quizChoice: null };

export const isoOf = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const fromIso = (s) => new Date(s + "T00:00:00");

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const api = useApi();
  const { isSignedIn } = useAuth();

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
  useEffect(() => {
    AsyncStorage.getItem("futari_tutorial_seen").then((seen) => {
      if (!seen) setTutorialOpen(true);
    });
  }, []);
  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    setTutorialStep(0);
    AsyncStorage.setItem("futari_tutorial_seen", "1").catch(() => {});
  }, []);
  const openTutorial = useCallback(() => {
    setTutorialStep(0);
    setTutorialOpen(true);
  }, []);

  const value = {
    api,
    lang, setLang, t,
    today, todayIso,
    me, setMe, refreshMe,
    mode, setMode, spaceId, partnerName,
    entries, setEntries, getEntry, patchEntry,
    pairToday, setPairToday, refreshPairToday,
    specialDays, setSpecialDays,
    wroteToday, streak,
    toast, showToast,
    tutorialOpen, tutorialStep, setTutorialStep, openTutorial, closeTutorial,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
