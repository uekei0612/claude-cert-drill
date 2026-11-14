/* 公開問題の出典（#64）。IPA のよくある質問「その他」：公表している過去問題は許諾・使用料なしで使えるが、
   年度・試験区分・問番号などの出典を明記し、一部を改変したときはその旨も明記する */
import type { QuestionSource } from "../../core/exam/types";

const PDF: Record<number, string> = {
  5: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_b_qs.pdf",
  6: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_b_qs.pdf",
  7: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_b_qs.pdf",
  8: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_b_qs.pdf",
};

/** 令和 year 年度の科目B 公開問題 問 no。図を表に置き換えるなど手を加えたものは modified */
export const koukai = (year: 5 | 6 | 7 | 8, no: number, modified = false): QuestionSource => ({
  label: `令和${year}年度 基本情報技術者試験 科目B 公開問題 問${no}`,
  url: PDF[year],
  ...(modified ? { modified } : {}),
});

const SAMPLE_PDF =
  "https://www.ipa.go.jp/shiken/syllabus/henkou/2022/ssf7ph000000h5tb-att/fe_kamoku_b_set_sample_qs.pdf";

/** 科目B サンプル問題（20 問）セット（2022 年 12 月公開）の問 no */
export const sample = (no: number, modified = false): QuestionSource => ({
  label: `基本情報技術者試験 科目B サンプル問題セット 問${no}`,
  url: SAMPLE_PDF,
  ...(modified ? { modified } : {}),
});
