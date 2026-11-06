/* 教科書。細目ごとに 1 章。本文は自分の言葉で書き、仕様は公式ドキュメントで確かめる（試験ガイドの本文は載せない） */
import type { Lesson } from "../../types";
import { d1 } from "./d1";
import { d2 } from "./d2";
import { d3 } from "./d3";
import { d4 } from "./d4";
import { d5 } from "./d5";

export const lessons: Record<string, Lesson> = { ...d1, ...d2, ...d3, ...d4, ...d5 };
export { primer } from "./primer";
