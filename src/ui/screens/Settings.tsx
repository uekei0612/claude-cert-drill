/* 設定と記録。ホーム画面版は Safari と保存領域が別なので、書き出し／読み込みで移す */
import { useState } from "preact/hooks";
import { APP } from "../../app/config";
import { APP_ENV, APP_VERSION } from "../../app/env";
import { catalog } from "../../exams";
import { sourceLang } from "../../core/exam/types";
import {
  langOf,
  markExported,
  practiceSizeOf,
  resetAll,
  resetExam,
  setExamDate,
  setExamSettings,
  setSettings,
} from "../../core/store/actions";
import { PRACTICE_SIZES, QUESTION_LANGS, type QuestionLang, THEMES } from "../../core/store/schema";
import { exportJson, getBackup, importJson, replaceData, restoreBackup, update, useData } from "../../app/store";
import { ManualCopy, copyToClipboard } from "../CopyButton";
import { downloadRecord } from "../exportRecord";
import { Notices } from "../Notices";
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

  // 問題や教科書のコピーと同じ仕組みで写す（http の dev でも写せる。#46）
  const copy = async () => {
    const text = exportJson();
    const ok = await copyToClipboard(text);
    // 写せたら書き出した扱いにする（#89）。手で写す欄に出したときは、写したか分からないので数えない
    if (ok) update(d => markExported(d, Date.now()));
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

      {catalog.list.map(e => {
        // 問題文の言語は、英語が原文の資格にだけ出す（#57）
        const english = sourceLang(e) === "en";
        return (
          <section key={e.id} class="card" aria-labelledby={`exam-${e.id}-h`}>
            <h2 id={`exam-${e.id}-h`}>{e.code}</h2>
            <label class="row between">
              <span>試験日</span>
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
            <label class="row between">
              <span>1 回の問題数</span>
              <select
                value={practiceSizeOf(data, e.id)}
                onChange={ev => update(d => setExamSettings(d, e.id, { practiceSize: Number(ev.currentTarget.value) }))}
              >
                {PRACTICE_SIZES.map(n => (
                  <option key={n} value={n}>
                    {n} 問
                  </option>
                ))}
              </select>
            </label>
            {english && (
              <label class="row between">
                <span>問題文の言語</span>
                <select
                  value={langOf(data, e.id)}
                  onChange={ev =>
                    update(d => setExamSettings(d, e.id, { lang: ev.currentTarget.value as QuestionLang }))
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
            {english && (
              <p class="muted small">
                本番の試験は英語です。まず「訳はタップ」で英語を先に読み、詰まったときだけ訳を開くのがおすすめです。解説は常に日本語です。
              </p>
            )}
          </section>
        );
      })}
      <p class="muted small">
        試験日を決めると、ホームに試験までの日数と、今日やる量の目安（残りを日数で割ったもの）が出ます。問題数と言語は、ホームや出題画面で変えても、その資格にだけ効きます。
      </p>

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
          {
            "ホーム画面に追加したアプリは、Safari とは別に記録を持ちます。片方で書き出して、もう片方で読み込んでください。記録はこの端末の中にしか無いので、機種変更やアプリを消したときに備えて、ときどき書き出してください。"
          }
        </p>
        <p class="muted small exported-at">
          {data.exportedAt
            ? `最後に書き出した日：${new Date(data.exportedAt).toLocaleDateString("ja-JP")}`
            : "まだ書き出していません。"}
        </p>
        <div class="row wrap">
          <button class="btn" onClick={downloadRecord}>
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
        {APP.name} {APP_VERSION}（{APP_ENV}）
      </p>
      <Notices />
    </main>
  );
}
