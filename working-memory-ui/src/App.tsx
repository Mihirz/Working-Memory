import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, Clock, History, Brain, Sun, Moon } from "lucide-react";

// ---------- Utility helpers ----------
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ---------- Faux data ----------
const seedSessions = [
  {
    id: "s-104",
    title: "Deep work: sprint planning notes",
    startedAt: Date.now() - 1000 * 60 * 60 * 4 - 1000 * 60 * 10,
    endedAt: Date.now() - 1000 * 60 * 60 * 2 - 1000 * 60 * 37,
    tags: ["docs", "planning"],
    highlights: [
      "Summarized stakeholder inputs",
      "Auto-captured edits in Spec_v3.md",
      "Generated task list",
    ],
  },
  {
    id: "s-103",
    title: "Code focus: vector search POC",
    startedAt: Date.now() - 1000 * 60 * 60 * 26,
    endedAt: Date.now() - 1000 * 60 * 60 * 23 - 1000 * 60 * 12,
    tags: ["coding", "prototype"],
    highlights: [
      "Benchmarked kNN top-k=50",
      "Flagged memory spike in worker",
      "Saved log snapshot",
    ],
  },
  {
    id: "s-102",
    title: "Design review prep",
    startedAt: Date.now() - 1000 * 60 * 60 * 48 - 1000 * 60 * 34,
    endedAt: Date.now() - 1000 * 60 * 60 * 46 - 1000 * 60 * 2,
    tags: ["design", "slides"],
    highlights: [
      "Drafted outline in slides",
      "Pulled latest metrics",
      "Generated talking points",
    ],
  },
];

// ---------- Re-usable UI bits ----------
const GlassCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div
    className={classNames(
      "relative rounded-2xl p-4 sm:p-6 lg:p-8",
      "bg-white/70 backdrop-blur-md dark:bg-white/10",
      "ring-1 ring-slate-200 dark:ring-white/10 shadow-md dark:shadow-lg",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/70 via-transparent to-white/40 dark:from-transparent dark:via-transparent dark:to-transparent" />
    <div className="relative">{children}</div>
  </div>
);
const Pill: React.FC<React.PropsWithChildren<{ glow?: boolean; className?: string }>> = ({ glow, className, children }) => (
  <span
    className={classNames(
      "inline-flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
      "bg-slate-100 text-slate-800 ring-1 ring-slate-300",
      // Dark mode: make pill darker than the card (no washed-out gray)
      "dark:bg-slate-900/60 dark:text-white dark:ring-white/20",
      className
    )}
  >
    {children}
  </span>
);

// ---------- Main component ----------
export default function AgentWorkSessionUI() {
  const [isActive, setIsActive] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [sessions, setSessions] = useState(seedSessions);
  const [page, setPage] = useState<"about" | "workflows" | "flow">("flow");

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem("wm-theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      window.localStorage.setItem("wm-theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("wm-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (!isActive || !startAt) return;
    const id = setInterval(() => setElapsed(Date.now() - startAt), 250);
    return () => clearInterval(id);
  }, [isActive, startAt]);

  const canStart = !isActive;
  const canStop = isActive;

  const handleStart = () => {
    if (isActive) return;
    setIsActive(true);
    const now = Date.now();
    setStartAt(now);
    setElapsed(0);
  };

  const handleStop = () => {
    if (!isActive || !startAt) return;
    const endedAt = Date.now();
    const newSession = {
      id: `s-${Math.random().toString(36).slice(2, 7)}`,
      title: "Focused session",
      startedAt: startAt,
      endedAt,
      tags: [],
      highlights: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setIsActive(false);
    setStartAt(null);
    setElapsed(0);
  };

  const elapsedText = useMemo(() => formatDuration(elapsed), [elapsed]);

  return (
    <div className="min-h-[100vh] w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[34rem] w-[34rem] rounded-full bg-indigo-300/20 blur-[90px] dark:bg-indigo-400/10" />
        <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-indigo-200/20 blur-[90px] dark:bg-indigo-300/10" />
        <div className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-slate-300/30 blur-[70px] dark:bg-white/5" />
        <div className="absolute inset-x-0 top-24 mx-auto h-56 max-w-4xl bg-gradient-to-r from-white/60 via-white/40 to-transparent blur-xl dark:from-white/5 dark:via-white/5" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          {/* Left: Logo */}
          <button
            className="flex items-center gap-2 text-slate-900 dark:text-slate-100 transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
            onClick={() => setPage("flow")}
            aria-label="Working Memory Home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900/5 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/15">
              <Brain className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold">Working Memory</span>
          </button>

          {/* Center: Nav items */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <button
              onClick={() => setPage("about")}
              className={classNames(
                "rounded-md px-3 py-2 transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
                page === "about"
                  ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
              )}
            >
              About
            </button>
            <button
              onClick={() => setPage("workflows")}
              className={classNames(
                "rounded-md px-3 py-2 transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
                page === "workflows"
                  ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
              )}
            >
              Past workflows
            </button>
            <button
              onClick={() => setPage("flow")}
              className={classNames(
                "rounded-md px-3 py-2 transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
                page === "flow"
                  ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
              )}
            >
              Flow
            </button>
          </nav>

          {/* Right: Theme toggle + Start/Stop */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-slate-300 bg-white/70 text-slate-900 hover:bg-white dark:ring-white/20 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/15 transition-all duration-200 hover:scale-[1.05] hover:brightness-110"
              aria-label="Toggle theme"
              title="Toggle light/dark"
            >
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <motion.button
              onClick={isActive ? handleStop : handleStart}
              whileTap={{ scale: 0.98 }}
              className={
                classNames(
                  "inline-flex items-center justify-center gap-3 rounded-lg px-5 py-2.5 font-semibold",
                  "ring-1 focus:outline-none focus:ring-2 focus:ring-offset-0",
                  isActive
                    ? "bg-gradient-to-b from-rose-600 to-rose-700 ring-rose-300/40 focus:ring-rose-300/60"
                    : "bg-gradient-to-b from-indigo-500 to-indigo-600 ring-indigo-300/40 focus:ring-indigo-300/60",
                  "text-white shadow-lg hover:brightness-110 transition-all duration-200 hover:scale-[1.04]"
                )
              }
              aria-label={isActive ? "Stop session" : "Start session"}
            >
              {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="text-sm">{isActive ? "Stop" : "Start"}</span>
              <span className="tabular-nums text-sm font-mono w-[8ch] text-center">
                {isActive ? elapsedText : "00:00:00"}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Mobile nav (optional minimal) */}
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 pb-3 md:hidden">
          <button
            onClick={() => setPage("about")}
            className={classNames(
              "rounded-md px-3 py-1.5 text-sm transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
              page === "about"
                ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
            )}
          >
            About
          </button>
          <button
            onClick={() => setPage("workflows")}
            className={classNames(
              "rounded-md px-3 py-1.5 text-sm transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
              page === "workflows"
                ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
            )}
          >
            Past workflows
          </button>
          <button
            onClick={() => setPage("flow")}
            className={classNames(
              "rounded-md px-3 py-1.5 text-sm transition-all duration-200 hover:scale-[1.03] hover:brightness-110",
              page === "flow"
                ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
            )}
          >
            Flow
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {page === "about" && (
          <section>
            <GlassCard>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white/90">About Working Memory</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-white/85">
                <li>Click <span className="font-semibold">Start</span> in the top-right to begin a focused session.</li>
                <li>Work as usual. The timer keeps running; click <span className="font-semibold">Stop</span> when you’re done.</li>
                <li>Review your saved sessions on the <span className="font-semibold">Past workflows</span> page.</li>
              </ol>
              <p className="mt-4 text-sm text-slate-600 dark:text-white/70">Tip: You can keep the Start/Stop button visible while navigating between pages.</p>
            </GlassCard>
          </section>
        )}

        {page === "workflows" && (
          <section className="space-y-6">
            <GlassCard>
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white/90">Past workflows</h3>
              </div>

              <div className="divide-y divide-white/10">
                {sessions.map((s) => {
                  const duration = s.endedAt - s.startedAt;
                  const started = new Date(s.startedAt).toLocaleString();
                  const ended = new Date(s.endedAt).toLocaleString();
                  return (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid place-items-center rounded-lg bg-slate-900/5 p-2 ring-1 ring-slate-200 dark:bg-white/8 dark:ring-white/10">
                          <Clock className="h-5 w-5 text-slate-800 dark:text-white/90" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.title}</div>
                          <div className="mt-0.5 text-xs text-slate-600 dark:text-white/60">{started} → {ended}</div>
                        </div>
                      </div>
                      <Pill>{formatDuration(duration)}</Pill>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </section>
        )}

        {page === "flow" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <GlassCard>
                <div>
                  <div className="text-sm uppercase tracking-widest text-slate-600 dark:text-white/60">Current session</div>
                  <div className="mt-2 text-4xl font-bold tabular-nums">{isActive ? elapsedText : "00:00:00"}</div>
                  <div className="mt-1 text-slate-600 dark:text-white/60">Use the Start/Stop button in the top-right.</div>
                </div>
              </GlassCard>
            </div>
            <div className="lg:col-span-2">
              <GlassCard>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white/90">Notes</h3>
                <p className="mt-2 text-sm text-slate-700 dark:text-white/70">Jot down anything relevant to your current flow here (optional). This is a placeholder—wire to your backend if needed.</p>
              </GlassCard>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
