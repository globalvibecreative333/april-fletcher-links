"use client";
import { LANES } from "@/lib/lanes";
import LaneCard from "./LaneCard";

export default function SearchBoard({ onLogLead }: { onLogLead: (lane: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold">Search Board</h1>
          <p className="text-sm text-muted mt-1">
            Five lead lanes. Each card lists pain, signals, offers, subreddits, and ready-to-run searches.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {LANES.map((lane) => (
          <LaneCard key={lane.name} lane={lane} onLogLead={onLogLead} />
        ))}
      </div>
    </div>
  );
}
