import { useEffect, useState } from "preact/hooks";
import { APP_ENV, APP_VERSION } from "./env";
import { findExam } from "./exams";
import { setSettings } from "./store/actions";
import { getData, update } from "./store/store";
import { go, href, useRoute } from "./ui/route";
import { ExamPicker } from "./ui/screens/ExamPicker";
import { Home } from "./ui/screens/Home";
import { Practice } from "./ui/screens/Practice";
import { TabBar } from "./ui/TabBar";
import { UpdatePrompt } from "./ui/UpdatePrompt";

/** 起動したとき、ハッシュが無ければ前回の資格を開く */
export function startRoute(): void {
  const last = getData().settings.lastExam;
  if (!location.hash && last && findExam(last)) location.replace(href({ name: "home", examId: last }));
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

  const busy = route.name === "practice" || route.name === "mock";
  let screen;
  if (route.name === "picker" || !exam) screen = <ExamPicker />;
  else if (route.name === "practice") screen = <Practice key={href(route)} exam={exam} only={route.only} now={now} />;
  else screen = <Home exam={exam} now={now} />;

  return (
    <>
      {APP_ENV !== "prod" && (
        <div class="env-banner">
          {APP_ENV} · {APP_VERSION}
        </div>
      )}
      {screen}
      {exam && !busy && <TabBar examId={exam.id} current={route.name} />}
      <UpdatePrompt busy={busy} />
    </>
  );
}
