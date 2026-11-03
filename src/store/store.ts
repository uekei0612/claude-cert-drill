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

/** 書き出し用の JSON（Safari ↔ ホーム画面版の移行用） */
export const exportJson = (d: Data = current): string => JSON.stringify({ app: "claude-cert-drill", ...d }, null, 1);

/** 取り込み。JSON として読めなければ例外。形の合わない値は捨てる */
export function importJson(text: string): Data {
  const raw: unknown = JSON.parse(text);
  if (typeof raw !== "object" || raw === null || (raw as { app?: unknown }).app !== "claude-cert-drill")
    throw new Error("claude-cert-drill の記録ではありません");
  return parseData(raw);
}

/** テスト用：保存先から読み直す */
export const reloadForTest = (): void => {
  current = load();
};
