import type { Question } from "../../types";
import { s1 } from "./s1";
import { s2 } from "./s2";
import { s3 } from "./s3";

/** シナリオごとのファイルをここに並べる */
export const questions: Question[] = [...s1, ...s2, ...s3];
