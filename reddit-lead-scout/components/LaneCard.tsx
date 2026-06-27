"use client";
import { useState } from "react";
import { Lane } from "@/lib/lanes";
import { parseSearch } from "@/lib/searchLinks";

export default function LaneCard({
  lane,
  onLogLead,
}: {
  lane: Lane;
  onLogLead: (laneName: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={
        "rounded-xl border-2 surface transition " + lane.color.border + " " + lane.color.bg
      }
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
      >
        <div className="flex-1">
          <h2 className={"text-xl font-semibold " + lane.color.accent}>{lane.name}</h2>
          <p className="text-sm text-muted mt-1">{lane.pain}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onLogLead(lane.name);
            }}
            className="rounded-md bg-brand hover:bg-brand-hover px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
          >
            + Log Lead
          </span>
          <span className="text-muted text-lg select-none">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-app pt-4">
          <Section title="Buyer signals">
            <div className="flex flex-wrap gap-1.5">
              {lane.signals.map((s) => (
                <span key={s} className={"text-xs px-2 py-1 rounded-md " + lane.color.chip}>
                  {s}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Best-fit offers">
            <div className="flex flex-wrap gap-1.5">
              {lane.offers.map((o) => (
                <span
                  key={o}
                  className="text-xs px-2 py-1 rounded-md border border-app text-muted"
                >
                  {o}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Subreddits">
            <div className="flex flex-wrap gap-1.5">
              {lane.subreddits.map((s) => (
                <a
                  key={s}
                  href={`https://www.reddit.com/${s}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 rounded-md border border-app hover:border-brand hover:text-brand transition"
                >
                  {s}
                </a>
              ))}
            </div>
          </Section>

          <Section title="Search strings">
            <ul className="space-y-2">
              {lane.searches.map((raw) => {
                const p = parseSearch(raw);
                return (
                  <li
                    key={raw}
                    className="flex items-center justify-between gap-3 rounded-lg border border-app surface p-2.5"
                  >
                    <code className="text-xs font-mono text-muted truncate">{raw}</code>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a
                        href={p.redditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      >
                        Reddit
                      </a>
                      <a
                        href={p.googleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        Google
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <div className="rounded-lg border border-app p-3 text-sm italic text-muted">
            <span className="font-semibold not-italic mr-1">Skip:</span>
            {lane.skip}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{title}</h3>
      {children}
    </div>
  );
}
