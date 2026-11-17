"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComicStageFrame, ComicSticker } from "@/components/comic-shell";
import type {
  ApiErrorEnvelope,
  QuestionCategory,
  QuestionDifficulty,
  QuestionRow,
} from "@/types/game";

const CATEGORIES: QuestionCategory[] = ["software", "general", "fun"];

export function AdminQuestionsView() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<QuestionCategory | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [category, setCategory] = useState<QuestionCategory>("software");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("easy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (!res.ok) throw new Error("Failed to load questions");
      const data = (await res.json()) as { questions: QuestionRow[] };
      setQuestions(data.questions);
      setError(null);
    } catch {
      setError("Unable to load question pool.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/admin/questions", { cache: "no-store" });
        if (!active) return;
        if (res.status === 401) {
          router.replace("/admin");
          return;
        }
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { questions: QuestionRow[] };
        if (!active) return;
        setQuestions(data.questions);
      } catch {
        if (active) setError("Unable to load question pool.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setCategory("software");
    setDifficulty("easy");
  }

  function startEdit(q: QuestionRow) {
    setEditingId(q.id);
    setPrompt(q.question);
    setOptions([
      q.options[0] ?? "",
      q.options[1] ?? "",
      q.options[2] ?? "",
      q.options[3] ?? "",
    ]);
    setCorrectIndex(q.correct_index);
    setCategory(q.category);
    setDifficulty(q.difficulty);
    setError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      question: prompt.trim(),
      options: trimmedOptions,
      correct_index: correctIndex,
      category,
      difficulty,
      is_active: true,
    };

    try {
      const res = await fetch("/api/admin/questions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        setError(errBody?.error?.message ?? "Unable to save question.");
        return;
      }

      resetForm();
      await loadQuestions();
    } catch {
      setError("Network error saving question.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(q: QuestionRow) {
    setError(null);
    const res = await fetch("/api/admin/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: q.id, is_active: !q.is_active }),
    });
    if (res.status === 401) {
      router.replace("/admin");
      return;
    }
    if (res.ok) {
      await loadQuestions();
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/questions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.status === 401) {
      router.replace("/admin");
      return;
    }
    if (res.ok) {
      if (editingId === id) resetForm();
      await loadQuestions();
    }
  }

  const visibleQuestions = useMemo(() => {
    if (filterCategory === "all") return questions;
    return questions.filter((q) => q.category === filterCategory);
  }, [questions, filterCategory]);

  const activeCount = useMemo(
    () => questions.filter((q) => q.is_active).length,
    [questions]
  );

  return (
    <ComicStageFrame
      bannerTitle="Question Pool"
      bannerTone="default"
      maxWidthClass="max-w-6xl"
      rightSlot={
        <>
          <ComicSticker tone="green" tilt="left">
            {activeCount} ACTIVE / {questions.length} TOTAL
          </ComicSticker>
          <Link
            href="/admin/dashboard"
            className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-5 inline-flex items-center justify-center text-sm font-bold text-text-primary hover:border-accent-orange"
          >
            Back to Dashboard
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-2xl bg-bg-primary border-2 border-border-ash p-5 space-y-4">
          <h2 className="text-xl font-bold text-text-primary">
            {editingId ? "Edit Question" : "Add Question"}
          </h2>

          {error ? (
            <p role="alert" className="text-sm font-semibold text-danger-red">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="q-prompt"
                className="block text-sm font-semibold text-text-primary mb-2"
              >
                Question prompt
              </label>
              <input
                id="q-prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                placeholder="What does HTTP 404 mean?"
                className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {options.map((opt, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`q-opt-${idx}`}
                      className="text-xs font-semibold text-text-muted"
                    >
                      Option {idx + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCorrectIndex(idx)}
                      className={`min-h-12 text-xs font-bold px-4 rounded-2xl cursor-pointer ${
                        correctIndex === idx
                          ? "bg-success-green text-bg-primary"
                          : "bg-surface-elevated border border-border-ash text-text-muted"
                      }`}
                    >
                      {correctIndex === idx ? "Correct Answer" : "Mark Correct"}
                    </button>
                  </div>
                  <input
                    id={`q-opt-${idx}`}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next: [string, string, string, string] = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={idx < 2 ? "Required choice" : "Optional choice"}
                    className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary placeholder:text-text-muted"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="q-category"
                  className="block text-sm font-semibold text-text-primary mb-2"
                >
                  Category
                </label>
                <select
                  id="q-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as QuestionCategory)}
                  className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="q-difficulty"
                  className="block text-sm font-semibold text-text-primary mb-2"
                >
                  Difficulty
                </label>
                <select
                  id="q-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold px-6 transition-transform active:scale-[0.99] hover:brightness-105 disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Saving..." : editingId ? "Update Question" : "Add Question"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash text-text-muted font-bold px-5 cursor-pointer"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-bg-primary border-2 border-border-ash p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-text-primary">Saved Questions</h2>
            <div className="flex flex-wrap gap-2">
              {(["all", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`min-h-12 rounded-2xl px-4 text-sm font-bold cursor-pointer ${
                    filterCategory === cat
                      ? "bg-accent-orange text-bg-primary"
                      : "bg-surface-elevated border border-border-ash text-text-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-text-muted">Loading questions...</p>
          ) : (
            <ul className="space-y-3">
              {visibleQuestions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-2xl bg-surface border border-border-ash p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-bold text-text-primary">{q.question}</p>
                      <p className="text-xs text-text-muted">
                        {q.category} · {q.difficulty} · Answer:{" "}
                        <span className="text-success-green font-semibold">
                          {q.options[q.correct_index]}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(q)}
                        className={`min-h-12 rounded-2xl px-4 text-xs font-bold cursor-pointer ${
                          q.is_active
                            ? "bg-surface-elevated border border-success-green text-success-green"
                            : "bg-surface-elevated border border-border-ash text-text-muted"
                        }`}
                      >
                        {q.is_active ? "Active" : "Paused"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(q)}
                        className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-xs font-bold text-info-blue cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(q.id)}
                        className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-xs font-bold text-danger-red cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ComicStageFrame>
  );
}
