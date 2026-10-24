// Native (iOS app) integration: status bar color and the daily study reminder.
// IS_NATIVE is a build-time constant, so the web build drops this code path.
import { signal } from "@preact/signals";
import type { ThemePref } from "@/types";

export const IS_NATIVE = import.meta.env.VITE_TARGET === "ios";

export interface Reminder {
  enabled: boolean;
  time: string; // HH:MM, local time
}

// Reminders are per device, so they live outside Settings (which may sync later).
const KEY = "fe-drill:v1:reminder";
const REMINDER_ID = 1;

function loadReminder(): Reminder {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && typeof v.enabled === "boolean" && /^\d{2}:\d{2}$/.test(v.time)) return v;
  } catch {
    // fall through to the default
  }
  return { enabled: false, time: "21:00" };
}

export const reminder = signal<Reminder>(loadReminder());

export type ReminderResult = "ok" | "denied";

export async function setReminder(next: Reminder): Promise<ReminderResult> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  if (next.enabled) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") {
      next = { ...next, enabled: false };
      save(next);
      return "denied";
    }
    const [hour, minute] = next.time.split(":").map(Number) as [number, number];
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: "基本情報ドリル",
          body: "今日の復習が待っています。5分だけ解いてみませんか。",
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        },
      ],
    });
  }
  save(next);
  return "ok";
}

function save(next: Reminder) {
  reminder.value = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked; the scheduled notification still stands
  }
}

// Light status bar text on the dark theme, dark text on the light theme.
export async function syncStatusBar(pref: ThemePref): Promise<void> {
  if (!IS_NATIVE) return;
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
}
