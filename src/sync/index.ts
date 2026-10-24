// STUB — agent B replaces the body (Firebase Auth + Firestore, docs/03-design.md §4.6).
import { signal } from "@preact/signals";
import type { AuthUser } from "@/types";
import { firebaseConfig } from "./firebase-config";

export const syncAvailable: boolean = firebaseConfig.apiKey !== "";
export const authUser = signal<AuthUser | null>(null);

export async function signIn(): Promise<void> {}
export async function signOut(): Promise<void> {}
