"use client";

export type TabId = "search" | "leads" | "subs";

const TABS: { id: TabId; label: string }[] = [
  { id: "search", label: "Search Board" },
  { id: "leads", label: "My Leads" },
  { id: "subs", label: "Subreddit Status" },
];

export default function TabNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="flex gap-1 border-b border-app">
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              "px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px " +
              (isActive
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-brand")
            }
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
