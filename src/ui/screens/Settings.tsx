/* 設定と記録。ホーム画面版は Safari と保存領域が別なので、書き出し／読み込みで移す */
import { useState } from "preact/hooks";
import { APP } from "../../app/config";
import { APP_ENV, APP_VERSION } from "../../app/env";
import { catalog } from "../../exams";
import { sourceLang } from "../../core/exam/types";
import { resetAll, resetExam, setExamDate, setSettings } from "../../core/store/actions";
import { PRACTICE_SIZES, QUESTION_LANGS, THEMES } from "../../core/store/schema";
import { exportJson, getBackup, importJson, replaceData, restoreBackup, update, useData } from "../../app/store";
import { ManualCopy, copyToClipboard } from "../CopyButton";
import { href } from "../route";
import { THEME_LABEL } from "../theme";

const SETTING_LABEL: Record<(typeof QUESTION_LANGS)[number], string> = {
  en: "英語",
  peek: "英語（訳はタップ）",
  both: "英語＋訳",
  ja: "日本語",
};

export function Settings() {
  const data = useData();
  const [msg, setMsg] = useState<string | undefined>();
  const [paste, setPaste] = useState("");
  // 自動で写せなかった記録（手で写すための欄に出す。#49）
  const [manual, setManual] = useState<string | undefined>();
  const last = data.settings.lastExam ? catalog.find(data.settings.lastExam) : undefined;
  const answered = Object.keys(data.items).length;
  // 控えは記録とは別のキーにある。記録が変わるたびに描き直されるので、そのつど読む
  const backup = getBackup();
  // 問題文の言語の設定は、英語が原文の資格にだけ効く（#57）
  const englishExams = catalog.list.filter(e => sourceLang(e) === "en");

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${APP.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };
  // 問題や教科書のコピーと同じ仕組みで写す（http の dev でも写せる。#46）
  const copy = async () => {
    const text = exportJson();
    const ok = await copyToClipboard(text);
    setManual(ok ? undefined : text);
    setMsg(
      ok
        ? "記録をコピーしました。移したい側の「貼り付けて読み込む」に貼ってください。"
        : "コピーできませんでした。下の欄から手で写すか、ファイルに書き出してください。",
    );
  };
  const load = (text: string) => {
    try {
      const d = importJson(text);
      if (
        !confirm(
          `今の記録（${answered} 問分）を、読み込む記録（${Object.keys(d.items).length} 問分）で置き換えますか？（置き換えたあと、直前の状態には戻せます）`,
        )
      )
        return;
      replaceData(d, "読み込み");
      setPaste("");
      setMsg("読み込みました。");
    } catch (e) {
      setMsg(`読み込めませんでした。${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <main class={`page ${last ? "with-tabs" : ""}`}>
      <a class="btn ghost" href={last ? href({ name: "home", examId: last.id }) : href({ name: "picker" })}>
        ← {last ? "ホーム" : "資格一覧"}
      </a>
      <h1>設定と記録</h1>
      <a class="btn block" href={href({ name: "help" })}>
        使い方と用語
      </a>

      <section class="card">
        <h2>試験日</h2>
        {catalog.list.map(e => (
          <label key={e.id} class="row between">
            <span>{e.code}</span>
            <span class="row">
              <input
                type="date"
                value={data.settings.examDates?.[e.id] ?? ""}
                onChange={ev => update(d => setExamDate(d, e.id, ev.currentTarget.value))}
              />
              {data.settings.examDates?.[e.id] && (
                <button type="button" class="btn ghost small" onClick={() => update(d => setExamDate(d, e.id, ""))}>
                  消す
                </button>
              )}
            </span>
          </label>
        ))}
        <p class="muted small">
          決めると、ホームに試験までの日数と、今日やる量の目安（残りを日数で割ったもの）が出ます。
        </p>
      </section>

      <section class="card">
        <h2>練習</h2>
        <label class="row between">
          <span>1 回の問題数</span>
          <select
            value={data.settings.practiceSize}
            onChange={e => update(d => setSettings(d, { practiceSize: Number(e.currentTarget.value) }))}
          >
            {PRACTICE_SIZES.map(n => (
              <option key={n} value={n}>
                {n} 問
              </option>
            ))}
          </select>
        </label>
        {englishExams.length > 0 && (
          <label class="row between">
            <span>問題文の言語</span>
            <select
              value={data.settings.lang}
              onChange={e =>
                update(d => setSettings(d, { lang: e.currentTarget.value as (typeof QUESTION_LANGS)[number] }))
              }
            >
              {QUESTION_LANGS.map(l => (
                <option key={l} value={l}>
                  {SETTING_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
        )}
        {englishExams.length > 0 && (
          <p class="muted small">
            {englishExams.map(e => e.code).join("・")}
            の本番の試験は英語です。まず「訳はタップ」で英語を先に読み、詰まったときだけ訳を開くのがおすすめです。解説は常に日本語です。
          </p>
        )}
      </section>

      <section class="card">
        <h2>見た目</h2>
        <div class="seg" role="group" aria-label="見た目">
          {THEMES.map(t => (
            <button
              key={t}
              class={t === data.settings.theme ? "on" : ""}
              aria-pressed={t === data.settings.theme}
              onClick={() => update(d => setSettings(d, { theme: t }))}
            >
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>
      </section>

      <section class="card">
        <h2>記録を移す</h2>
        <p class="muted small">
          ホーム画面に追加したアプリは、Safari とは別に記録を持ちます。片方で書き出して、もう片方で読み込んでください。
        </p>
        <div class="row wrap">
          <button class="btn" onClick={download}>
            ファイルに書き出す
          </button>
          <button class="btn" onClick={copy}>
            コピーする
          </button>
        </div>
        <label class="btn file">
          ファイルから読み込む
          <input
            type="file"
            accept="application/json,.json"
            onChange={async e => {
              const f = e.currentTarget.files?.[0];
              if (f) load(await f.text());
              e.currentTarget.value = "";
            }}
          />
        </label>
        <textarea
          rows={3}
          placeholder="コピーした記録をここに貼り付け"
          value={paste}
          onInput={e => setPaste(e.currentTarget.value)}
        />
        <button class="btn" disabled={!paste.trim()} onClick={() => load(paste)}>
          貼り付けて読み込む
        </button>
        {msg && (
          <p class="small" role="status">
            {msg}
          </p>
        )}
        {manual !== undefined && <ManualCopy text={manual} />}
      </section>

      <section class="card">
        <h2>記録を消す</h2>
        {catalog.list.map(e => (
          <button
            key={e.id}
            class="btn"
            onClick={() => {
              if (
                confirm(`${e.code} の記録（回答と模擬試験の結果）を消しますか？（消したあと、直前の状態には戻せます）`)
              )
                replaceData(resetExam(data, e.id), `${e.code} の記録の消去`);
            }}
          >
            {e.code} の記録を消す
          </button>
        ))}
        <button
          class="btn danger"
          onClick={() => {
            if (confirm("すべての記録と設定を消しますか？（消したあと、直前の状態には戻せます）"))
              replaceData(resetAll(), "すべての消去");
          }}
        >
          すべて消す
        </button>
      </section>

      {backup && (
        <section class="card" aria-labelledby="backup-h">
          <h2 id="backup-h">直前の状態に戻す</h2>
          <p class="small">
            {new Date(backup.at).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" })}
            の「{backup.reason}」の前の記録（{Object.keys(backup.data.items).length} 問分）に戻せます。
          </p>
          <button
            class="btn"
            onClick={() => {
              if (confirm("直前の状態に戻しますか？（今の記録は控えに残るので、もう一度戻せます）")) {
                restoreBackup();
                setMsg("直前の状態に戻しました。");
              }
            }}
          >
            直前の状態に戻す
          </button>
        </section>
      )}

      <p class="muted small">
        {APP.name} {APP_VERSION}（{APP_ENV}）・{APP.disclaimer}
      </p>
    </main>
  );
}
