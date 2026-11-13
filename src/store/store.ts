/* 記録の読み書き。画面は useData() で今の記録を読み、update() で書き換える。
   develop 版は同じドメイン（github.io）の下にあるので、保存先のキーを分ける */
import { useEffect, useState } from "preact/hooks";
import { APP_ENV } from "../env";
import { type Data, emptyData, parseData } from "./schema";

export const STORAGE_KEY = APP_ENV === "prod" ? "claude-cert-drill" : "claude-cert-drill-dev";

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseData(JSON.parse(raw)) : emptyData();
  } catch {
    return emptyData();
  }
}

let current: Data = load();
const listeners = new Set<(d: Data) => void>();

export const getData = (): Data => current;

export function setData(next: Data): void {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できない（プライベートブラウズの容量など）ときも、開いている間は使えるようにする
  }
  for (const l of listeners) l(next);
}

export const update = (f: (d: Data) => Data): void => setData(f(current));

export function useData(): Data {
  const [d, setD] = useState(current);
  useEffect(() => {
    listeners.add(setD);
    setD(current);
    return () => void listeners.delete(setD);
  }, []);
  return d;
}

/* 直前の状態の控え（#45）。読み込み・消去のように記録を大きく置き換える操作の直前に、今の記録を
   別のキーに 1 つだけ取っておき、設定から戻せるようにする。戻すときは、戻す前の記録を控えに入れ替える
   （戻したことも取り消せる） */
export const BACKUP_KEY = `${STORAGE_KEY}:backup`;

export interface Backup {
  /** 控えを取った時刻 */
  readonly at: number;
  /** 何の前の控えか（「読み込み」「CCAR-F の記録の消去」など） */
  readonly reason: string;
  readonly data: Data;
}

/** 今の控え。無い・壊れているときは無し */
export function getBackup(): Backup | undefined {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "null");
    if (typeof raw !== "object" || raw === null) return undefined;
    const { at, reason, data } = raw as Record<string, unknown>;
    if (typeof at !== "number" || typeof reason !== "string") return undefined;
    return { at, reason, data: parseData(data) };
  } catch {
    return undefined;
  }
}

function saveBackup(reason: string, now: number): void {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: now, reason, data: current }));
  } catch {
    // 控えを取れなくても、操作そのものは続ける
  }
}

/** 記録を大きく置き換える（読み込み・消去）。直前の記録を控えに取ってから置き換える */
export function replaceData(next: Data, reason: string, now = Date.now()): void {
  saveBackup(reason, now);
  setData(next);
}

/** 控えの記録に戻す。戻す前の記録は控えに入れ替える。控えが無ければ false */
export function restoreBackup(now = Date.now()): boolean {
  const b = getBackup();
  if (!b) return false;
  saveBackup("直前の状態に戻す操作", now);
  setData(b.data);
  return true;
}

/** 書き出し用の JSON（Safari ↔ ホーム画面版の移行用） */
export const exportJson = (d: Data = current): string => JSON.stringify({ app: "claude-cert-drill", ...d }, null, 1);

/** 取り込み。読めないときは、理由と次にすることを日本語で書いた例外を投げる（#49）。形の合わない値は捨てる */
export function importJson(text: string): Data {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      "記録の形式ではありません。書き出したファイルか、「コピーする」で写した文を、途中で切らずにそのまま使ってください。",
    );
  }
  if (typeof raw !== "object" || raw === null || (raw as { app?: unknown }).app !== "claude-cert-drill")
    throw new Error(
      "このアプリ（claude-cert-drill）で書き出した記録ではありません。設定の「記録を移す」で書き出したものを使ってください。",
    );
  return parseData(raw);
}

/** テスト用：保存先から読み直す */
export const reloadForTest = (): void => {
  current = load();
};
