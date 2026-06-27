"use client";
import { useEffect, useState } from "react";
import { Lead, Score } from "@/types/db";
import { LANES, getLane } from "@/lib/lanes";
import { supabase } from "@/lib/supabase";

type Draft = Omit<Lead, "id" | "created_at"> & { id?: string };

const EMPTY: Draft = {
  username: "",
  post_link: "",
  subreddit: "",
  lane: "",
  offer_fit: "",
  score: null,
  public_comment: false,
  dm_date: null,
  notes: "",
  original_post: "",
};

export default function LeadForm({
  initial,
  prefilledLane,
  onClose,
  onSaved,
}: {
  initial?: Lead | null;
  prefilledLane?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      const { id, created_at, ...rest } = initial;
      setDraft({ ...rest, id });
    } else if (prefilledLane) {
      setDraft({ ...EMPTY, lane: prefilledLane });
    } else {
      setDraft(EMPTY);
    }
  }, [initial, prefilledLane]);

  const lane = getLane(draft.lane);

  function update<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        ...draft,
        username: draft.username || null,
        post_link: draft.post_link || null,
        subreddit: draft.subreddit || null,
        lane: draft.lane || null,
        offer_fit: draft.offer_fit || null,
        score: draft.score || null,
        dm_date: draft.dm_date || null,
        notes: draft.notes || null,
        original_post: draft.original_post || null,
      };
      if (draft.id) {
        const { error } = await supabase.from("leads").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { id, ...insertPayload } = payload;
        const { error } = await supabase.from("leads").insert(insertPayload);
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!draft.id) return;
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", draft.id);
    if (error) {
      setErr(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="surface rounded-xl border border-app w-full max-w-2xl my-8 shadow-2xl">
        <div className="p-5 border-b border-app flex items-center justify-between">
          <h2 className="text-lg font-semibold">{draft.id ? "Edit Lead" : "New Lead"}</h2>
          <button onClick={onClose} className="text-muted hover:text-brand text-xl">
            ×
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label>Username</label>
            <input value={draft.username || ""} onChange={(e) => update("username", e.target.value)} placeholder="u/handle" />
          </div>
          <div>
            <label>Post Link</label>
            <input value={draft.post_link || ""} onChange={(e) => update("post_link", e.target.value)} placeholder="https://reddit.com/..." />
          </div>

          <div>
            <label>Lane</label>
            <select value={draft.lane || ""} onChange={(e) => update("lane", e.target.value)}>
              <option value="">— select —</option>
              {LANES.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Subreddit</label>
            <input
              list="subreddits-list"
              value={draft.subreddit || ""}
              onChange={(e) => update("subreddit", e.target.value)}
              placeholder="r/..."
            />
            <datalist id="subreddits-list">
              {(lane ? lane.subreddits : LANES.flatMap((l) => l.subreddits)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label>Offer Fit</label>
            <input
              list="offers-list"
              value={draft.offer_fit || ""}
              onChange={(e) => update("offer_fit", e.target.value)}
              placeholder="Best-fit offer for this lead"
            />
            <datalist id="offers-list">
              {(lane ? lane.offers : LANES.flatMap((l) => l.offers)).map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Score</label>
            <select value={draft.score || ""} onChange={(e) => update("score", (e.target.value || null) as Score | null)}>
              <option value="">— score —</option>
              <option value="A">A — DM Today</option>
              <option value="B">B — Save / Comment</option>
              <option value="C">C — Research Only</option>
              <option value="Trash">Trash — Move On</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <input
              type="checkbox"
              id="pub"
              checked={draft.public_comment}
              onChange={(e) => update("public_comment", e.target.checked)}
              className="!w-4 !h-4 accent-orange-500"
            />
            <label htmlFor="pub" className="!mb-0">
              Left a public comment
            </label>
          </div>
          <div>
            <label>DM Date</label>
            <input
              type="date"
              value={draft.dm_date || ""}
              onChange={(e) => update("dm_date", e.target.value || null)}
            />
          </div>

          <div className="col-span-2">
            <label>Notes</label>
            <textarea
              rows={3}
              value={draft.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label>Original Post</label>
            <textarea
              rows={8}
              value={draft.original_post || ""}
              onChange={(e) => update("original_post", e.target.value)}
              placeholder="Paste the full Reddit post here for archival"
            />
          </div>
        </div>

        {err && <div className="px-5 pb-3 text-sm text-red-500">{err}</div>}

        <div className="p-5 border-t border-app flex items-center justify-between">
          {draft.id ? (
            <button
              onClick={remove}
              className="text-sm text-red-500 hover:text-red-400 px-3 py-1.5"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-app px-4 py-2 text-sm hover:border-brand"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-brand hover:bg-brand-hover px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
