/* 記録の入れ物。保存先（localStorage など）とキーは外から渡す（createStore）。
   基盤は画面の仕組み（Preact）を知らないので、変わったことは subscribe で知らせ、フックはアプリの側で作る */
import { type Data, emptyData, parseData } from "./schema";

/** 保存先。localStorage と同じ形の 2 つだけを使う */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

export interface StoreOptions {
  /** 保存のキー。控えは `<key>:backup` に置く */
  readonly key: string;
  /** 書き出した JSON に入れるアプリの名前。読み込むときに、このアプリの記録かを見分ける */
  readonly app: string;
  /** 保存先を返す。呼ぶたびに取り出し、取り出せないとき（例外）も開いている間は使えるようにする */
  readonly storage: () => KeyValueStorage;
}

/* 直前の状態の控え（#45）。読み込み・消去のように記録を大きく置き換える操作の直前に、今の記録を
   別のキーに 1 つだけ取っておき、設定から戻せるようにする。戻すときは、戻す前の記録を控えに入れ替える
   （戻したことも取り消せる） */
export interface Backup {
  /** 控えを取った時刻 */
  readonly at: number;
  /** 何の前の控えか（「読み込み」「CCAR-F の記録の消去」など） */
  readonly reason: string;
  readonly data: Data;
}

export interface Store {
  readonly key: string;
  readonly backupKey: string;
  getData(): Data;
  setData(next: Data): void;
  update(f: (d: Data) => Data): void;
  /** 記録が変わったら呼ぶ。戻り値で解除する */
  subscribe(listener: (d: Data) => void): () => void;
  /** 今の控え。無い・壊れているときは無し */
  getBackup(): Backup | undefined;
  /** 記録を大きく置き換える（読み込み・消去）。直前の記録を控えに取ってから置き換える */
  replaceData(next: Data, reason: string, now?: number): void;
  /** 控えの記録に戻す。戻す前の記録は控えに入れ替える。控えが無ければ false */
  restoreBackup(now?: number): boolean;
  /** 書き出し用の JSON（Safari ↔ ホーム画面版の移行用） */
  exportJson(d?: Data): string;
  /** 取り込み。読めないときは、理由と次にすることを日本語で書いた例外を投げる（#49）。形の合わない値は捨てる */
  importJson(text: string): Data;
  /** 保存先から読み直す（テスト用） */
  reload(): void;
}

export function createStore({ key, app, storage }: StoreOptions): Store {
  const backupKey = `${key}:backup`;
  const listeners = new Set<(d: Data) => void>();

  function load(): Data {
    try {
      const raw = storage().getItem(key);
      return raw ? parseData(JSON.parse(raw)) : emptyData();
    } catch {
      return emptyData();
    }
  }

  let current: Data = load();

  function setData(next: Data): void {
    current = next;
    try {
      storage().setItem(key, JSON.stringify(next));
    } catch {
      // 保存できない（プライベートブラウズの容量など）ときも、開いている間は使えるようにする
    }
    for (const l of listeners) l(next);
  }

  function getBackup(): Backup | undefined {
    try {
      const raw: unknown = JSON.parse(storage().getItem(backupKey) ?? "null");
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
      storage().setItem(backupKey, JSON.stringify({ at: now, reason, data: current }));
    } catch {
      // 控えを取れなくても、操作そのものは続ける
    }
  }

  return {
    key,
    backupKey,
    getData: () => current,
    setData,
    update: f => setData(f(current)),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getBackup,
    replaceData(next, reason, now = Date.now()) {
      saveBackup(reason, now);
      setData(next);
    },
    restoreBackup(now = Date.now()) {
      const b = getBackup();
      if (!b) return false;
      saveBackup("直前の状態に戻す操作", now);
      setData(b.data);
      return true;
    },
    exportJson: (d = current) => JSON.stringify({ app, ...d }, null, 1),
    importJson(text) {
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error(
          "記録の形式ではありません。書き出したファイルか、「コピーする」で写した文を、途中で切らずにそのまま使ってください。",
        );
      }
      if (typeof raw !== "object" || raw === null || (raw as { app?: unknown }).app !== app)
        throw new Error(
          `このアプリ（${app}）で書き出した記録ではありません。設定の「記録を移す」で書き出したものを使ってください。`,
        );
      return parseData(raw);
    },
    reload() {
      current = load();
    },
  };
}
