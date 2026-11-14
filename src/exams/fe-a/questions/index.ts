import type { Question } from "../../../core/exam/types";
import { r05 } from "./r05";
import { r06 } from "./r06";
import { r07 } from "./r07";
import { r08 } from "./r08";

/** 年度ごとのファイルを古い順に並べる。問題の ID は記録のキーなので、新しい年度は分野ごとに続きの番号で足す */
export const questions: Question[] = [...r05, ...r06, ...r07, ...r08];
