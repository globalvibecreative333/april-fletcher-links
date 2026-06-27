"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lead, Score } from "@/types/db";
import { LANES, getLane } from "@/lib/lanes";
import LeadForm from "./LeadForm";
import BackupButtons from "./BackupButtons";

const SCORES: Score[] = ["A", "B", "C", "Trash"];

export default function MyLeads({
  formOpen,
  prefilledLane,
  onCloseForm,
  onOpenForm,
}: {
  formOpen: boolean;
  prefilledLane: string | null;
  onCloseForm: () => void;
  onOpenForm: () => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [laneFilter, setLaneFilter] = useState<string>("");
  const [scoreFilter, setScoreFilter] = useState<string>("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (!laneFilter || l.lane === laneFilter) && (!scoreFilter || l.score === scoreFilter)
      ),
    [leads, laneFilter, scoreFilter]
  );

  const stats = useMemo(
    () => ({
      total: leads.length,
      A: leads.filter((l) => l.score === "A").length,
      B: leads.filter((l) => l.score === "B").length,
      C: leads.filter((l) => l.score === "C").length,
    }),
    [leads]
  );

  function exportCsv() {
    const cols: (keyof Lead)[] = [
      "username",
      "post_link",
      "subreddit",
      "lane",
      "offer_fit",
      "score",
      "public_comment",
      "dm_date",
      "notes",
      "original_post",
      "created_at",
    ];
    const header = cols.join(",");
    const rows = filtered.map((l) =>
      cols
        .map((c) => {
          const v = l[c];
          if (v == null) return "";
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Leads</h1>
          <p className="text-sm text-muted mt-1">Track every Reddit lead you find or DM.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <BackupButtons leads={leads} onRestored={load} />
          <button
            onClick={exportCsv}
            className="rounded-lg border border-app px-3 py-1.5 text-sm hover:border-brand"
          >
            Export CSV
          </button>
          <button
            onClick={onOpenForm}
            className="rounded-lg bg-brand hover:bg-brand-hover px-3 py-1.5 text-sm font-semibold text-white"
          >
            + New Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Total" value={stats.total} accent="text-brand" />
        <Stat label="A — DM Today" value={stats.A} accent="text-emerald-500" />
        <Stat label="B — Save / Comment" value={stats.B} accent="text-amber-500" />
        <Stat label="C — Research" value={stats.C} accent="text-cyan-500" />
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="w-48">
          <label>Lane</label>
          <select value={laneFilter} onChange={(e) => setLaneFilter(e.target.value)}>
            <option value="">All lanes</option>
            {LANES.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label>Score</label>
          <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)}>
            <option value="">All scores</option>
            {SCORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(laneFilter || scoreFilter) && (
          <button
            onClick={() => {
              setLaneFilter("");
              setScoreFilter("");
            }}
            className="text-sm text-muted hover:text-brand pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="rounded-xl border border-app surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="p-3">Username</th>
              <th className="p-3">Lane</th>
              <th className="p-3">Subreddit</th>
              <th className="p-3">Score</th>
              <th className="p-3">Offer Fit</th>
              <th className="p-3 text-center">Comment</th>
              <th className="p-3">DM Date</th>
              <th className="p-3">Post</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">
                  No leads yet. Click <span className="text-brand font-semibold">+ New Lead</span> or
                  log one from the Search Board.
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const lane = getLane(l.lane);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setEditing(l)}
                    className="border-t border-app hover:bg-orange-500/5 cursor-pointer"
                  >
                    <td className="p-3 font-medium">{l.username || "—"}</td>
                    <td className="p-3">
                      {l.lane ? (
                        <span className={"text-xs px-2 py-1 rounded-md " + (lane?.color.chip || "")}>
                          {l.lane}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-muted">{l.subreddit || "—"}</td>
                    <td className="p-3">
                      {l.score ? <ScoreBadge score={l.score} /> : <span className="text-muted">—</span>}
                    </td>
                    <td className="p-3 text-muted truncate max-w-[180px]">{l.offer_fit || "—"}</td>
                    <td className="p-3 text-center">{l.public_comment ? "✓" : ""}</td>
                    <td className="p-3 text-muted">{l.dm_date || "—"}</td>
                    <td className="p-3">
                      {l.post_link ? (
                        <a
                          href={l.post_link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand hover:underline text-xs"
                        >
                          link ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(formOpen || editing) && (
        <LeadForm
          initial={editing}
          prefilledLane={editing ? null : prefilledLane}
          onClose={() => {
            setEditing(null);
            onCloseForm();
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-app surface p-4">
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
      <div className={"text-3xl font-bold mt-1 " + accent}>{value}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: Score }) {
  const map: Record<Score, string> = {
    A: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    B: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    C: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
    Trash: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  };
  return <span className={"text-xs font-semibold px-2 py-1 rounded-md " + map[score]}>{score}</span>;
}
