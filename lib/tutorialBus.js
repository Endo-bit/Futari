/* A one-line event bus so the tutorial can wait on things the user does.

   The tutorial lives below AppStateProvider (it needs `useApp`), but the moments
   worth waiting for — an entry saved, a reveal, a mood tapped — happen at or
   above that level. Rather than thread callbacks downwards through a provider
   that shouldn't know a tutorial exists, anything interesting calls
   `signalTutorial("saved")` and whoever is listening decides if it mattered.

   Deliberately module-level and dependency-free: importing this from appState
   must not drag the tutorial's React tree in with it. */

const listeners = new Set();

/** Announce that something happened. Safe to call when nothing is listening. */
export function signalTutorial(name, payload) {
  for (const fn of [...listeners]) {
    try {
      fn(name, payload);
    } catch {
      // A broken listener must never break the action the user just took.
    }
  }
}

export function subscribeTutorial(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
