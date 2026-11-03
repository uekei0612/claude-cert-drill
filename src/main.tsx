import { render } from "preact";
import { App, startRoute } from "./app";
import "./style.css";
import { keepHistoryFlat } from "./ui/route";

// iOS Safari は viewport の user-scalable=no を無視するので、ピンチのジェスチャーを止める
for (const type of ["gesturestart", "gesturechange", "gestureend"])
  document.addEventListener(type, e => e.preventDefault(), { passive: false });

keepHistoryFlat();
startRoute();

render(<App />, document.getElementById("app")!);
