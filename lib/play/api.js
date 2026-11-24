/* The games' only server calls: creating a shareable link (match check or
   memory quiz) and reading back whether the partner has answered. They work
   without an account — the link's random code is the only key — so they use
   plain fetch rather than the signed-in client in ../api.js. */

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://futari-nine.vercel.app";
const TIMEOUT_MS = 12000;

async function call(path, { method = "GET", body } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP_${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function shareUrl(code) {
  return `${BASE_URL}/p/${code}`;
}

/** kind "thisorthat": { answers: number[] }; kind "memory": { quiz: [{ q, right, wrong: [a, b] }] } */
export function createPlayLink({ kind, lang, answers, quiz, pushToken }) {
  return call("/api/play/match", { method: "POST", body: { kind, lang, answers, quiz, pushToken: pushToken || null } });
}

/** { kind, answered, percent?, score?, total?, partnerAnswers? } */
export function getPlayLink(code) {
  return call(`/api/play/match/${encodeURIComponent(code)}`);
}
