import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";

/* Firebase Auth, the app's sign-in since 1.0.8 (Clerk before it — see
   lib/auth.jsx for how accounts move over).

   These values are the project's public client config: they ship inside every
   copy of the app and only identify the project; what an account may do is
   decided by the server. The session is kept in AsyncStorage, so it survives
   restarts and ends only when the user signs out (Firebase refresh tokens
   don't expire on a timer). */

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDvuZ4Fro1VR40zy3_HTuzJGRzYoiBAOB4",
  authDomain: "futari-6af6f.firebaseapp.com",
  projectId: "futari-6af6f",
  storageBucket: "futari-6af6f.firebasestorage.app",
  messagingSenderId: "902681202450",
  appId: "1:902681202450:web:5d44d6772d6596f73badcb",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(config);

function makeAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: Platform.OS === "web" ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialised (fast refresh in development).
    return getAuth(firebaseApp);
  }
}

export const auth = makeAuth();

/* Google Sign-In client ids. The web one is the "Web client (auto created by
   Google Service)" of this project; Firebase checks Google's id token against it. */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "902681202450-qniughvn18984q7gejmluh73is2k4l65.apps.googleusercontent.com";
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "902681202450-sjeb3abi54gt9q5lrs72f70gh4a5n6o8.apps.googleusercontent.com";
