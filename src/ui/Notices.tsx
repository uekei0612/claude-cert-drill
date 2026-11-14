/* 断り書き（#61）。アプリの文（資格によらない）と、資格ごとの文（問題の出どころ・実施団体との関係）を並べる。
   資格の一覧の軽い情報（meta）だけを読むので、資格の中身を読み込まなくても出せる */
import { APP } from "../app/config";
import { catalog } from "../exams";

export function Notices() {
  return (
    <div class="notices muted small">
      <p>{APP.disclaimer}</p>
      {catalog.list.map(e => (
        <p key={e.id}>
          {e.code}：{e.notice}
        </p>
      ))}
    </div>
  );
}
