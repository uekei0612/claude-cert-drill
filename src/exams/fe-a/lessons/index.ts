/* 科目A の教科書（#69）。細目ごとに 1 章。本文と例題は自作で、範囲と用語は IPA のシラバスで確かめる */
import type { Lesson } from "../../../core/exam/types";
import { mgmt } from "./mgmt";
import { strat } from "./strat";
import { tech } from "./tech";

export const lessons: Record<string, Lesson> = { ...tech, ...mgmt, ...strat };
export { primer } from "./primer";
