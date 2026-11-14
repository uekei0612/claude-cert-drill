import { render } from "preact";
import { App, startRoute } from "./app/App";
import "./style.css";
import { getData } from "./app/store";
import { keepHistoryFlat } from "./ui/route";
import { applyTheme } from "./ui/theme";

// iOS Safari は viewport の user-scalable=no を無視するので、ピンチのジェスチャーを止める
for (const type of ["gesturestart", "gesturechange", "gestureend"])
  document.addEventListener(type, e => e.preventDefault(), { passive: false });

applyTheme(getData().settings.theme);
keepHistoryFlat();
startRoute();

render(<App />, document.getElementById("app")!);
