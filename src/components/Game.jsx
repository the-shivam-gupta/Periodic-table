import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  FiHelpCircle,
  FiMapPin,
  FiZap,
  FiUsers,
  FiClock,
  FiGrid,
  FiArrowLeft,
} from "react-icons/fi";
import PeriodicTable from "./PeriodicTable";
import { ELEMENTS } from "../data/elements";
import { PROPERTIES, propertyValue, formatSig } from "../data/propertyScale";
import { titleCategory } from "../data/categories";
import {
  correctFeedback,
  wrongFeedback,
  revealCorrect,
  clearCorrect,
  questionTransition,
  timerBar,
  popScore,
  entrance,
} from "../animations/gameAnimations";

const RUSH_SECONDS = 45;
const MEMORY_PAIRS = 6;
const BEST_KEY_PREFIX = "pt-game-best-";

const GAMES = [
  {
    key: "quiz",
    label: "Element Quiz",
    desc: "Test your knowledge of symbols.",
    icon: FiHelpCircle,
    difficulty: "Easy",
    accent: "#3B6FE0",
  },
  {
    key: "find",
    label: "Find the Element",
    desc: "Spot it on the periodic table.",
    icon: FiMapPin,
    difficulty: "Medium",
    accent: "#12968C",
  },
  {
    key: "property",
    label: "Guess the Property",
    desc: "Guess mass, density & more.",
    icon: FiZap,
    difficulty: "Hard",
    accent: "#7A4FC4",
  },
  {
    key: "group",
    label: "Group Challenge",
    desc: "Identify the right chemical group.",
    icon: FiUsers,
    difficulty: "Medium",
    accent: "#2F9E62",
  },
  {
    key: "rush",
    label: "Speed Round",
    desc: "Answer fast, score big.",
    icon: FiClock,
    difficulty: "Hard",
    accent: "#C8952A",
  },
  {
    key: "memory",
    label: "Memory Match",
    desc: "Match symbols with element names.",
    icon: FiGrid,
    difficulty: "Easy",
    accent: "#C74E93",
  },
];

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

function readBest(key) {
  try {
    return Number(window.localStorage.getItem(BEST_KEY_PREFIX + key)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(key, value) {
  try {
    window.localStorage.setItem(BEST_KEY_PREFIX + key, String(value));
  } catch {
    /* ignore — best score is a nice-to-have, not required to function */
  }
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

function makeGroupQuestion() {
  const withCategory = ELEMENTS.filter((e) => e.category);
  const el = pick(withCategory);
  const allCategories = Array.from(new Set(withCategory.map((e) => e.category)));
  const distractors = shuffle(allCategories.filter((c) => c !== el.category)).slice(0, 3);
  const categoryOptions = shuffle([el.category, ...distractors]);
  return {
    correct: el.number,
    correctEl: el,
    correctCategory: el.category,
    categoryOptions,
    prompt: `Which chemical group does ${el.name} (${el.symbol}) belong to?`,
  };
}

function makeMemoryDeck() {
  const chosen = shuffle(ELEMENTS).slice(0, MEMORY_PAIRS);
  const cards = [];
  chosen.forEach((el) => {
    cards.push({ id: `${el.number}-symbol`, number: el.number, type: "symbol", text: el.symbol });
    cards.push({ id: `${el.number}-name`, number: el.number, type: "name", text: el.name });
  });
  return shuffle(cards);
}

// Short, factual "why" explanation shown after every answer — every game
// mode gets one, built straight from the same dataset that powers the rest
// of the app, never invented.
function explainAnswer(mode, question) {
  if (!question || !question.correctEl) return "";
  const el = question.correctEl;
  if (mode === "quiz" || mode === "find") {
    return `${el.symbol} is the symbol for ${el.name} (atomic number ${el.number}), a ${el.category || "element"} in group ${
      el.group ?? "—"
    }, period ${el.period ?? "—"}.`;
  }
  if (mode === "property") {
    if (question.cfg) {
      const v = propertyValue(el, question.cfg.key);
      const unit = question.cfg.unit ? ` ${question.cfg.unit}` : "";
      return `${el.name} has the ${question.wantHighest ? "highest" : "lowest"} ${question.cfg.label.toLowerCase()} among the choices, at ${question.cfg.fmt(v)}${unit}.`;
    }
    if (question.showValues) {
      return `${el.name} has an atomic mass of ${formatSig(el.atomicMass, 5)} u — the closest match.`;
    }
  }
  if (mode === "group") {
    return `${el.name} is classed as ${titleCategory(question.correctCategory)}${
      el.group != null ? ` (Group ${el.group})` : ""
    }.`;
  }
  return "";
}

export default function Game() {
  const [activeGame, setActiveGame] = useState(null);
  const [mode, setMode] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState("idle");
  const [selIdx, setSelIdx] = useState(-1);
  const [value, setValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);
  const [memoryDeck, setMemoryDeck] = useState([]);
  const [memoryFlipped, setMemoryFlipped] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [bestScores, setBestScores] = useState(() =>
    Object.fromEntries(GAMES.map((g) => [g.key, readBest(g.key)]))
  );

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const scoreRef = useRef(null);
  const tableRef = useRef(null);
  const optionRefs = useRef([]);
  const memoryCardRefs = useRef({});
  const timerTLRef = useRef(null);
  const timeoutRef = useRef(null);
  const isFirstQuestionRef = useRef(true);
  const revealedNodeRef = useRef(null);
  const landingRef = useRef(null);

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
    } else if (m === "quiz") {
      const q = makeStandardQuestion();
      setQuestion({ ...q, prompt: "Which element is this?" });
    } else if (m === "group") {
      setQuestion(makeGroupQuestion());
    } else if (m === "rush") {
      setQuestion(makeRushQuestion());
      setTimeLeft(RUSH_SECONDS);
    } else {
      const q = makeStandardQuestion();
      setQuestion({ ...q });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = (key) => {
    setActiveGame(key);
    setMode(key);
    setScore(0);
    setStreak(0);
    setBest(bestScores[key] || 0);
    isFirstQuestionRef.current = true;
    if (key === "memory") {
      setMemoryDeck(makeMemoryDeck());
      setMemoryFlipped([]);
      setMemoryMatched([]);
      setMemoryMoves(0);
      setMemoryBusy(false);
    } else {
      newQuestion(key);
    }
  };

  const backToGames = () => {
    if (timerTLRef.current) timerTLRef.current.kill();
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setActiveGame(null);
    setMode(null);
    setQuestion(null);
  };

  // question transitions + timers (useLayoutEffect = pre-paint, no flash)
  useLayoutEffect(() => {
    if (!mode || mode === "memory" || !question || !stageRef.current) return;
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
    if (!mode) return;
    if (best < score) {
      setBest(score);
      setBestScores((b) => ({ ...b, [mode]: score }));
      writeBest(mode, score);
    }
  }, [score, best, mode]);

  useEffect(
    () => () => {
      if (timerTLRef.current) timerTLRef.current.kill();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  useLayoutEffect(() => {
    if (activeGame) return;
    const ctx = gsap.context(() => {
      entrance(landingRef.current?.querySelectorAll(".game-card"));
    }, landingRef);
    return () => ctx.revert();
  }, [activeGame]);

  const scoreUp = () => {
    setScore((s) => s + 10);
    setStreak((s) => s + 1);
    popScore(scoreRef.current);
  };

  const finish = useCallback(() => {
    setFeedback("done");
  }, []);

  // Quiz / Property / Group / Find all pause on an answer — correct or
  // wrong — and wait for the player to click "Next Question" rather than
  // auto-advancing on a timer, so there's actually time to read the
  // explanation instead of it disappearing mid-sentence. Speed Round is the
  // one exception by design: continuous pace is the whole point of it, so it
  // keeps its own timed auto-advance untouched.
  const goNext = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    newQuestion(mode);
  }, [newQuestion, mode]);

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
    } else {
      setFeedback("wrong");
      setSelIdx(idx);
      wrongFeedback([t]);
      revealCorrect(correctOpt);
      revealedNodeRef.current = correctOpt;
      setStreak(0);
    }
  };

  const answerGroup = (category, idx) => {
    if (feedback === "correct" || feedback === "wrong" || !question) return;
    const correct = category === question.correctCategory;
    const t = optionRefs.current[idx];
    const correctIdx = question.categoryOptions.findIndex((c) => c === question.correctCategory);
    const correctOpt = optionRefs.current[correctIdx];
    if (correct) {
      setFeedback("correct");
      setSelIdx(idx);
      scoreUp();
      correctFeedback([t], scoreRef.current);
    } else {
      setFeedback("wrong");
      setSelIdx(idx);
      wrongFeedback([t]);
      revealCorrect(correctOpt);
      revealedNodeRef.current = correctOpt;
      setStreak(0);
    }
  };

  const answerFind = (el, node) => {
    if (feedback === "correct" || feedback === "wrong" || !question) return;
    const correct = el.number === question.correct;
    if (correct) {
      setFeedback("correct");
      scoreUp();
      correctFeedback([node], scoreRef.current);
    } else {
      setFeedback("wrong");
      wrongFeedback([node]);
      setStreak(0);
      const right = tableRef.current ? tableRef.current.getNode(question.correct) : null;
      revealCorrect(right);
      revealedNodeRef.current = right;
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

  // --- Memory Match ---
  const memoryCardNode = (id) => memoryCardRefs.current[id] || null;

  const flipMemoryCard = (card) => {
    if (memoryBusy || memoryMatched.includes(card.number) || memoryFlipped.some((f) => f.id === card.id)) {
      return;
    }
    if (memoryFlipped.length === 0) {
      setMemoryFlipped([card]);
      return;
    }
    if (memoryFlipped.length === 1) {
      const first = memoryFlipped[0];
      const second = card;
      setMemoryFlipped([first, second]);
      setMemoryBusy(true);
      setMemoryMoves((m) => m + 1);
      const isMatch = first.number === second.number && first.type !== second.type;
      window.setTimeout(() => {
        if (isMatch) {
          correctFeedback(
            [memoryCardNode(first.id), memoryCardNode(second.id)].filter(Boolean),
            scoreRef.current
          );
          setMemoryMatched((m) => [...m, first.number]);
          setScore((s) => s + 10);
        } else {
          wrongFeedback([memoryCardNode(first.id), memoryCardNode(second.id)].filter(Boolean));
        }
        setMemoryFlipped([]);
        setMemoryBusy(false);
      }, 700);
    }
  };

  const memoryDone = memoryMatched.length === MEMORY_PAIRS && MEMORY_PAIRS > 0;

  useEffect(() => {
    if (mode === "memory" && memoryDone) {
      if (best < score) {
        setBest(score);
        setBestScores((b) => ({ ...b, memory: score }));
        writeBest("memory", score);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryDone]);

  const optionFeedbackClass = (idx) => {
    if (question && idx === question.options?.findIndex((o) => o.number === question.correct)) {
      if (feedback === "correct" || feedback === "wrong") return " is-correct";
    }
    if (idx === selIdx && feedback === "wrong") return " is-wrong";
    return "";
  };

  const categoryOptionFeedbackClass = (idx) => {
    if (question && question.categoryOptions?.[idx] === question.correctCategory) {
      if (feedback === "correct" || feedback === "wrong") return " is-correct";
    }
    if (idx === selIdx && feedback === "wrong") return " is-wrong";
    return "";
  };

  // --- Landing: choose a game ---
  if (!activeGame) {
    return (
      <div className="game game--landing" ref={landingRef}>
        <div className="game-landing__head">
          <p className="game-landing__eyebrow">Games</p>
          <h2 className="game-landing__title">Learn Chemistry by Playing</h2>
          <p className="game-landing__subtitle">Test your knowledge of the elements.</p>
        </div>

        <div className="games-panel">
        <div className="game-cards">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <div className="game-card" key={g.key} style={{ "--game-accent": g.accent }}>
                <span className="game-card__icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3 className="game-card__name">{g.label}</h3>
                <p className="game-card__desc">{g.desc}</p>
                <span className="game-card__difficulty">{g.difficulty}</span>
                <span className="game-card__best">Best: {bestScores[g.key] || 0}</span>
                <button type="button" className="game-card__play" onClick={() => startGame(g.key)}>
                  Play Now
                </button>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  const activeMeta = GAMES.find((g) => g.key === activeGame);

  return (
    <div className="game" ref={rootRef}>
      <div className="game__top">
        <button type="button" className="game-back" onClick={backToGames}>
          <FiArrowLeft aria-hidden="true" /> All games
        </button>
        <div className="game__top-title">{activeMeta?.label}</div>
        <div className="game__stats">
          <div className="game-stat">
            <span className="game-stat__label">Score</span>
            <span className="game-stat__value" ref={scoreRef}>
              {score}
            </span>
          </div>
          {mode !== "memory" && (
            <div className="game-stat">
              <span className="game-stat__label">Streak</span>
              <span className="game-stat__value">{streak}</span>
            </div>
          )}
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
              {(feedback === "correct" || feedback === "wrong") && (
                <>
                  <p className="game-explain">{explainAnswer("find", question)}</p>
                  <button type="button" className="game-next-btn" onClick={goNext}>
                    Next Question →
                  </button>
                </>
              )}
            </div>
            <div className="table-scroll">
              <PeriodicTable
                ref={tableRef}
                mode="wide"
                hoverEnabled={false}
                onSelect={answerFind}
                showNames={false}
                className="game-table"
              />
            </div>
          </div>
        )}

        {(mode === "quiz" || mode === "property") && question && question.options && (
          <div className="game-mcq">
            <div className="game-prompt">
              <span className="game-prompt__eyebrow">
                {mode === "quiz" ? "Identify the Element" : "Property Challenge"}
              </span>
              {mode === "quiz" && (
                <span className="game-prompt__symbol">{question.correctEl.symbol}</span>
              )}
              <strong className="game-prompt__title">{question.prompt}</strong>
            </div>
            <div className="game-options">
              {question.options.map((el, idx) => {
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
                  </button>
                );
              })}
            </div>
            {(feedback === "correct" || feedback === "wrong") && (
              <>
                <p className="game-explain">{explainAnswer("property", question)}</p>
                <button type="button" className="game-next-btn" onClick={goNext}>
                  Next Question →
                </button>
              </>
            )}
          </div>
        )}

        {mode === "group" && question && question.categoryOptions && (
          <div className="game-mcq">
            <div className="game-prompt">
              <span className="game-prompt__eyebrow">Group Challenge</span>
              <span className="game-prompt__symbol">{question.correctEl.symbol}</span>
              <strong className="game-prompt__title">{question.prompt}</strong>
            </div>
            <div className="game-options">
              {question.categoryOptions.map((cat, idx) => (
                <button
                  key={cat}
                  type="button"
                  className={`game-option${categoryOptionFeedbackClass(idx)}`}
                  ref={(r) => {
                    optionRefs.current[idx] = r;
                  }}
                  onClick={() => answerGroup(cat, idx)}
                >
                  <span className="game-option__name">{titleCategory(cat)}</span>
                </button>
              ))}
            </div>
            {(feedback === "correct" || feedback === "wrong") && (
              <>
                <p className="game-explain">{explainAnswer("group", question)}</p>
                <button type="button" className="game-next-btn" onClick={goNext}>
                  Next Question →
                </button>
              </>
            )}
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

        {mode === "memory" && (
          <div className="game-memory">
            <div className="game-prompt">
              <span className="game-prompt__eyebrow">Memory Match</span>
              <strong className="game-prompt__title">
                Match each symbol with its element name
              </strong>
              <span className="game-prompt__hint">Moves: {memoryMoves}</span>
            </div>

            {memoryDone ? (
              <div className="game-memory__done">
                <p className="game-feedback game-feedback--ok">
                  ✓ All matched in {memoryMoves} moves · +{memoryMatched.length * 10} points
                </p>
                <button
                  type="button"
                  className="game-card__play"
                  onClick={() => {
                    setMemoryDeck(makeMemoryDeck());
                    setMemoryFlipped([]);
                    setMemoryMatched([]);
                    setMemoryMoves(0);
                    setScore(0);
                    setStreak(0);
                  }}
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="game-memory__grid">
                {memoryDeck.map((card) => {
                  const isFlipped =
                    memoryFlipped.some((f) => f.id === card.id) || memoryMatched.includes(card.number);
                  const isMatched = memoryMatched.includes(card.number);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`game-memory-card${isFlipped ? " is-flipped" : ""}${
                        isMatched ? " is-matched" : ""
                      }`}
                      ref={(r) => {
                        memoryCardRefs.current[card.id] = r;
                      }}
                      onClick={() => flipMemoryCard(card)}
                      disabled={isMatched}
                    >
                      <span className="game-memory-card__face game-memory-card__face--back">?</span>
                      <span className="game-memory-card__face game-memory-card__face--front">
                        {card.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
