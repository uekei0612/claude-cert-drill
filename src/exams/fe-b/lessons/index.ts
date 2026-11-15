/* 科目B の教科書（#67・#70）。「はじめに」と細目ごとの章。本文と例は自作 */
import type { Lesson } from "../../../core/exam/types";
import { algo } from "./algo";
import { sec } from "./sec";

export const lessons: Record<string, Lesson> = { ...algo, ...sec };
export { primer } from "./primer";
