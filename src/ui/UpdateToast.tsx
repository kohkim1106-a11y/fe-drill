/// <reference types="vite-plugin-pwa/preact" />
// "更新があります" prompt (requirement F7). registerType is "prompt", so the new
// service worker waits until the user chooses to update.
import { useRegisterSW } from "virtual:pwa-register/preact";
import { Icon } from "./Icon";

export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div class="toast" role="status">
      <span>更新があります</span>
      <button type="button" class="toast__action" onClick={() => void updateServiceWorker(true)}>
        更新する
      </button>
      <button type="button" class="toast__close" aria-label="あとで" onClick={() => setNeedRefresh(false)}>
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
