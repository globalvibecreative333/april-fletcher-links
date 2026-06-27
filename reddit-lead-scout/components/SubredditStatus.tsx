"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LANES, getLane } from "@/lib/lanes";
import { SubStatus, SubredditStatusRow } from "@/types/db";

const NEXT: Record<SubStatus, SubStatus> = {
  fresh: "combed",
  combed: "watching",
  watching: "fresh",
};

const PILL: Record<SubStatus, string> = {
  fresh: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30",
  combed: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  watching: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40",
};

const LABEL: Record<SubStatus, string> = {
  fresh: "Fresh",
  combed: "Combed",
  watching: "Watching",
};

export default function SubredditStatus() {
  const [rows, setRows] = useState<SubredditStatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("subreddit_status").select("*");
    if (!error && data) setRows(data as SubredditStatusRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function statusFor(subreddit: string, lane: string): SubStatus {
    return rows.find((r) => r.subreddit === subreddit && r.lane === lane)?.status || "fresh";
  }

  async function cycle(subreddit: string, lane: string) {
    const current = statusFor(subreddit, lane);
    const next = NEXT[current];
    setRows((prev) => {
      const i = prev.findIndex((r) => r.subreddit === subreddit && r.lane === lane);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: next };
        return copy;
      }
      return [...prev, { subreddit, lane, status: next }];
    });
    const { error } = await supabase
      .from("subreddit_status")
      .upsert(
        { subreddit, lane, status: next, updated_at: new Date().toISOString() },
        { onConflict: "subreddit,lane" }
      );
    if (error) {
      console.error(error);
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Subreddit Status</h1>
        <p className="text-sm text-muted mt-1">
          Click a subreddit to cycle Fresh → Combed → Watching → Fresh.
        </p>
      </div>

      <div className="flex gap-3 text-xs">
        <Legend status="fresh" />
        <Legend status="combed" />
        <Legend status="watching" />
      </div>

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          {LANES.map((lane) => (
            <div
              key={lane.name}
              className={"rounded-xl border-2 surface p-5 " + lane.color.border + " " + lane.color.bg}
            >
              <h2 className={"text-lg font-semibold mb-3 " + lane.color.accent}>{lane.name}</h2>
              <div className="flex flex-wrap gap-2">
                {lane.subreddits.map((s) => {
                  const status = statusFor(s, lane.name);
                  return (
                    <button
                      key={s + lane.name}
                      onClick={() => cycle(s, lane.name)}
                      className={
                        "text-sm px-3 py-1.5 rounded-md border transition hover:scale-[1.02] " +
                        PILL[status]
                      }
                      title={LABEL[status] + " — click to cycle"}
                    >
                      {s}
                      <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">
                        {LABEL[status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ status }: { status: SubStatus }) {
  return (
    <span className={"px-2.5 py-1 rounded-md border " + PILL[status]}>
      {LABEL[status]}
    </span>
  );
}
