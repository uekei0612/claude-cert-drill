/* 載せている資格の一覧。資格を足すときはここに並べる（手順は docs/adding-an-exam.md）。
   一覧の情報（meta.ts）だけを先に読み、中身（exam.ts）は資格を開いたときに読む（#55）。
   ここで exam.ts を静的に import すると、すべての資格が最初の JS に入ってしまう（src/layers.test.ts が見張る） */
import { createCatalog } from "../core/exam/catalog";
import { meta as ccarF } from "./ccar-f/meta";
import { meta as feA } from "./fe-a/meta";
import { meta as feB } from "./fe-b/meta";

export const catalog = createCatalog([
  { meta: ccarF, load: () => import("./ccar-f/exam").then(m => m.ccarF) },
  { meta: feA, load: () => import("./fe-a/exam").then(m => m.feA) },
  { meta: feB, load: () => import("./fe-b/exam").then(m => m.feB) },
]);
