import { render } from "preact";
import { App, startRoute } from "./app/App";
import { catalog } from "./exams";
import "./style.css";
import { getData } from "./app/store";
import { keepHistoryFlat } from "./ui/route";
import { applyTheme } from "./ui/theme";

// iOS Safari は viewport の user-scalable=no を無視するので、ピンチのジェスチャーを止める
for (const type of ["gesturestart", "gesturechange", "gestureend"])
  document.addEventListener(type, e => e.preventDefault(), { passive: false });

applyTheme(getData().settings.theme);
keepHistoryFlat();
const first = startRoute();

// 最初に開く資格の中身を読み込んでから描く（「読み込み中」が一瞬出てちらつかないように。#55）。
// 読み込めなくても描く（画面が読み込み直しを勧める）
const start = () => render(<App />, document.getElementById("app")!);
(first ? catalog.load(first) : Promise.resolve()).then(start, start);
