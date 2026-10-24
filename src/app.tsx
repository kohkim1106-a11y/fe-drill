// App shell: loads content, applies the theme, routes, and shows the tab bar
// except in focus mode (docs/03-design.md §3).
import type { FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";
import { FOCUS_ROUTES, route, type Route } from "./router";
import { settings } from "./store";
import { contentStatus, loadContent } from "./features/content";
import { applyTheme } from "./features/theme";
import { TabBar } from "./ui/TabBar";
import { EmptyState, Loading } from "./ui/EmptyState";
import { UpdateToast } from "./ui/UpdateToast";
import { Home } from "./features/home/Home";
import { PracticeMenu } from "./features/practice/PracticeMenu";
import { SessionScreen } from "./features/session/Session";
import { ResultScreen } from "./features/result/Result";
import { CardMenu } from "./features/cards/CardMenu";
import { CardSessionScreen } from "./features/cards/CardSession";
import { Stats } from "./features/stats/Stats";
import { SettingsScreen } from "./features/settings/Settings";
import { IS_NATIVE, syncStatusBar } from "./native";
import "./ui/ui.css";

const SCREENS: Record<Route, FunctionComponent> = {
  "/": Home,
  "/practice": PracticeMenu,
  "/session": SessionScreen,
  "/result": ResultScreen,
  "/cards": CardMenu,
  "/cards/session": CardSessionScreen,
  "/stats": Stats,
  "/settings": SettingsScreen,
};

export function App({ pwa = true }: { pwa?: boolean }) {
  useEffect(() => {
    void loadContent();
  }, []);

  useSignalEffect(() => {
    applyTheme(settings.value.theme);
    void syncStatusBar(settings.value.theme);
  });

  const current = route.value;
  const status = contentStatus.value;
  const focus = FOCUS_ROUTES.includes(current);

  // Tab screens scroll from the top on navigation, like separate pages.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [current]);

  let body;
  if (status === "loading") body = <Loading />;
  else if (status === "error")
    body = (
      <div class="page">
        <h1 class="page__title">基本情報ドリル</h1>
        <EmptyState title="問題を読み込めませんでした">
          <p>通信状態を確認して、もう一度お試しください。</p>
          <button type="button" class="btn-secondary" onClick={() => void loadContent()}>再読み込み</button>
        </EmptyState>
      </div>
    );
  else {
    const Screen = SCREENS[current];
    body = <Screen />;
  }

  return (
    <>
      {body}
      {!focus && status !== "loading" && <TabBar current={current} />}
      {pwa && !IS_NATIVE && <UpdateToast />}
    </>
  );
}
