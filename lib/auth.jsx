import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth as useClerkAuth } from "@clerk/expo";
import * as Crypto from "expo-crypto";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  updateProfile,
  signOut as fbSignOut,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { auth, GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "./firebase";

/* Who is signed in — the app's one source of truth for it since 1.0.8.

   Screens keep calling `useAuth()` / `useUser()` with the same shapes they had
   under Clerk ({ isLoaded, isSignedIn, userId, getToken, signOut } and
   { user: { firstName } }), so nothing downstream had to change.

   Moving over from Clerk, quietly:
   - Someone still holding a Clerk session (everyone on 1.0.7 who opened the app
     in the last seven days) is swapped to Firebase on first launch: the server
     checks the Clerk session and returns a Firebase sign-in token for the same
     account id. No sign-in screen.
   - Someone whose Clerk session already ran out signs in again once, with the
     same email + password or Google account; the server carries the account
     over (see the backend's lib/authMigration.js).

   `userId` is the account id the server says this sign-in stands for — for
   accounts from the Clerk days that is the old "user_…" id, which is also the
   RevenueCat customer, so purchases follow along. */

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://futari-nine.vercel.app";

const AuthContext = createContext(null);

async function post(path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP_${res.status}`);
  return data;
}

function loadGoogle() {
  if (Platform.OS === "web") return null;
  try {
    const mod = require("@react-native-google-signin/google-signin");
    if (!GOOGLE_IOS_CLIENT_ID && Platform.OS === "ios") return null;
    mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID || undefined });
    return mod;
  } catch {
    return null;
  }
}

function loadApple() {
  if (Platform.OS !== "ios") return null;
  try {
    return require("expo-apple-authentication");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const clerk = useClerkAuth();
  const [fbUser, setFbUser] = useState(undefined); // undefined: not known yet
  const [account, setAccount] = useState(null); // { uid, firstName }
  const [linking, setLinking] = useState(false);
  const [exchangeDone, setExchangeDone] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const pendingName = useRef(null);
  const google = useMemo(loadGoogle, []);
  const apple = useMemo(loadApple, []);

  useEffect(() => onAuthStateChanged(auth, (u) => setFbUser(u || null)), []);

  /* Clerk can fail to load at all (offline at launch, or on web); it must
     never hold the app on a blank screen. After a few seconds without it we
     carry on as if there were no Clerk session — and if it turns up later
     with a live session, the swap below still happens then. */
  useEffect(() => {
    const timer = setTimeout(() => setGateOpen(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  /* Clerk → Firebase, once, for someone who still has a Clerk session. */
  useEffect(() => {
    if (fbUser === undefined || !clerk.isLoaded || exchangeDone) return;
    if (fbUser || !clerk.isSignedIn) {
      setExchangeDone(true);
      return;
    }
    (async () => {
      try {
        const clerkToken = await clerk.getToken();
        if (clerkToken) {
          const { token } = await post("/api/auth/exchange", { token: clerkToken });
          await signInWithCustomToken(auth, token);
        }
      } catch {
        // Session already gone or offline: they will see the sign-in screen.
      } finally {
        setExchangeDone(true);
      }
    })();
  }, [fbUser, clerk.isLoaded, clerk.isSignedIn, exchangeDone]); // eslint-disable-line

  /* After every Firebase sign-in, ask the server which account this is. */
  useEffect(() => {
    if (!fbUser || fbUser.isAnonymous) {
      setAccount(null);
      return;
    }
    let live = true;
    setLinking(true);
    (async () => {
      const cacheKey = `futari_auth_link_${fbUser.uid}`;
      const fallbackName = (fbUser.displayName || "").split(" ")[0] || null;
      let done = false;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        try {
          const token = await fbUser.getIdToken();
          const firstName = pendingName.current || undefined;
          const res = await post("/api/auth/link", { token, body: firstName ? { firstName } : {} });
          pendingName.current = null;
          AsyncStorage.setItem(cacheKey, JSON.stringify({ uid: res.uid, firstName: res.firstName || null })).catch(() => {});
          if (live) setAccount({ uid: res.uid, firstName: res.firstName || firstName || fallbackName });
          done = true;
        } catch {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (!done && live) {
        // Offline at launch: use what the server said last time on this phone.
        // With nothing saved, the Firebase id is the account id (new accounts and
        // ones carried over from Clerk both use it); a linked one was saved when
        // it was first linked, online.
        const cached = await AsyncStorage.getItem(cacheKey).then((v) => (v ? JSON.parse(v) : null)).catch(() => null);
        setAccount({ uid: cached?.uid || fbUser.uid, firstName: cached?.firstName || fallbackName });
      }
      if (live) setLinking(false);
    })();
    return () => {
      live = false;
    };
  }, [fbUser?.uid]); // eslint-disable-line

  const getToken = useCallback(async () => (auth.currentUser ? auth.currentUser.getIdToken() : null), []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth).catch(() => {});
    if (google) await google.GoogleSignin.signOut().catch(() => {});
    // The Clerk session must go too, or the next launch would quietly sign back in.
    if (clerk.isSignedIn) await clerk.signOut().catch(() => {});
    setAccount(null);
  }, [google, clerk]);

  /* ── Ways in ───────────────────────────────────────────── */

  const signInEmail = useCallback(async (email, password) => {
    const e = email.trim().toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, e, password);
    } catch (err) {
      const code = err?.code || "";
      if (!["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-login-credentials"].includes(code)) throw err;
      // Maybe an account from before the move: the server checks the password
      // against the old system and, if it matches, carries the account over.
      await post("/api/auth/password", { body: { email: e, password } });
      await signInWithEmailAndPassword(auth, e, password);
    }
  }, []);

  const signUpEmail = useCallback(async (email, password, firstName) => {
    pendingName.current = (firstName || "").trim() || null;
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (pendingName.current) await updateProfile(cred.user, { displayName: pendingName.current }).catch(() => {});
  }, []);

  const resetPassword = useCallback(async (email) => {
    const e = email.trim().toLowerCase();
    await post("/api/auth/reset", { body: { email: e } }).catch(() => {});
    await sendPasswordResetEmail(auth, e);
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!google) throw new Error("GOOGLE_UNAVAILABLE");
    const { GoogleSignin, isSuccessResponse } = google;
    await GoogleSignin.hasPlayServices?.().catch(() => {});
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return false; // cancelled
    const idToken = res.data?.idToken;
    if (!idToken) throw new Error("GOOGLE_NO_TOKEN");
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return true;
  }, [google]);

  const signInApple = useCallback(async () => {
    if (!apple) throw new Error("APPLE_UNAVAILABLE");
    const rawNonce = Crypto.randomUUID() + Crypto.randomUUID();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    let cred;
    try {
      cred = await apple.signInAsync({
        requestedScopes: [apple.AppleAuthenticationScope.FULL_NAME, apple.AppleAuthenticationScope.EMAIL],
        nonce: hashed,
      });
    } catch (err) {
      if (err?.code === "ERR_REQUEST_CANCELED") return false;
      throw err;
    }
    if (!cred.identityToken) throw new Error("APPLE_NO_TOKEN");
    // Apple tells us the name only the first time; keep it for the account.
    if (cred.fullName?.givenName) pendingName.current = cred.fullName.givenName;
    const provider = new OAuthProvider("apple.com");
    const result = await signInWithCredential(auth, provider.credential({ idToken: cred.identityToken, rawNonce }));
    if (cred.fullName?.givenName && !result.user.displayName) {
      await updateProfile(result.user, { displayName: [cred.fullName.givenName, cred.fullName.familyName].filter(Boolean).join(" ") }).catch(() => {});
    }
    return true;
  }, [apple]);

  const isLoaded = fbUser !== undefined && (exchangeDone || gateOpen) && !(fbUser && !fbUser.isAnonymous && linking && !account);
  const isSignedIn = !!fbUser && !fbUser.isAnonymous && !!account;

  const value = useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      userId: isSignedIn ? account.uid : null,
      email: fbUser?.email || null,
      firstName: account?.firstName || null,
      getToken,
      signOut,
      signInEmail,
      signUpEmail,
      resetPassword,
      signInGoogle,
      signInApple,
      googleAvailable: !!google,
      appleAvailable: !!apple,
    }),
    [isLoaded, isSignedIn, account, fbUser, getToken, signOut, signInEmail, signUpEmail, resetPassword, signInGoogle, signInApple, google, apple]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Same shape as Clerk's useUser(), for the screens that only want a name. */
export function useUser() {
  const { firstName, email, isSignedIn } = useAuth();
  return { user: isSignedIn ? { firstName, primaryEmailAddress: email ? { emailAddress: email } : null } : null };
}
