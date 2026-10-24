// Optional cloud sync: Firebase Auth (Google) + Firestore (docs/03-design.md §4.6).
// Firebase is loaded with dynamic import only when a config is present, so the
// local-only build never downloads it.
import { signal } from "@preact/signals";
import type { AuthUser, DayLog, ItemProgress, Settings } from "@/types";
import { mergeRemote, onLocalChange, type ChangeSet } from "@/store";
import { firebaseConfig } from "./firebase-config";

// iOS v1.0 ships local-only (no sign-in, nothing collected), so sync stays off in the app build.
export const syncAvailable: boolean = firebaseConfig.apiKey !== "" && import.meta.env.VITE_TARGET !== "ios";
export const authUser = signal<AuthUser | null>(null);

const PUSH_DELAY_MS = 1500;
const MAX_BATCH = 450; // Firestore allows 500 writes per batch; keep headroom

type AppMod = typeof import("firebase/app");
type AuthMod = typeof import("firebase/auth");
type StoreMod = typeof import("firebase/firestore");

interface Firebase {
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore").Firestore;
  authMod: AuthMod;
  fsMod: StoreMod;
}

let firebasePromise: Promise<Firebase> | null = null;

function loadFirebase(): Promise<Firebase> {
  firebasePromise ??= (async () => {
    const [appMod, authMod, fsMod]: [AppMod, AuthMod, StoreMod] = await Promise.all([
      import("firebase/app"), import("firebase/auth"), import("firebase/firestore"),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    const db = fsMod.initializeFirestore(app, {
      localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
    });
    return { auth, db, authMod, fsMod };
  })();
  return firebasePromise;
}

// ---- pending writes, coalesced by document path so only the latest value is sent

const pending = new Map<string, ItemProgress | DayLog | Settings>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function queue(change: ChangeSet): void {
  if (!authUser.value) return; // pushed later via mergeRemote's "local newer" list on login
  for (const p of change.progress) pending.set(`progress/${p.id}`, p);
  for (const d of change.days) pending.set(`days/${d.date}`, d);
  if (change.settings) pending.set("meta/settings", change.settings);
  if (pending.size === 0) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void flush(), PUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  pushTimer = null;
  const user = authUser.value;
  if (!user || pending.size === 0) return;
  const { db, fsMod } = await loadFirebase();
  const entries = [...pending.entries()];
  pending.clear();
  for (let i = 0; i < entries.length; i += MAX_BATCH) {
    const batch = fsMod.writeBatch(db);
    for (const [path, data] of entries.slice(i, i + MAX_BATCH)) {
      batch.set(fsMod.doc(db, `users/${user.uid}/${path}`), data);
    }
    // Not awaited: offline, commit() resolves only after the server acknowledges, but the
    // write is already queued in the persistent cache and is sent when back online.
    batch.commit().catch((error) => console.warn("[sync] push failed", error));
  }
}

async function pull(uid: string): Promise<void> {
  const { db, fsMod } = await loadFirebase();
  const [progressSnap, daysSnap, settingsSnap] = await Promise.all([
    fsMod.getDocs(fsMod.collection(db, `users/${uid}/progress`)),
    fsMod.getDocs(fsMod.collection(db, `users/${uid}/days`)),
    fsMod.getDoc(fsMod.doc(db, `users/${uid}/meta/settings`)),
  ]);
  const toPush = mergeRemote({
    progress: progressSnap.docs.map((d) => d.data()),
    days: daysSnap.docs.map((d) => d.data()),
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
  });
  queue(toPush);
}

let started = false;

async function start(): Promise<void> {
  if (!syncAvailable || started) return;
  started = true;
  const { auth, authMod } = await loadFirebase();
  onLocalChange(queue);
  authMod.getRedirectResult(auth).catch((error) => console.warn("[sync] redirect sign-in failed", error));
  authMod.onAuthStateChanged(auth, (user) => {
    authUser.value = user ? { uid: user.uid, displayName: user.displayName, email: user.email } : null;
    if (user) pull(user.uid).catch((error) => console.warn("[sync] pull failed", error));
  });
}

if (syncAvailable && typeof window !== "undefined") {
  start().catch((error) => console.warn("[sync] init failed", error));
}

// iOS home-screen apps can't open popups, so they must use a redirect.
function isIosStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || (/iPhone|iPad|iPod/.test(nav.userAgent) && matchMedia("(display-mode: standalone)").matches);
}

export async function signIn(): Promise<void> {
  if (!syncAvailable) return;
  await start();
  const { auth, authMod } = await loadFirebase();
  const provider = new authMod.GoogleAuthProvider();
  if (isIosStandalone()) {
    await authMod.signInWithRedirect(auth, provider);
    return;
  }
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await authMod.signInWithRedirect(auth, provider);
    } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
      throw error;
    }
  }
}

export async function signOut(): Promise<void> {
  if (!syncAvailable) return;
  await flush();
  const { auth, authMod } = await loadFirebase();
  await authMod.signOut(auth);
  pending.clear();
}
