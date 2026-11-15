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
import { h29aMgmtStrat } from "./h29a-ms";
import { h29aTech } from "./h29a-t";
import { h28aMgmtStrat } from "./h28a-ms";
import { h28aTech } from "./h28a-t";
import { h28hMgmtStrat } from "./h28h-ms";
import { h28hTech } from "./h28h-t";
import { h27aMgmtStrat } from "./h27a-ms";
import { h27aTech } from "./h27a-t";
import { h27hMgmtStrat } from "./h27h-ms";
import { h27hTech } from "./h27h-t";
import { h26aMgmtStrat } from "./h26a-ms";
import { h26aTech } from "./h26a-t";
import { h26hMgmtStrat } from "./h26h-ms";
import { h26hTech } from "./h26h-t";
import { h25aMgmtStrat } from "./h25a-ms";
import { h25aTech } from "./h25a-t";
import { h25hMgmtStrat } from "./h25h-ms";
import { h25hTech } from "./h25h-t";
import { h24aMgmtStrat } from "./h24a-ms";
import { h24aTech } from "./h24a-t";
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
  ...h29aTech,
  ...h29aMgmtStrat,
  ...h29hTech,
  ...h29hMgmtStrat,
  ...h28aTech,
  ...h28aMgmtStrat,
  ...h28hTech,
  ...h28hMgmtStrat,
  ...h27aTech,
  ...h27aMgmtStrat,
  ...h27hTech,
  ...h27hMgmtStrat,
  ...h26aTech,
  ...h26aMgmtStrat,
  ...h26hTech,
  ...h26hMgmtStrat,
  ...h25aTech,
  ...h25aMgmtStrat,
  ...h25hTech,
  ...h25hMgmtStrat,
  ...h24aTech,
  ...h24aMgmtStrat,
];
