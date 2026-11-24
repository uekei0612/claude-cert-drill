/* SAP-C03 だけの決まり（#101）。どの資格にもかける形の検査は core/exam/validate.ts */
import { expect, test } from "vitest";
import { planMock } from "../../core/engine/mock";
import { seeded } from "../../core/engine/rng";
import { domainOf } from "../../core/exam/types";
import { sapC03 as exam } from "./exam";

test("配点は試験ガイドどおり（25 / 25 / 15 / 15 / 20%）、細目は 5 / 5 / 4 / 3 / 4", () => {
  expect(exam.domains.map(d => d.weight)).toEqual([0.25, 0.25, 0.15, 0.15, 0.2]);
  expect(exam.domains.map(d => d.tasks.length)).toEqual([5, 5, 4, 3, 4]);
});

test("どの細目にも、主たる細目として 3 問以上ある", () => {
  for (const d of exam.domains)
    for (const t of d.tasks)
      expect(exam.questions.filter(q => q.tasks[0] === t.id).length, t.id).toBeGreaterThanOrEqual(3);
});

test("模擬試験は本番と同じ 75 問・180 分を、配点に比例して組める", () => {
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  for (let seed = 1; seed <= 50; seed++) {
    const plan = planMock(exam, seeded(seed));
    expect(plan.questionIds.length).toBe(75);
    expect(plan.limitMs).toBe(180 * 60 * 1000);
    const counts = exam.domains.map(
      d => plan.questionIds.filter(id => domainOf(exam, byId.get(id)!)?.id === d.id).length,
    );
    exam.domains.forEach((d, i) => expect(Math.abs(counts[i]! - d.weight * 75), d.id).toBeLessThan(1));
  }
});

test("新規の受け付けを止めたサービスを使わず、名前の変わったサービスは今の名前で書く", () => {
  const text = JSON.stringify(exam.questions) + JSON.stringify(exam.notes);
  // Migration Hub・Refactor Spaces は 2025-11-07 に、Application Discovery Service・Snowball Edge も新規の受け付けを止めた
  for (const gone of ["Migration Hub", "Refactor Spaces", "Application Discovery Service", "Snowball"])
    expect(text.includes(gone), gone).toBe(false);
  // AWS Application Migration Service は AWS Transform MGN に。旧称は「旧称」と添えるときだけ
  const rest = text
    .replaceAll("previously AWS Application Migration Service", "")
    .replaceAll("旧称 AWS Application Migration Service", "");
  expect(rest).not.toMatch(/Application Migration Service/);
});
