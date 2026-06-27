"use client";
import { useState } from "react";
import TabNav, { TabId } from "@/components/TabNav";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBoard from "@/components/SearchBoard";
import MyLeads from "@/components/MyLeads";
import SubredditStatus from "@/components/SubredditStatus";

export default function Page() {
  const [tab, setTab] = useState<TabId>("search");
  const [formOpen, setFormOpen] = useState(false);
  const [prefilledLane, setPrefilledLane] = useState<string | null>(null);

  function logLeadFromLane(lane: string) {
    setPrefilledLane(lane);
    setFormOpen(true);
    setTab("leads");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-app surface/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl">📡</span>
            <h1 className="text-lg font-bold tracking-tight">Reddit Lead Scout</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <TabNav active={tab} onChange={setTab} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === "search" && <SearchBoard onLogLead={logLeadFromLane} />}
        {tab === "leads" && (
          <MyLeads
            formOpen={formOpen}
            prefilledLane={prefilledLane}
            onCloseForm={() => {
              setFormOpen(false);
              setPrefilledLane(null);
            }}
            onOpenForm={() => {
              setPrefilledLane(null);
              setFormOpen(true);
            }}
          />
        )}
        {tab === "subs" && <SubredditStatus />}
      </main>
    </div>
  );
}
