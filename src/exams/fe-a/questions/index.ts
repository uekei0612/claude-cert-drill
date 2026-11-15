import type { Question } from "../../../core/exam/types";
import { r05 } from "./r05";
import { r06 } from "./r06";
import { r07 } from "./r07";
import { r08 } from "./r08";
import { r01aMgmtStrat } from "./r01a-ms";
import { r01aTech } from "./r01a-t";
import { h31hMgmtStrat } from "./h31h-ms";
import { h31hTech } from "./h31h-t";
import { h30aMgmtStrat } from "./h30a-ms";
import { h30aTech } from "./h30a-t";
import { h30hMgmtStrat } from "./h30h-ms";
import { h30hTech } from "./h30h-t";
import { h29hMgmtStrat } from "./h29h-ms";
import { h29hTech } from "./h29h-t";
import { samples } from "./sample";

/** 年度ごとのファイルを古い順に並べ、サンプル問題セット（#68）、新形式の前の午前（#71・#73〜。新しい回から）の順。問題の ID は記録のキーなので、足すときは分野ごとに続きの番号にする */
export const questions: Question[] = [
  ...r05,
  ...r06,
  ...r07,
  ...r08,
  ...samples,
  ...r01aTech,
  ...r01aMgmtStrat,
  ...h31hTech,
  ...h31hMgmtStrat,
  ...h30aTech,
  ...h30aMgmtStrat,
  ...h30hTech,
  ...h30hMgmtStrat,
  ...h29hTech,
  ...h29hMgmtStrat,
];
