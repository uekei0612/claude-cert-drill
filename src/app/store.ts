/* このアプリの記録の実体。画面は useData() で今の記録を読み、update() で書き換える。
   develop 版は同じドメイン（github.io）の下にあるので、保存先のキーを分ける */
import { useEffect, useState } from "preact/hooks";
import type { Data } from "../core/store/schema";
import { createStore } from "../core/store/store";
import { APP } from "./config";
import { APP_ENV } from "./env";

export const STORAGE_KEY = APP_ENV === "prod" ? APP.id : `${APP.id}-dev`;

export const store = createStore({ key: STORAGE_KEY, app: APP.id, storage: () => localStorage });

export const BACKUP_KEY = store.backupKey;
export const { getData, setData, update, getBackup, replaceData, restoreBackup, exportJson, importJson } = store;

export function useData(): Data {
  const [d, setD] = useState(store.getData());
  useEffect(() => {
    const off = store.subscribe(setD);
    setD(store.getData());
    return off;
  }, []);
  return d;
}
