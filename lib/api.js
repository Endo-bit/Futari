import { useMemo } from "react";
import { useAuth } from "@clerk/expo";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://futari-nine.vercel.app";

async function request(getToken, path, { method = "GET", body } = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Same function names/shapes as the web app's app/actions/*.js, backed by fetch instead of a direct server-action import. */
export function createApi(getToken) {
  return {
    getMe: () => request(getToken, "/api/me"),
    createInvite: () => request(getToken, "/api/pairing/invite", { method: "POST" }),
    cancelInvite: (code) => request(getToken, "/api/pairing/invite", { method: "DELETE", body: { code } }),
    redeemInvite: (code) => request(getToken, "/api/pairing/redeem", { method: "POST", body: { code } }),
    unpair: () => request(getToken, "/api/pairing/unpair", { method: "POST" }),
    saveStartDate: (startDate) => request(getToken, "/api/pairing/start-date", { method: "POST", body: { startDate } }),
    saveSharedGoal: (text) => request(getToken, "/api/pairing/goal", { method: "POST", body: { text } }),
    saveNextPlan: (text) => request(getToken, "/api/pairing/plan", { method: "POST", body: { text } }),

    listMyEntries: (spaceId) => request(getToken, `/api/entries?spaceId=${encodeURIComponent(spaceId)}`),
    saveEntry: (spaceId, dateIso, patch) =>
      request(getToken, "/api/entries", { method: "POST", body: { spaceId, dateIso, patch } }),
    getPairDay: (spaceId, dateIso) =>
      request(getToken, `/api/entries/${dateIso}?spaceId=${encodeURIComponent(spaceId)}`),
    revealDay: (spaceId, dateIso) =>
      request(getToken, `/api/entries/${dateIso}/reveal`, { method: "POST", body: { spaceId } }),
    submitResponse: (spaceId, dateIso, { reactions, reply }) =>
      request(getToken, `/api/entries/${dateIso}/response`, { method: "POST", body: { spaceId, reactions, reply } }),

    listSpecialDays: (spaceId) => request(getToken, `/api/special-days?spaceId=${encodeURIComponent(spaceId)}`),
    addSpecialDay: (spaceId, { title, date, icon }) =>
      request(getToken, "/api/special-days", { method: "POST", body: { spaceId, title, date, icon } }),
    removeSpecialDay: (spaceId, id) =>
      request(getToken, `/api/special-days?spaceId=${encodeURIComponent(spaceId)}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),

    exportMyData: (personalSpaceId, pairSpaceId) =>
      request(
        getToken,
        `/api/export?personalSpaceId=${encodeURIComponent(personalSpaceId)}${
          pairSpaceId ? `&pairSpaceId=${encodeURIComponent(pairSpaceId)}` : ""
        }`
      ),

    getNotificationPrefs: () => request(getToken, "/api/notifications/prefs"),
    saveNotificationPrefs: (prefs) => request(getToken, "/api/notifications/prefs", { method: "POST", body: prefs }),
    saveExpoPushToken: (token) =>
      request(getToken, "/api/notifications/push-token", { method: "POST", body: { token } }),
    saveUserLang: (lang) => request(getToken, "/api/notifications/lang", { method: "POST", body: { lang } }),

    deleteAccount: () => request(getToken, "/api/account", { method: "DELETE" }),

    getGentlerSuggestions: (text, lang) =>
      request(getToken, "/api/mind/gentler", { method: "POST", body: { text, lang } }),
  };
}

/** `const api = useApi()` inside any screen — mirrors importing app/actions/*.js on the web. */
export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApi(getToken), [getToken]);
}
