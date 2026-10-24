import type { Route } from "@/router";
import { href } from "@/router";
import { Icon, type IconName } from "./Icon";

const TABS: Array<{ to: Route; label: string; icon: IconName; also?: Route[] }> = [
  { to: "/", label: "ホーム", icon: "home" },
  { to: "/practice", label: "演習", icon: "pen" },
  { to: "/cards", label: "カード", icon: "cards" },
  // Settings is reached from 分析, so the tab stays lit there.
  { to: "/stats", label: "分析", icon: "chart", also: ["/settings"] },
];

export function TabBar({ current }: { current: Route }) {
  return (
    <nav class="tabbar" aria-label="メイン">
      {TABS.map((t) => {
        const active = current === t.to || (t.also?.includes(current) ?? false);
        return (
          <a key={t.to} href={href(t.to)} class="tabbar__item" aria-current={active ? "page" : undefined}>
            <Icon name={t.icon} size={22} />
            <span class={active ? "marker" : undefined}>{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
