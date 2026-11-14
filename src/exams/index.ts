/* 載せている資格の一覧。資格を足すときはここに並べる */
import { ccarF } from "./ccar-f/exam";
import type { Exam } from "../core/exam/types";

export const exams: readonly Exam[] = [ccarF];

export const findExam = (id: string): Exam | undefined => exams.find(e => e.id === id);
