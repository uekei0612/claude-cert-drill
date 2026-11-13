import { useEffect, useState } from "preact/hooks";
import { APP_ENV, APP_VERSION } from "./env";
import { exams, findExam } from "./exams";
import { setSettings } from "./store/actions";
import { getData, update, useData } from "./store/store";
import { go, href, useRoute } from "./ui/route";
import { ExamPicker } from "./ui/screens/ExamPicker";
import { Home } from "./ui/screens/Home";
import { Mock } from "./ui/screens/Mock";
import { MockResult } from "./ui/screens/MockResult";
import { Domains } from "./ui/screens/Domains";
import { Settings } from "./ui/screens/Settings";
import { TaskDetail } from "./ui/screens/TaskDetail";
import { Help } from "./ui/screens/Help";
import { Learn } from "./ui/screens/Learn";
import { Search } from "./ui/screens/Search";
import { Practice } from "./ui/screens/Practice";
import { Saved } from "./ui/screens/Saved";
import { TabBar } from "./ui/TabBar";
import { applyTheme } from "./ui/theme";
import { UpdatePrompt } from "./ui/UpdatePrompt";

/** 起動したとき、ハッシュが無ければ前回の資格を開く。初めてでも資格が 1 つだけならそのホームを開く
    （資格一覧から始めると、何から手を付ければよいかが分からない。#50） */
export function startRoute(): void {
  if (location.hash) return;
  const last = getData().settings.lastExam;
  const target = last && findExam(last) ? last : exams.length === 1 ? exams[0]!.id : undefined;
  if (target) location.replace(href({ name: "home", examId: target }));
}

/** 表に戻ったときに「今」を進める（期限の来た問題の数が変わる） */
function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const on = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return now;
}

export function App() {
  const route = useRoute();
  const now = useNow();
  const examId = "examId" in route ? route.examId : undefined;
  const exam = examId ? findExam(examId) : undefined;

  useEffect(() => {
    if (examId && !exam) go({ name: "picker" });
    if (exam && getData().settings.lastExam !== exam.id) update(d => setSettings(d, { lastExam: exam.id }));
  }, [examId, exam]);

  // 画面を移ったら先頭から見せる（ハッシュの移動ではブラウザが位置を戻さず、前の画面の位置が残る）
  const here = href(route);
  useEffect(() => {
    scrollTo(0, 0);
  }, [here]);

  const data = useData();
  const theme = data.settings.theme;
  useEffect(() => applyTheme(theme), [theme]);

  const activeHere = data.activeMock?.examId === examId;
  // 練習中と、模擬試験を解いている間は、下のタブを出さず、新しい版への切り替えも待つ
  // 設定は資格の外の画面だが、前回の資格のタブを出して戻れるようにする
  const tabExam =
    exam ??
    (route.name === "settings" || route.name === "help" ? findExam(getData().settings.lastExam ?? "") : undefined);
  const busy = route.name === "practice" || (route.name === "mock" && activeHere);
  let screen;
  if (route.name === "settings") screen = <Settings />;
  else if (route.name === "help") screen = <Help />;
  else if (route.name === "picker" || !exam) screen = <ExamPicker />;
  else if (route.name === "practice") screen = <Practice key={href(route)} exam={exam} only={route.only} now={now} />;
  else if (route.name === "mock") screen = <Mock exam={exam} />;
  else if (route.name === "domains")
    screen = <Domains key={route.domainId ?? ""} exam={exam} domainId={route.domainId} now={now} />;
  else if (route.name === "saved") screen = <Saved exam={exam} />;
  else if (route.name === "task")
    screen = <TaskDetail key={route.taskId} exam={exam} taskId={route.taskId} now={now} />;
  else if (route.name === "learn")
    screen = <Learn key={route.taskId ?? ""} exam={exam} taskId={route.taskId} section={route.section} now={now} />;
  else if (route.name === "search") screen = <Search exam={exam} q={route.q ?? ""} />;
  else if (route.name === "mock-result") screen = <MockResult key={route.at} exam={exam} at={route.at} />;
  else screen = <Home exam={exam} now={now} />;

  return (
    <>
      {APP_ENV !== "prod" && (
        <div class="env-banner">
          {APP_ENV} · {APP_VERSION}
        </div>
      )}
      {screen}
      {tabExam && !busy && <TabBar examId={tabExam.id} current={route.name} />}
      <UpdatePrompt busy={busy} />
    </>
  );
}
