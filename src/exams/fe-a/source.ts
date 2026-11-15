/* 公開問題の出典（#65）。IPA のよくある質問「その他」：公表している過去問題は許諾・使用料なしで使えるが、
   年度・試験区分・問番号などの出典を明記し、一部を改変したときはその旨も明記する */
import type { QuestionSource } from "../../core/exam/types";

const PDF: Record<number, string> = {
  5: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/t6hhco0000003zx0-att/2023r05_fe_kamoku_a_qs.pdf",
  6: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf",
  7: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf",
  8: "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf",
};

/** 令和 year 年度の科目A 公開問題 問 no。図を描き直すなど手を加えたものは modified */
export const koukai = (year: 5 | 6 | 7 | 8, no: number, modified = false): QuestionSource => ({
  label: `令和${year}年度 基本情報技術者試験 科目A 公開問題 問${no}`,
  url: PDF[year],
  ...(modified ? { modified } : {}),
});

const SAMPLE_PDF =
  "https://www.ipa.go.jp/shiken/syllabus/henkou/2022/ssf7ph000000h5tb-att/fe_kamoku_a_set_sample_qs.pdf";

/** 科目A サンプル問題（60 問）セット（2022 年 12 月公開）の問 no（#68） */
export const sample = (no: number, modified = false): QuestionSource => ({
  label: `基本情報技術者試験 科目A サンプル問題セット 問${no}`,
  url: SAMPLE_PDF,
  ...(modified ? { modified } : {}),
});

const AM_PDF: Record<string, string> = {
  r01a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000dict-att/2019r01a_fe_am_qs.pdf",
  h31h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_fe_am_qs.pdf",
  h30a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000f01f-att/2018h30a_fe_am_qs.pdf",
  h30h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_fe_am_qs.pdf",
  h29h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fzx1-att/2017h29h_fe_am_qs.pdf",
  h29a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fqpm-att/2017h29a_fe_am_qs.pdf",
  h28a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000g6fw-att/2016h28a_fe_am_qs.pdf",
  h28h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000gn5o-att/2016h28h_fe_am_qs.pdf",
  h27a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000gxj0-att/2015h27a_fe_am_qs.pdf",
  h27h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/ug65p90000000f52-att/2015h27h_fe_am_qs.pdf",
  h26a: "https://www.ipa.go.jp/shiken/mondai-kaiotu/ug65p90000000ye5-att/2014h26a_fe_am_qs.pdf",
  h26h: "https://www.ipa.go.jp/shiken/mondai-kaiotu/ug65p90000001dzu-att/2014h26h_fe_am_qs.pdf",
};
const AM_LABEL: Record<string, string> = {
  r01a: "令和元年度 秋期",
  h31h: "平成31年度 春期",
  h30a: "平成30年度 秋期",
  h30h: "平成30年度 春期",
  h29h: "平成29年度 春期",
  h29a: "平成29年度 秋期",
  h28a: "平成28年度 秋期",
  h28h: "平成28年度 春期",
  h27a: "平成27年度 秋期",
  h27h: "平成27年度 春期",
  h26a: "平成26年度 秋期",
  h26h: "平成26年度 春期",
};

/** 新形式（科目A）になる前の午前試験の問 no（#71・#73〜）。冊子は画像なので、文は読み取って書き起こした */
export const gozen = (
  exam: "r01a" | "h31h" | "h30a" | "h30h" | "h29h" | "h29a" | "h28a" | "h28h" | "h27a" | "h27h" | "h26a" | "h26h",
  no: number,
  modified = false,
): QuestionSource => ({
  label: `${AM_LABEL[exam]} 基本情報技術者試験 午前 問${no}`,
  url: AM_PDF[exam],
  ...(modified ? { modified } : {}),
});
