import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import PeriodicTable from "./PeriodicTable";
import { ELEMENTS } from "../data/elements";
import { PROPERTIES, propertyValue, formatSig } from "../data/propertyScale";
import {
  correctFeedback,
  wrongFeedback,
  revealCorrect,
  clearCorrect,
  questionTransition,
  timerBar,
  popScore,
} from "../animations/gameAnimations";

const MODES = [
  { key: "find", label: "Find the Element" },
  { key: "symbol", label: "Find by Symbol" },
  { key: "number", label: "Atomic Number" },
  { key: "property", label: "Property Challenge" },
  { key: "rush", label: "Element Rush" },
];

const RUSH_SECONDS = 45;

function shuffle(arr) {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeOptions(correctEl, count = 4) {
  const sameCat = ELEMENTS.filter(
    (e) => e.number !== correctEl.number && e.category === correctEl.category
  );
  const base = sameCat.length >= count - 1 ? sameCat : ELEMENTS.filter((e) => e.number !== correctEl.number);
  return shuffle([correctEl, ...shuffle(base).slice(0, count - 1)]);
}

function makeStandardQuestion() {
  const el = pick(ELEMENTS);
  return { correct: el.number, correctEl: el, options: makeOptions(el) };
}

function makeExtremumQuestion() {
  const pool = PROPERTIES.filter((p) => p.key !== "atomicMass");
  const cfg = pick(pool);
  const withVal = ELEMENTS.filter((e) => propertyValue(e, cfg.key) != null);
  const wantHighest = Math.random() < 0.5;
  const correctEl = withVal.reduce((a, b) => {
    const va = propertyValue(a, cfg.key);
    const vb = propertyValue(b, cfg.key);
    return wantHighest ? (va > vb ? a : b) : va < vb ? a : b;
  });
  const options = makeOptions(correctEl, 4).filter((e) => propertyValue(e, cfg.key) != null);
  return {
    correct: correctEl.number,
    correctEl,
    options: options.length >= 2 ? options : makeOptions(correctEl, 4),
    cfg,
    wantHighest,
    prompt: `Which element has the ${wantHighest ? "highest" : "lowest"} ${cfg.label.toLowerCase()}?`,
  };
}

function makeClosestQuestion() {
  const target = pick(ELEMENTS);
  const others = shuffle(
    ELEMENTS.filter((e) => e.number !== target.number)
  ).slice(0, 3);
  const options = shuffle([target, ...others]);
  return {
    correct: target.number,
    correctEl: target,
    options,
    prompt: `Which element has atomic mass closest to ${formatSig(target.atomicMass, 5)} u?`,
    showValues: true,
  };
}

function makeRushQuestion() {
  const el = pick(ELEMENTS);
  return { correct: el.number, correctEl: el, options: [] };
}

export default function Game() {
  // Nothing starts (no question generated, no score tracked) until the
  // player explicitly confirms — landing on the tab shouldn't drop them
  // straight into a running round.
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("find");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState("idle");
  const [selIdx, setSelIdx] = useState(-1);
  const [value, setValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const scoreRef = useRef(null);
  const tableRef = useRef(null);
  const optionRefs = useRef([]);
  const timerTLRef = useRef(null);
  const timeoutRef = useRef(null);
// Skip the out/in transition for the very first question — on mount the game
// view is already fading in, so a second fade would flash the freshly mounted
// find-mode table. Run this pre-paint (useLayoutEffect) so the first frame is
// never painted fully visible.
const isFirstQuestionRef = useRef(true);
// The periodic-table cell (or MCQ button) most recently lit up green by
// revealCorrect() after a wrong answer. That glow has no self-clearing
// animation (unlike correctFeedback's), and "Find the Element" reuses the
// same table nodes across questions, so without this it stays lit forever —
// stacking up green cells from every question you've gotten wrong so far.
const revealedNodeRef = useRef(null);

  const newQuestion = useCallback((m) => {
    if (revealedNodeRef.current) {
      clearCorrect(revealedNodeRef.current);
      revealedNodeRef.current = null;
    }
    setFeedback("idle");
    setSelIdx(-1);
    setValue("");
    if (m === "property" && Math.random() < 0.5) {
      setQuestion(makeExtremumQuestion());
    } else if (m === "property") {
      setQuestion(makeClosestQuestion());
    } else if (m === "symbol") {
      const q = makeStandardQuestion();
      setQuestion({ ...q, prompt: "Which element is this?" });
    } else if (m === "number") {
      const q = makeStandardQuestion();
      setQuestion({ ...q, prompt: `Which element is atomic number ${q.correct}?` });
    } else if (m === "rush") {
      setQuestion(makeRushQuestion());
      setTimeLeft(RUSH_SECONDS);
    } else {
      const q = makeStandardQuestion();
      setQuestion({ ...q });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initial question on start / mode change
  useEffect(() => {
    if (!started) return;
    newQuestion(mode);
  }, [started, mode, newQuestion]);

  // question transitions + timers (useLayoutEffect = pre-paint, no flash)
  useLayoutEffect(() => {
    if (!started || !question || !stageRef.current) return;
    if (isFirstQuestionRef.current) {
      isFirstQuestionRef.current = false;
      gsap.from(stageRef.current, {
        opacity: 0,
        y: 14,
        duration: 0.45,
        ease: "power2.out",
      });
    } else {
      questionTransition(stageRef.current);
    }

    if (mode === "rush") {
      if (timerTLRef.current) timerTLRef.current.kill();
      timerTLRef.current = timerBar(stageRef.current.querySelector(".game-timer__bar"), RUSH_SECONDS, () => {
        finish();
      });
      const iv = window.setInterval(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
      return () => window.clearInterval(iv);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  useEffect(() => {
    if (best < score) setBest(score);
  }, [score, best]);

  useEffect(
    () => () => {
      if (timerTLRef.current) timerTLRef.current.kill();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const scoreUp = () => {
    setScore((s) => s + 10);
    setStreak((s) => s + 1);
    popScore(scoreRef.current);
  };

  const finish = useCallback(() => {
    setFeedback("done");
  }, []);

  const next = useCallback((m) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => newQuestion(m), 700);
  }, [newQuestion]);

  const answerMCQ = (el, idx) => {
    if (feedback === "correct" || feedback === "wrong" || !question) return;
    const correct = el.number === question.correct;
    const t = optionRefs.current[idx];
    const correctOpt = optionRefs.current[question.options.findIndex((o) => o.number === question.correct)];
    if (correct) {
      setFeedback("correct");
      setSelIdx(idx);
      scoreUp();
      correctFeedback([t], scoreRef.current);
      next(mode);
    } else {
      setFeedback("wrong");
      setSelIdx(idx);
      wrongFeedback([t]);
      revealCorrect(correctOpt);
      revealedNodeRef.current = correctOpt;
      setStreak(0);
      next(mode);
    }
  };

  const answerFind = (el, node) => {
    if (feedback === "correct" || feedback === "wrong" || !question) return;
    const correct = el.number === question.correct;
    if (correct) {
      setFeedback("correct");
      scoreUp();
      correctFeedback([node], scoreRef.current);
      next(mode);
    } else {
      setFeedback("wrong");
      wrongFeedback([node]);
      setStreak(0);
      const right = tableRef.current ? tableRef.current.getNode(question.correct) : null;
      revealCorrect(right);
      revealedNodeRef.current = right;
      next(mode);
    }
  };

  const submitRush = (e) => {
    e.preventDefault();
    if (feedback !== "idle" || !question || !value.trim()) return;
    const ok = value.trim().toLowerCase() === question.correctEl.name.toLowerCase();
    if (ok) {
      setFeedback("correct");
      scoreUp();
      setTimeout(() => newQuestion("rush"), 350);
    } else {
      slideCorrectRush();
    }
  };

  const slideCorrectRush = () => {
    setFeedback("doneRush");
    if (question) {
      const tmp = `${question.correctEl.name} (${question.correctEl.symbol})`;
      setValue(tmp);
      setStreak(0);
      setTimeout(() => newQuestion("rush"), 800);
    }
  };

  const optionFeedbackClass = (idx) => {
    if (question && idx === question.options.findIndex((o) => o.number === question.correct)) {
      if (feedback === "correct") return " is-correct";
      if (feedback === "wrong") return " is-correct";
    }
    if (idx === selIdx && feedback === "wrong") return " is-wrong";
    return "";
  };

  const optionValue = (el) => {
    if (question && question.cfg) {
      const v = propertyValue(el, question.cfg.key);
      return v != null ? formatSig(v, 4) : "N/A";
    }
    if (question && question.showValues) return `${formatSig(el.atomicMass, 5)} u`;
    return null;
  };

  if (!started) {
    return (
      <div className="game game--intro" ref={rootRef}>
        <div className="game-intro">
          <span className="game-intro__eyebrow">Element Quiz</span>
          <h2 className="game-intro__title">Ready to test your knowledge?</h2>
          <p className="game-intro__hint">Pick a mode, then jump in whenever you're ready.</p>
          <div className="game__modes game-intro__modes">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`game-mode-pill${mode === m.key ? " is-active" : ""}`}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button type="button" className="game-intro__play" onClick={() => setStarted(true)}>
            Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game" ref={rootRef}>
      <div className="game__top">
        <div className="game__modes">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`game-mode-pill${mode === m.key ? " is-active" : ""}`}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="game__stats">
          <div className="game-stat">
            <span className="game-stat__label">Score</span>
            <span className="game-stat__value" ref={scoreRef}>
              {score}
            </span>
          </div>
          <div className="game-stat">
            <span className="game-stat__label">Streak</span>
            <span className="game-stat__value">{streak}</span>
          </div>
          <div className="game-stat">
            <span className="game-stat__label">Best</span>
            <span className="game-stat__value">{best}</span>
          </div>
        </div>
      </div>

      <div className="game__stage" ref={stageRef}>
        {mode === "find" && question && (
<div className="game-find">
              <div className="game-prompt">
                <span className="game-prompt__eyebrow">Find the Element</span>
                <strong className="game-prompt__title">{question.correctEl.name}</strong>
                <span className="game-prompt__hint">
                  Click the matching card on the table · category:{" "}
                  {question.correctEl.category}
                </span>
                {feedback === "correct" && (
                  <span className="game-feedback game-feedback--ok">✓ Correct · +10</span>
                )}
                {feedback === "wrong" && (
                  <span className="game-feedback game-feedback--no">✕ Incorrect</span>
                )}
              </div>
              <div className="table-scroll">
                <PeriodicTable
                  ref={tableRef}
                  mode="wide"
                  hoverEnabled={false}
                  onSelect={answerFind}
                  className="game-table"
                />
              </div>
            </div>
        )}

        {(mode === "symbol" || mode === "number" || mode === "property") &&
          question &&
          question.options && (
            <div className="game-mcq">
            <div className="game-prompt">
              <span className="game-prompt__eyebrow">
                {mode === "symbol"
                  ? "Identify the Symbol"
                  : mode === "number"
                  ? "Atomic Number Challenge"
                  : "Property Challenge"}
              </span>
              {mode === "symbol" && (
                <span className="game-prompt__symbol">{question.correctEl.symbol}</span>
              )}
              <strong className="game-prompt__title">{question.prompt}</strong>
            </div>
            <div className="game-options">
              {question.options.map((el, idx) => {
                const val = optionValue(el);
                return (
                  <button
                    key={el.number}
                    type="button"
                    className={`game-option${optionFeedbackClass(idx)}`}
                    ref={(r) => {
                      optionRefs.current[idx] = r;
                    }}
                    onClick={() => answerMCQ(el, idx)}
                  >
                    <span className="game-option__name">{el.name}</span>
                    {val != null && <span className="game-option__value">{val}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "rush" && question && (
          <form className="game-rush" onSubmit={submitRush}>
            <div className="game-prompt">
              <span className="game-prompt__eyebrow">Timed Element Rush</span>
              <span className="game-prompt__symbol">{question.correctEl.symbol}</span>
              <strong className="game-prompt__title">Type the element name</strong>
              <div className="game-timer">
                <span className="game-timer__bar" />
                <span className="game-timer__text">{timeLeft}s</span>
              </div>
            </div>
            <div className="game-rush__row">
              <input
                className="game-rush__input"
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                placeholder="e.g. oxygen"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={feedback !== "idle"}
              />
              <button type="submit" className="game-rush__submit" disabled={!value.trim()}>
                Answer
              </button>
              <button
                type="button"
                className="game-rush__skip"
                onClick={slideCorrectRush}
                disabled={feedback !== "idle"}
              >
                Skip
              </button>
            </div>
            {feedback === "done" && (
              <p className="game-feedback game-feedback--time">⏱ Time up! Final score {score}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}