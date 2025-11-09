import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, Clock, History, Brain, Sun, Moon, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import axios from "axios";

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
const seedSessions: any[] = [];

// ---------- Re-usable UI bits ----------
const GlassCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div
    className={classNames(
      "relative rounded-2xl p-5 sm:p-7 lg:p-9",
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
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");

  const [sessions, setSessions] = useState(seedSessions);
  const [page, setPage] = useState<"about" | "workflows" | "flow" | "detail" | "day">("flow");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [wfView, setWfView] = useState<"list" | "calendar">("list");
  const [monthOffset, setMonthOffset] = useState(0);
  const [backTarget, setBackTarget] = useState<{ page: "workflows" | "day"; day?: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState("");

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

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s: any) => s.id !== id));
    if (selectedSession && selectedSession.id === id) {
      setSelectedSession(null);
      setPage("workflows");
    }
  };

  const handleCancel = () => {
    if (!isActive) return;
    // Do not save a session; simply reset timers/state
    setIsActive(false);
    setStartAt(null);
    setElapsed(0);
    setSessionTitle("");
    setSessionDescription("");
  };

  const handleStart = () => {
    if (isActive) return;
    setIsActive(true);
    const now = Date.now();
    setStartAt(now);
    setElapsed(0);
    setSummaryNotes("");
  };

  const handleStop = async () => {
    if (!isActive || !startAt) return;
    
    setIsActive(false);
    setIsLoading(true);
    const endedAt = Date.now();

    const project = "/Users/gary/Stuff/DummyProject";
    const taskDescription = sessionDescription.trim();
    const payload: { user_id: string; project_path: string; task_description?: string | null } = {
        user_id: "garysun",
        project_path: project,
    };

    if (taskDescription) {
        payload.task_description = taskDescription;
    }

    try {
      console.log("Calling agent backend with payload:" + payload);
      
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/workflow/end",
        payload
      );
      
      console.log("Agent response:", response.data);
      const summary = response.data.summary_markdown;
      
      // --- Save the summary to our state
      setSummaryNotes(summary); 
      
      // --- Create a new session for the UI
      const title = sessionTitle.trim();
      const newSession = {
        id: `s-${Math.random().toString(36).slice(2, 7)}`,
        title,
        description: sessionDescription,
        notes: summary, // --- Add the real summary here
        startedAt: startAt,
        endedAt,
        tags: [],
        highlights: [],
      };
      setSessions((prev) => [newSession, ...prev]);

    } catch (error) {
      console.error("Failed to call agent:", error);
      const errorMsg = "Error: Could not save session. Is the backend server running?";
      setSummaryNotes(errorMsg);
      alert(errorMsg);
    }

    setIsLoading(false);
    setStartAt(null);
    setElapsed(0);
    setSessionDescription("");
    setSessionTitle("");
    // const title = sessionTitle.trim() ? sessionTitle.trim() : "Focused session";
    // const newSession = {
    //   id: `s-${Math.random().toString(36).slice(2, 7)}`,
    //   title,
    //   description: sessionDescription,
    //   notes: "",
    //   startedAt: startAt,
    //   endedAt,
    //   tags: [],
    //   highlights: [],
    // };
    // setSessions((prev) => [newSession, ...prev]);
    // setIsActive(false);
    // setStartAt(null);
    // setElapsed(0);
    // setSessionDescription("");
    // setSessionTitle("");
  };

  const elapsedText = useMemo(() => formatDuration(elapsed), [elapsed]);

  // Choose the month to display: latest session's month or current month, then apply offset
  const baseDate = useMemo(() => {
    if (!sessions || sessions.length === 0) return new Date();
    const latest = [...sessions].sort((a: any, b: any) => b.startedAt - a.startedAt)[0].startedAt;
    return new Date(latest);
  }, [sessions]);

  const displayDate = useMemo(() => {
    const d = new Date(baseDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [baseDate, monthOffset]);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth(); // 0-indexed

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayIdx = useMemo(() => new Date(year, month, 1).getDay(), [year, month]); // 0=Sun

  const sessionsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    sessions.forEach((s: any) => {
      const d = new Date(s.startedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-8 py-5">
          {/* Left: Logo */}
          <button
            className="flex items-center gap-2 text-slate-900 dark:text-slate-100 transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
            onClick={() => { setBackTarget(null); setSelectedSession(null); setPage("flow"); }}
            aria-label="Working Memory Home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900/5 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/15">
              <Brain className="h-4 w-4" />
            </span>
            <span className="text-[1.15rem] font-semibold">Working Memory</span>
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
              onClick={() => { setBackTarget(null); setPage("workflows"); }}
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
              disabled={isLoading || (isActive ? !canStop : !canStart)}
              className={
                classNames(
                  "inline-flex items-center justify-center gap-3 rounded-lg px-5 py-2.5 font-semibold",
                  "ring-1 focus:outline-none focus:ring-2 focus:ring-offset-0",
                  isActive
                    ? "bg-gradient-to-b from-rose-600 to-rose-700 ring-rose-300/40 focus:ring-rose-300/60"
                    : "bg-gradient-to-b from-indigo-500 to-indigo-600 ring-indigo-300/40 focus:ring-indigo-300/60",
                  "text-white shadow-lg hover:brightness-110 transition-all duration-200 hover:scale-[1.04]",
                  (isLoading) && "opacity-50 cursor-wait",
                  (!isActive && !canStart) && "opacity-50 cursor-not-allowed",
                  (isActive && !canStop) && "opacity-50 cursor-not-allowed"
                )
              }
              aria-label={isActive ? "Stop session" : "Start session"}
            >
              {isLoading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : isActive ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
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
            onClick={() => { setBackTarget(null); setPage("workflows"); }}
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

      <main className="mx-auto max-w-6xl px-8 pb-28">
        {page === "about" && (
          <section>
            <GlassCard>
              <h2 className="text-[1.35rem] font-semibold text-slate-900 dark:text-white/90">About Working Memory</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.925rem] text-slate-700 dark:text-white/85">
                <li>Click <span className="font-semibold">Start</span> in the top-right to begin a focused session.</li>
                <li>Work as usual. The timer keeps running; click <span className="font-semibold">Stop</span> when you’re done.</li>
                <li>Review your saved sessions on the <span className="font-semibold">Past workflows</span> page.</li>
              </ol>
              <p className="mt-4 text-[0.925rem] text-slate-600 dark:text-white/70">Tip: You can keep the Start/Stop button visible while navigating between pages.</p>
            </GlassCard>
          </section>
        )}

        {page === "workflows" && (
          <section className="space-y-6">
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h3 className="text-[1.15rem] font-semibold text-slate-900 dark:text-white/90">Past workflows</h3>
                </div>
                <div className="inline-flex rounded-lg ring-1 ring-slate-200 bg-white/70 dark:bg-white/5 dark:ring-white/10 overflow-hidden">
                  <button
                    onClick={() => setWfView("list")}
                    className={classNames(
                      "px-3 py-1.5 text-[0.925rem] transition-colors",
                      wfView === "list"
                        ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
                    )}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setWfView("calendar")}
                    className={classNames(
                      "px-3 py-1.5 text-[0.925rem] transition-colors",
                      wfView === "calendar"
                        ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5"
                    )}
                  >
                    Calendar
                  </button>
                </div>
              </div>

              {wfView === "list" && (
                <div className="divide-y divide-white/10">
                  {sessions.map((s) => {
                    const duration = s.endedAt - s.startedAt;
                    const started = new Date(s.startedAt).toLocaleString();
                    const ended = new Date(s.endedAt).toLocaleString();
                    return (
                      <div
                        key={s.id}
                        className="py-3 flex items-center justify-between gap-3 cursor-pointer rounded-xl -mx-5 px-5 sm:-mx-7 sm:px-7 lg:-mx-9 lg:px-9 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
                        onClick={() => { setBackTarget({ page: "workflows" }); setSelectedSession(s); setPage("detail"); }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid place-items-center rounded-lg bg-slate-900/5 p-2 ring-1 ring-slate-200 dark:bg-white/8 dark:ring-white/10">
                            <Clock className="h-5 w-5 text-slate-800 dark:text-white/90" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[0.925rem] font-semibold text-slate-900 dark:text-white">{s.title}</div>
                            <div className="mt-0.5 text-[0.8rem] text-slate-600 dark:text-white/60">{started} → {ended}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill>{formatDuration(duration)}</Pill>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                            aria-label="Delete session"
                            title="Delete session"
                            className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-rose-300/40 bg-rose-600/90 text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {wfView === "calendar" && (
                <div className="mt-2">
                  {/* Month nav */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[0.925rem] font-semibold text-slate-900 dark:text-white/90">
                      {displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="inline-flex overflow-hidden rounded-md ring-1 ring-slate-200 bg-white/70 dark:bg-white/5 dark:ring-white/10">
                      <button
                        onClick={() => setMonthOffset((o) => o - 1)}
                        className="px-2 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
                        aria-label="Previous month"
                        title="Previous month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMonthOffset((o) => o + 1)}
                        className="px-2 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
                        aria-label="Next month"
                        title="Next month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 text-center text-[0.8rem] text-slate-600 dark:text-white/60">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                      <div key={d} className="py-2">{d}</div>
                    ))}
                  </div>
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayIdx }).map((_, i) => (
                      <div key={`b-${i}`} className="h-24 rounded-lg" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const daySessions = sessionsByDay[key] || [];
                      return (
                        <div
                          key={key}
                          className="h-36 md:h-40 lg:h-44 rounded-lg ring-1 ring-slate-200 bg-white/70 p-2 text-left dark:bg-white/5 dark:ring-white/10 flex flex-col overflow-hidden cursor-pointer hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
                          onClick={() => { setSelectedDay(key); setPage('day'); }}
                        >
                          <div className="text-[0.8rem] font-semibold text-slate-700 dark:text-white/80 shrink-0">{day}</div>
                          <div className="mt-1 flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto pr-1">
                            {daySessions.map((s: any) => (
                              <button
                                key={s.id}
                                onClick={(e) => { e.stopPropagation(); setBackTarget({ page: 'day', day: key }); setSelectedSession(s); setPage('detail'); }}
                                className="w-full overflow-hidden truncate rounded-md bg-slate-900/5 px-2 py-1 text-left text-[0.8rem] text-slate-900 hover:bg-slate-900/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                                title={s.title}
                              >
                                {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassCard>
          </section>
        )}

        {page === "day" && selectedDay && (
          <section className="space-y-6">
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[1.35rem] font-semibold text-slate-900 dark:text-white/90">
                  {new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={() => setPage("workflows")}
                  className="rounded-md px-3 py-1.5 text-[0.925rem] text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200"
                >
                  Back
                </button>
              </div>

              <div className="divide-y divide-white/10">
                {(sessionsByDay[selectedDay] || []).map((s: any) => {
                  const duration = s.endedAt - s.startedAt;
                  const started = new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const ended = new Date(s.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={s.id}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer rounded-xl -mx-5 px-5 sm:-mx-7 sm:px-7 lg:-mx-9 lg:px-9 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => { setBackTarget({ page: 'day', day: selectedDay || undefined }); setSelectedSession(s); setPage('detail'); }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid place-items-center rounded-lg bg-slate-900/5 p-2 ring-1 ring-slate-200 dark:bg-white/8 dark:ring-white/10">
                          <Clock className="h-5 w-5 text-slate-800 dark:text-white/90" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[0.925rem] font-semibold text-slate-900 dark:text-white">{s.title}</div>
                          <div className="mt-0.5 text-[0.8rem] text-slate-600 dark:text-white/60">{started} → {ended}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill>{formatDuration(duration)}</Pill>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                          aria-label="Delete session"
                          title="Delete session"
                          className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-rose-300/40 bg-rose-600/90 text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {(!sessionsByDay[selectedDay] || sessionsByDay[selectedDay].length === 0) && (
                  <div className="py-6 text-center text-[0.925rem] text-slate-600 dark:text-white/60">No workflows on this day.</div>
                )}
              </div>
            </GlassCard>
          </section>
        )}

        {page === "detail" && selectedSession && (
          <section className="space-y-6">
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <input
                  value={selectedSession.title || ""}
                  onChange={(e) => {
                    const t = e.target.value;
                    setSelectedSession({ ...selectedSession, title: t });
                    setSessions((prev) => prev.map((s) => (s.id === selectedSession.id ? { ...s, title: t } : s)));
                  }}
                  placeholder="Session title"
                  className="w-full max-w-md rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-[0.925rem] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (backTarget?.page === 'day') {
                      if (backTarget.day) setSelectedDay(backTarget.day);
                      setPage('day');
                    } else {
                      setPage('workflows');
                    }
                    setBackTarget(null);
                  }}
                  className="rounded-md px-3 py-1.5 text-[0.925rem] text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200"
                >
                  Back
                </button>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-[0.8rem] text-slate-600 dark:text-white/60">Date</div>
                  <div className="text-[0.925rem] font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedSession.startedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[0.8rem] text-slate-600 dark:text-white/60">Start time</div>
                  <div className="text-[0.925rem] font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedSession.startedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div className="text-[0.8rem] text-slate-600 dark:text-white/60">End time</div>
                  <div className="text-[0.925rem] font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedSession.endedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div className="text-[0.8rem] text-slate-600 dark:text-white/60">Duration</div>
                  <div className="text-[0.925rem] font-semibold text-slate-900 dark:text-white">
                    {formatDuration(selectedSession.endedAt - selectedSession.startedAt)}
                  </div>
                </div>
              </div>

              {/* Description (user-editable) */}
              <div className="mt-6">
                <label className="block text-[0.8rem] text-slate-600 dark:text-white/60 mb-2">Description</label>
                <textarea
                  value={selectedSession.description ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSession({ ...selectedSession, description: val });
                    setSessions((prev) => prev.map((s) => (s.id === selectedSession.id ? { ...s, description: val } : s)));
                  }}
                  placeholder="Describe this workflow…"
                  className="w-full rounded-lg border border-slate-300 bg-white/70 p-3 text-[0.925rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-indigo-300"
                  rows={6}
                />
              </div>

              {/* Notes (backend-managed, read-only) */}
              <div className="mt-6">
                <label className="block text-[0.8rem] text-slate-600 dark:text-white/60 mb-2">Notes</label>
                <div className="w-full rounded-lg border border-slate-300 bg-white/70 p-3 text-[0.925rem] text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white whitespace-pre-wrap">
                  {selectedSession.notes && String(selectedSession.notes).trim().length > 0 ? (
                    selectedSession.notes
                  ) : (
                    <span className="text-slate-500 dark:text-white/50">No notes yet. (Provided by backend)</span>
                  )}
                </div>
              </div>
            </GlassCard>
          </section>
        )}

        {page === "flow" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <GlassCard>
                <div>
                  <div className="text-[0.925rem] uppercase tracking-widest text-slate-600 dark:text-white/60">Current session</div>
                  <div className="mt-2 text-4xl font-bold tabular-nums">{isActive ? elapsedText : "00:00:00"}</div>

                  <label className="mt-4 block text-[0.8rem] text-slate-600 dark:text-white/60">Session name</label>
                  <input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="(optional)"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-[0.925rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-indigo-300"
                  />

                  <div className="mt-2 text-slate-600 dark:text-white/60">Use the Start/Stop button in the top-right.</div>
                  {isActive && (
                    <div className="mt-4">
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white bg-gradient-to-b from-rose-600 to-rose-700 ring-1 ring-rose-300/40 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-300/60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Session
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
            <div className="lg:col-span-2">
              <GlassCard>
                <label className="block text-[0.8rem] text-slate-600 dark:text-white/60 mb-2">Description</label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  disabled={!isActive}
                  placeholder="Describe this session… (optional)"
                  className="w-full rounded-lg border border-slate-300 bg-white/70 p-3 text-[0.925rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-indigo-300"
                  rows={8}
                />

                {/* Notes (read-only preview, matches detail page position) */}
                <div className="mt-6">
                  <label className="block text-[0.8rem] text-slate-600 dark:text-white/60 mb-2">Notes</label>
                  <div className="w-full rounded-lg border border-slate-300 bg-white/70 p-3 text-[0.925rem] text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white whitespace-pre-wrap">
                    {summaryNotes ? (
                      summaryNotes
                    ) : (
                      <span className="text-slate-500 dark:text-white/50">
                        {isLoading ? "Agent is generating summary..." : "Notes will auto‑populate when you stop the session."}
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
