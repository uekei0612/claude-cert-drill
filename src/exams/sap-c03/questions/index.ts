import type { Question } from "../../../core/exam/types";
import { d1 } from "./d1";
import { d2 } from "./d2";
import { d3 } from "./d3";
import { d4 } from "./d4";
import { d5 } from "./d5";

/** 分野ごとのファイルをここに並べる */
export const questions: Question[] = [...d1, ...d2, ...d3, ...d4, ...d5];
