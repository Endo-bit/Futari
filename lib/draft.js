import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* Today's page as it is being written, kept on the phone until "Save".

   Until 1.0.8 every field went to the server the moment it was written, so a
   half-written page could already tell the partner "they finished writing".
   Now nothing leaves the phone until the page is saved; the draft survives
   closing the app (it lives in AsyncStorage, one key per space and day). */

export const DRAFT_FIELDS = ["promptAnswer", "happy", "mind", "mindTag", "next", "mood"];
/** The four things that must be written before the page can be saved. */
export const REQUIRED_FIELDS = ["promptAnswer", "happy", "mind", "next"];

const keyOf = (spaceId, dateIso) => `futari_draft_${spaceId || "none"}_${dateIso}`;

export function draftComplete(draft) {
  return REQUIRED_FIELDS.every((f) => String(draft?.[f] || "").trim().length > 0);
}

export function useDraft(spaceId, dateIso) {
  const [draft, setDraft] = useState({});
  const key = keyOf(spaceId, dateIso);
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    let live = true;
    setDraft({});
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!live || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") setDraft(parsed);
        } catch {
          // A corrupt draft is dropped rather than crashing the page.
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);

  const setField = useCallback((field, value) => {
    setDraft((d) => {
      const next = { ...d, [field]: value };
      AsyncStorage.setItem(keyRef.current, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setDraft({});
    AsyncStorage.removeItem(keyRef.current).catch(() => {});
  }, []);

  return { draft, setField, clear };
}
