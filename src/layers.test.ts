/* 層の境目を守る（#51）。テスト以外のファイルの import を見て、決めた向きにしか読んでいないかを確かめる。
   - core：資格に依らない基盤。core の外も、Preact などのパッケージも読まない（将来パッケージに切り出せるように）
   - exams/<資格>：資格の中身。core/exam（型と図の道具）と、自分のフォルダの中だけを読む
   - 資格の中身を読むのは、資格の一覧（exams/index.ts）だけ
   - ui：画面。アプリの組み立て（app/App.tsx）は読まない */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { describe, expect, test } from "vitest";

const SRC = dirname(new URL(import.meta.url).pathname);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

/** ファイルの import（src からの相対パス、またはパッケージ名） */
function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/g)].map(([, spec]) =>
    spec!.startsWith(".") ? relative(SRC, normalize(join(dirname(file), spec!))) : `pkg:${spec}`,
  );
}

const files = walk(SRC).map(f => ({ path: relative(SRC, f), imports: importsOf(f) }));
const under = (p: string, dir: string) => p === dir || p.startsWith(`${dir}/`);

describe("層の境目", () => {
  test("core は core の中だけを読む（パッケージも読まない）", () => {
    const bad = files
      .filter(f => under(f.path, "core"))
      .flatMap(f => f.imports.filter(i => !under(i, "core")).map(i => `${f.path} → ${i}`));
    expect(bad).toEqual([]);
  });

  test("資格の中身は core/exam と自分のフォルダだけを読む", () => {
    const bad = files
      .filter(f => /^exams\/[^/]+\//.test(f.path))
      .flatMap(f => {
        const own = f.path.split("/").slice(0, 2).join("/");
        return f.imports.filter(i => !under(i, own) && !under(i, "core/exam")).map(i => `${f.path} → ${i}`);
      });
    expect(bad).toEqual([]);
  });

  test("資格の中身を読むのは、資格の一覧（exams/index.ts）だけ", () => {
    const bad = files
      .filter(f => !/^exams\/[^/]+\//.test(f.path) && f.path !== "exams/index.ts")
      .flatMap(f => f.imports.filter(i => /^exams\/[^/]+\//.test(i)).map(i => `${f.path} → ${i}`));
    expect(bad).toEqual([]);
  });

  test("画面はアプリの組み立て（app/App）を読まない", () => {
    const bad = files
      .filter(f => under(f.path, "ui"))
      .flatMap(f => f.imports.filter(i => i === "app/App").map(i => `${f.path} → ${i}`));
    expect(bad).toEqual([]);
  });

  test("ファイルが見つかっている（検査が空回りしていない）", () => {
    expect(files.filter(f => under(f.path, "core")).length).toBeGreaterThan(10);
    expect(files.filter(f => /^exams\/[^/]+\//.test(f.path)).length).toBeGreaterThan(5);
  });
});
