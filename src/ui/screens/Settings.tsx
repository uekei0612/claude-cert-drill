/* 設定と記録。ホーム画面版は Safari と保存領域が別なので、書き出し／読み込みで移す */
import { useState } from "preact/hooks";
import { APP_ENV, APP_VERSION } from "../../env";
import { exams, findExam } from "../../exams";
import { resetAll, resetExam, setSettings } from "../../store/actions";
import { PRACTICE_SIZES } from "../../store/schema";
import { exportJson, importJson, setData, update, useData } from "../../store/store";
import { href } from "../route";

export function Settings() {
  const data = useData();
  const [msg, setMsg] = useState<string | undefined>();
  const [paste, setPaste] = useState("");
  const last = data.settings.lastExam && findExam(data.settings.lastExam);
  const answered = Object.keys(data.items).length;

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `claude-cert-drill-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson());
      setMsg("記録をコピーしました。移したい側の「貼り付けて読み込む」に貼ってください。");
    } catch {
      setMsg("コピーできませんでした。ファイルに書き出してください。");
    }
  };
  const load = (text: string) => {
    try {
      const d = importJson(text);
      if (
        !confirm(
          `今の記録（${answered} 問分）を、読み込む記録（${Object.keys(d.items).length} 問分）で置き換えますか？`,
        )
      )
        return;
      setData(d);
      setPaste("");
      setMsg("読み込みました。");
    } catch (e) {
      setMsg(`読み込めませんでした：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <main class={`page ${last ? "with-tabs" : ""}`}>
      <a class="btn ghost" href={last ? href({ name: "home", examId: last.id }) : href({ name: "picker" })}>
        ← 戻る
      </a>
      <h1>設定と記録</h1>

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
      </section>

      <section class="card">
        <h2>記録を消す</h2>
        {exams.map(e => (
          <button
            key={e.id}
            class="btn"
            onClick={() => {
              if (confirm(`${e.code} の記録（回答と模擬試験の結果）を消しますか？元に戻せません。`))
                update(d => resetExam(d, e.id));
            }}
          >
            {e.code} の記録を消す
          </button>
        ))}
        <button
          class="btn danger"
          onClick={() => {
            if (confirm("すべての記録と設定を消しますか？元に戻せません。")) setData(resetAll());
          }}
        >
          すべて消す
        </button>
      </section>

      <p class="muted small">
        claude-cert-drill {APP_VERSION}（{APP_ENV}）・非公式の教材で、Anthropic とは関係がありません。
      </p>
    </main>
  );
}
