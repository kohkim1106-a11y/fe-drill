// STUB — agent B replaces the body. Local-date helpers (YYYY-MM-DD).
export function todayLocal(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return todayLocal(new Date(y, m - 1, d + days));
}

export function diffDays(from: string, to: string): number {
  const toTime = (s: string) => {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((toTime(to) - toTime(from)) / 86_400_000);
}
