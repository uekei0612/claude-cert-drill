/* 資格の一覧（#55）。一覧の情報（ExamMeta）はすぐ使え、中身（Exam）は load で読み込む。
   資格ごとに別ファイル（dynamic import）にすれば、開かない資格の分だけ起動が軽くなる。
   読み込んだ中身は覚えておき、2 回目からは peek ですぐ返す */
import type { Exam, ExamMeta } from "./types";

export interface ExamEntry {
  readonly meta: ExamMeta;
  /** 中身を読み込む（例 `() => import("./ccar-f/exam").then(m => m.ccarF)`） */
  readonly load: () => Promise<Exam>;
}

export interface Catalog {
  /** 載せている資格（一覧の情報） */
  readonly list: readonly ExamMeta[];
  find(id: string): ExamMeta | undefined;
  /** 中身を読み込む。無い資格は undefined。読み込みに失敗したら例外（次に呼んだときは読み直す） */
  load(id: string): Promise<Exam | undefined>;
  /** 読み込み済みの中身。まだなら undefined */
  peek(id: string): Exam | undefined;
}

export function createCatalog(entries: readonly ExamEntry[]): Catalog {
  const byId = new Map(entries.map(e => [e.meta.id, e]));
  if (byId.size !== entries.length) throw new Error("資格の ID が重なっている");
  const loaded = new Map<string, Exam>();
  const pending = new Map<string, Promise<Exam>>();
  return {
    list: entries.map(e => e.meta),
    find: id => byId.get(id)?.meta,
    peek: id => loaded.get(id),
    async load(id) {
      const entry = byId.get(id);
      if (!entry) return undefined;
      const done = loaded.get(id);
      if (done) return done;
      let p = pending.get(id);
      if (!p) {
        p = entry.load().then(exam => {
          if (exam.id !== id) throw new Error(`資格の中身の ID（${exam.id}）が一覧（${id}）と違う`);
          loaded.set(id, exam);
          return exam;
        });
        pending.set(id, p);
        p.catch(() => undefined).finally(() => pending.delete(id));
      }
      return p;
    },
  };
}
