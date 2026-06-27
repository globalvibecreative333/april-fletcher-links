"use client";
import { useState } from "react";
import { Lead } from "@/types/db";
import { supabase } from "@/lib/supabase";

export default function BackupButtons({
  leads,
  onRestored,
}: {
  leads: Lead[];
  onRestored: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [restoreErr, setRestoreErr] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function exportToClipboard() {
    const payload = {
      exported_at: new Date().toISOString(),
      version: 1,
      leads,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setToast(`Copied ${leads.length} leads to clipboard.`);
    } catch {
      setToast("Clipboard blocked — open Restore modal to copy manually.");
    }
    setTimeout(() => setToast(null), 2500);
  }

  async function restore() {
    setRestoreErr(null);
    setRestoring(true);
    try {
      const parsed = JSON.parse(pasteText);
      const rows = Array.isArray(parsed) ? parsed : parsed.leads;
      if (!Array.isArray(rows)) throw new Error("Backup must contain a leads array.");
      if (!confirm(`Restore ${rows.length} leads? This will MERGE with existing leads (by id) and add new ones.`)) {
        setRestoring(false);
        return;
      }
      const cleaned = rows.map((r: any) => ({
        id: r.id,
        username: r.username ?? null,
        post_link: r.post_link ?? null,
        subreddit: r.subreddit ?? null,
        lane: r.lane ?? null,
        offer_fit: r.offer_fit ?? null,
        score: r.score ?? null,
        public_comment: !!r.public_comment,
        dm_date: r.dm_date ?? null,
        notes: r.notes ?? null,
        original_post: r.original_post ?? null,
        created_at: r.created_at ?? new Date().toISOString(),
      }));
      const { error } = await supabase.from("leads").upsert(cleaned, { onConflict: "id" });
      if (error) throw error;
      setToast(`Restored ${cleaned.length} leads.`);
      setPasteText("");
      setShowRestore(false);
      onRestored();
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      setRestoreErr(e.message || "Failed to restore");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <button
        onClick={exportToClipboard}
        className="rounded-lg border border-app px-3 py-1.5 text-sm hover:border-brand"
      >
        Export Backup
      </button>
      <button
        onClick={() => setShowRestore(true)}
        className="rounded-lg border border-app px-3 py-1.5 text-sm hover:border-brand"
      >
        Restore Backup
      </button>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 surface border border-app rounded-lg px-4 py-2.5 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {showRestore && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="surface rounded-xl border border-app w-full max-w-2xl shadow-2xl">
            <div className="p-5 border-b border-app flex items-center justify-between">
              <h2 className="text-lg font-semibold">Restore Backup</h2>
              <button onClick={() => setShowRestore(false)} className="text-muted hover:text-brand text-xl">
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted">
                Paste a previously exported JSON backup below. Rows are upserted by <code>id</code> — existing
                leads are updated, new ones are added.
              </p>
              <textarea
                rows={14}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder='{"leads":[...]}'
                className="font-mono text-xs"
              />
              {restoreErr && <div className="text-sm text-red-500">{restoreErr}</div>}
            </div>
            <div className="p-5 border-t border-app flex justify-end gap-2">
              <button
                onClick={() => setShowRestore(false)}
                className="rounded-lg border border-app px-4 py-2 text-sm hover:border-brand"
              >
                Cancel
              </button>
              <button
                onClick={restore}
                disabled={!pasteText || restoring}
                className="rounded-lg bg-brand hover:bg-brand-hover px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {restoring ? "Restoring…" : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
