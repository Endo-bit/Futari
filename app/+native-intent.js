/* Incoming links, before Expo Router tries to match them to a screen.

   A pairing link (futari://pair?code=…, or futari://pair/CODE) has no screen
   of its own: DeepLinkHandler reads the code straight from the URL and redeems
   it. Left alone, the router also tried to open "/pair" and showed
   "Unmatched Route" over everything — the partner tapping "Open in Futari"
   landed on an error page. Send those to the start screen instead; the
   handler still sees the original URL and does the pairing. */

const KNOWN = /^\/?(play|plane|invite|paywall|today|home|journal|settings|entry)(\/|$|\?)/;

export function redirectSystemPath({ path }) {
  try {
    const raw = String(path || "");
    // Strip the scheme/host so "futari://pair?x" and "/pair?x" look the same.
    const p = raw.replace(/^[a-z][a-z0-9+.-]*:\/\/(futari-nine\.vercel\.app)?/i, "/").replace(/^\/+/, "/");
    if (/^\/pair(\/|\?|$)/.test(p)) return "/";
    if (p === "/" || p === "" || KNOWN.test(p)) return p || "/";
    // Anything else we don't have a screen for: the start screen, never an error page.
    return "/";
  } catch {
    return "/";
  }
}
