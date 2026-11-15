import type { Question } from "../../../core/exam/types";
import { r05 } from "./r05";
import { r06 } from "./r06";
import { r07 } from "./r07";
import { r08 } from "./r08";
import { samples } from "./sample";

/** 年度ごとのファイルを古い順に並べ、最後にサンプル問題セット（#68）。問題の ID は記録のキーなので、足すときは分野ごとに続きの番号にする */
export const questions: Question[] = [...r05, ...r06, ...r07, ...r08, ...samples];
