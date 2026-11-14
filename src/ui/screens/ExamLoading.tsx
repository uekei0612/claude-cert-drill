/* 資格の中身を読み込んでいる間と、読み込めなかったとき（#55）。
   ふだんは端末に取ってある分を読むので一瞬で終わる。読めないのは、取っていない版を通信なしで開いたときなど */
import { href } from "../route";

export function ExamLoading({ failed }: { failed: boolean }) {
  if (!failed)
    return (
      <main class="page" aria-busy="true">
        <p class="muted" role="status">
          読み込み中…
        </p>
      </main>
    );
  return (
    <main class="page">
      <section class="card stack" role="alert">
        <p>資格の問題と教科書を読み込めませんでした。通信できる所で、読み込み直してください。</p>
        <button class="btn primary block" onClick={() => location.reload()}>
          読み込み直す
        </button>
        <a class="btn block" href={href({ name: "picker" })}>
          資格一覧へ
        </a>
      </section>
    </main>
  );
}
