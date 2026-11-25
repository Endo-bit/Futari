import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

/* The partner's comment on today's page (their reply and reactions).

   A comment that arrives after the page was opened is announced — "A comment
   came in! Want to see it?" — on Today and on Home, and shown once tapped.
   One that was already there when the page was opened is simply shown.
   "Seen" is remembered per day on this phone, by the comment's content, so a
   second comment is announced again. */

const keyOf = (spaceId, dateIso) => `futari_comment_seen_${spaceId || "none"}_${dateIso}`;

export function commentSignature(pairDay) {
  const reply = (pairDay?.partnerReply || "").trim();
  const reactions = (pairDay?.partnerReactions || []).join(",");
  return reply || reactions ? `${reply}|${reactions}` : null;
}

export function useCommentNotice({ spaceId, dateIso, pairDay }) {
  const [seen, setSeenState] = useState(undefined);
  const key = keyOf(spaceId, dateIso);

  const load = useCallback(() => {
    AsyncStorage.getItem(key)
      .then((v) => setSeenState(v || null))
      .catch(() => setSeenState(null));
  }, [key]);

  useEffect(load, [load]);
  // Home and Today each keep their own copy; re-read when coming into view.
  useFocusEffect(load);

  const sig = commentSignature(pairDay);
  const markSeen = useCallback(
    (value) => {
      const v = value ?? sig;
      if (!v) return;
      setSeenState(v);
      AsyncStorage.setItem(key, v).catch(() => {});
    },
    [key, sig]
  );

  const revealed = !!pairDay?.revealed;
  return {
    hasComment: !!sig,
    // Unknown until storage has answered; never flash the banner before that.
    unseen: revealed && !!sig && seen !== undefined && seen !== sig,
    visible: revealed && !!sig && seen === sig,
    markSeen,
  };
}
