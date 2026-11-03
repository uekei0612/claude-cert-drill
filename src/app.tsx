import { APP_ENV, APP_VERSION } from "./env";
import { UpdatePrompt } from "./ui/UpdatePrompt";

export function App() {
  return (
    <>
      {APP_ENV !== "prod" && (
        <div class="env-banner">
          {APP_ENV} · {APP_VERSION}
        </div>
      )}
      <main class="page">
        <h1>claude-cert-drill</h1>
        <p>準備中</p>
      </main>
      <UpdatePrompt busy={false} />
    </>
  );
}
