/* 資格の中身を読み込んで返す（#55）。読み込み済みならすぐ返す。
   一覧に無い資格は none、読み込めなかったら error（画面は読み込み直しを勧める） */
import { useEffect, useState } from "preact/hooks";
import type { Exam } from "../core/exam/types";
import { catalog } from "../exams";

export type ExamState =
  | { readonly status: "none" }
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly exam: Exam };

export function useExam(id: string | undefined): ExamState {
  const [, setLoaded] = useState(0);
  const [failed, setFailed] = useState<string | undefined>();
  const known = id !== undefined && catalog.find(id) !== undefined;
  const exam = id ? catalog.peek(id) : undefined;
  useEffect(() => {
    if (!id || !known || exam) return;
    let live = true;
    catalog.load(id).then(
      () => live && setLoaded(n => n + 1),
      () => live && setFailed(id),
    );
    return () => {
      live = false;
    };
  }, [id, known, exam]);
  if (!id || !known) return { status: "none" };
  if (exam) return { status: "ready", exam };
  return failed === id ? { status: "error" } : { status: "loading" };
}
