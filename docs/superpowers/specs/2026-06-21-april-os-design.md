# April OS — Life Operating System Design

**Author:** April Fletcher (with Claude)
**Date:** 2026-06-21
**Status:** Design approved, awaiting implementation plan

---

## Summary

A personal operating system built in Obsidian, managed by Claude Code, that solves "I lose track of what to focus on today" first and scales to cover client work, personal creative projects, content/audience growth, and personal wellbeing over time.

The system is a fresh Obsidian vault at `~/Desktop/Claude Sandbox/April OS/`, organized in a PARA-ish folder taxonomy, with a single dashboard note that combines live Dataview rollups and a "Today" section that Claude Code writes during a morning routine. Claude Code reads vault frontmatter, picks the day's top priorities, drafts a schedule, surfaces what's slipping, and suggests inbox triage — all written into one note the user opens each morning.

---

## Goals (v1)

1. **Morning clarity.** The user opens one note (`60 System/Dashboard.md`) and sees: today's top 3 priorities, the day's schedule, what's slipping across active projects, and what needs to be triaged out of the inbox.
2. **Claude Code as chief of staff.** A single shell command (`morning`) runs Claude Code against the vault and populates the dashboard's "Today" section.
3. **Vault structure that scales.** The folder taxonomy, frontmatter schemas, and dashboard design support later phases (triage, conversational queries, executor work) without restructuring.
4. **Graceful degradation.** Live Dataview blocks render active projects, slipping projects, and inbox without any script — so the dashboard is useful even on days the morning routine isn't run.
5. **Low cost on a Claude Pro plan.** v1 fits comfortably within Claude Pro quotas.

## Non-goals (v1)

- Automated inbox triage (Phase 2).
- Conversational queries against the vault ("what's slipping on the memoir?" — Phase 3).
- Content/email drafting or pipeline execution (Phase 4).
- Cron-based fully automated morning routine (Phase 5 — manual invocation only in v1).
- NotebookLM integration (deferred — separate design conversation).
- Migration of all working files into the vault (lazy migration — only what's actively in flight gets a project note in v1).

---

## Architecture

### Vault

**Location:** `~/Desktop/Claude Sandbox/April OS/` — fresh vault, not derived from the existing `~/Documents/Obsidian Vault/ (the previous, now-abandoned vault)` or the `~/Desktop/Claude Sandbox/` working area.

**Folder structure** (two-digit prefixes force sort order):

```
00 Daily/        daily notes (YYYY-MM-DD.md)
10 Projects/     one note per active project, frontmatter-driven
20 Areas/        ongoing responsibilities (5 seeded; more as needed)
30 Resources/    reference, drafts, swipe files
40 Archive/      done or dormant, moved here not deleted
50 Templates/    Templater templates (daily, project, inbox)
60 System/       Dashboard.md, prompts/, scripts/, cowork/
99 Inbox/        quick capture, triaged out over time
```

PARA-ish (Projects / Areas / Resources / Archive) with three additions: a `Daily/` folder for daily notes, a `System/` folder for the dashboard and Claude Code prompts, and an `Inbox/` folder as the capture drain.

### Approach: Obsidian + Templater + Dataview + a Claude Code morning routine (Approach B-lite)

The user opens `60 System/Dashboard.md` each morning. The dashboard has three layers:

1. **Static frame** — section headers, a link to today's daily note.
2. **Live Dataview blocks** — automatically render active projects (sorted by priority and last_touched), slipping projects (untouched > 7 days), untriaged inbox items, and weekly-cadence areas.
3. **Claude Code-written section** — between `<!-- morning-start -->` and `<!-- morning-end -->` delimiter comments. The user runs `morning` in a terminal; Claude Code reads the vault, picks today's top 3 priorities, drafts a schedule, names what's slipping, and suggests inbox triage. Re-running overwrites only that section.

**Why this approach over alternatives:**
- vs. **pure Obsidian (no CC)** — delivers the "Claude as chief of staff" promise; CC iterates on prompt over time as the user learns what works.
- vs. **fully automated cron** — simpler v1, no always-on machine needed, no silent cron failures to debug, and the user gets a "morning ritual" rather than waking up to mystery output.

### How Claude Code plugs in

CC has no special integration with Obsidian. It reads vault files directly via filesystem, uses its own internal prompt at `60 System/prompts/morning.md`, and writes back to `60 System/Dashboard.md` between the delimiter comments. The vault is just a folder of markdown files; CC's only privilege is filesystem access.

Invocation is a plain `claude` command with the morning prompt piped in via a shell alias — no slash command plugin, no MCP server, no daemon.

---

## Detailed design

### Frontmatter schemas (lean cut)

Every field is daily-use friction; v1 ships with the minimum that supports the morning routine. Optional fields can be added back later without data migration.

**Daily note** (`00 Daily/YYYY-MM-DD.md`):
```yaml
---
type: daily
date: 2026-06-21
top_priorities: []
shipped: []
---
```

**Project note** (`10 Projects/<name>.md`):
```yaml
---
type: project
status: active        # active | paused | done | dormant
area: "[[Audience]]"  # links to an Area
priority: 2           # 1=do now, 2=this week, 3=this month, 4=someday
last_touched: 2026-06-21
next_action: "Send invoice draft to Sarah"
due: 2026-07-01       # optional
---
```

These four — `status`, `priority`, `last_touched`, `next_action` — are the morning routine's hot path. Dropping any one of them collapses a piece of the dashboard.

**Area note** (`20 Areas/<name>.md`):
```yaml
---
type: area
cadence: weekly       # daily | weekly | monthly
---
```

**Inbox item** (`99 Inbox/YYYY-MM-DD-HHMM-<slug>.md`):
```yaml
---
type: inbox
captured_at: 2026-06-21T14:32
processed: false
---
```

**Explicitly cut from v1:** wellbeing fields on daily notes (energy/focus/mood), `domain` on projects (implicit from area), `client` on projects (in note body), `tags` on projects (Obsidian's `#tag` syntax suffices), area `description` (note body), inbox `source`.

### Dashboard layout (`60 System/Dashboard.md`)

```markdown
# Command Center

**Today:** [[2026-06-21]]

---

## 🎯 Today
<!-- morning-start -->
*Run the morning routine to populate this.*
<!-- morning-end -->

---

## 🔥 Active projects

​```dataview
TABLE WITHOUT ID
  file.link AS Project,
  priority AS P,
  next_action AS "Next action",
  last_touched AS Touched
FROM "10 Projects"
WHERE type = "project" AND status = "active"
SORT priority ASC, last_touched DESC
LIMIT 20
​```

## 🚨 Slipping (untouched > 7 days)

​```dataview
LIST "last touched " + (date(today) - date(last_touched)).day + " days ago"
FROM "10 Projects"
WHERE type = "project" AND status = "active"
  AND last_touched < date(today) - dur(7 days)
SORT last_touched ASC
​```

## 📥 Inbox (untriaged)

​```dataview
LIST
FROM "99 Inbox"
WHERE type = "inbox" AND processed = false
SORT file.ctime ASC
​```

## 📅 Weekly areas to touch this week

​```dataview
LIST
FROM "20 Areas"
WHERE type = "area" AND cadence = "weekly"
​```
```

The frame is written once at setup; Dataview blocks render live; the `🎯 Today` section is the only thing CC touches.

### Morning routine prompt (`60 System/prompts/morning.md`)

```markdown
You are my morning chief of staff. The current date is {{TODAY}}.

Your job: read my vault and write the "Today" section of `60 System/Dashboard.md`, between the `<!-- morning-start -->` and `<!-- morning-end -->` comment markers. Replace whatever is between them.

## What to read

1. Today's daily note: `00 Daily/{{TODAY}}.md` (create from template if missing)
2. Yesterday's daily note: look up the most recent file in `00 Daily/` before today
3. All active projects: `10 Projects/*.md` where frontmatter `status: active` — read frontmatter only, not full bodies, unless you need to understand `next_action`
4. Untriaged inbox: `99 Inbox/*.md` where frontmatter `processed: false` — read whole file (they're short)
5. Areas with `cadence: weekly` — check if any haven't been touched this week

## What to write

In the `## 🎯 Today` section, produce in this exact order:

### Top 3 priorities
Pick the three things I should do today. Rank by:
- Anything with `priority: 1` and `status: active`
- Then anything with `priority: 2` that hasn't been touched in > 3 days
- Then weekly-cadence areas I've ignored this week
For each, write one line: project name + the next action verbatim from `next_action`.

### Schedule
Read `60 System/today-schedule.md` if it exists; otherwise leave a "no schedule found" line. Reformat as a simple time-blocked list.

### What's slipping
List up to 5 projects with `status: active` and `last_touched` older than 7 days. One line each: name + days since last touch + the `next_action` so I can re-engage fast.

### Inbox triage suggestions
If `99 Inbox/` has untriaged items, list each with a one-sentence suggestion of where it should go (which project, which area, or "delete"). Don't actually move anything — just suggest. I'll triage later or run a dedicated triage routine.

### Tone
- Terse. No preamble. No "Good morning!" No motivational copy.
- Bullet lists, not paragraphs.
- Cite project notes with `[[wikilinks]]` so they're clickable.
- If you couldn't determine something, say so in one line — don't make up data.
```

### Invocation: shell alias

```bash
# add to ~/.zshrc
alias morning='cd "$HOME/Documents/April OS" && claude "$(cat "60 System/prompts/morning.md" | sed "s/{{TODAY}}/$(date +%Y-%m-%d)/g")"'
```

Run `morning` from any terminal. Two keystrokes per morning.

Alternatives considered: a Buttons-plugin button in the dashboard (cleaner UX, requires installing the Buttons plugin), or just `claude` + manual paste (no setup, more typing each morning). v1 ships the alias as the recommended path.

---

## Seed content (created at setup)

**Templates:**
- `50 Templates/daily.md` — Templater template using `<% tp.date.now("YYYY-MM-DD") %>` for date
- `50 Templates/project.md` — frontmatter pre-filled with empty `next_action`, `priority: 3`, `status: active`, `last_touched: <today>`
- `50 Templates/inbox.md` — frontmatter with timestamp template, `processed: false`

**System:**
- `60 System/Dashboard.md` — the dashboard above
- `60 System/prompts/morning.md` — the morning prompt above
- `60 System/cowork/` — ongoing Claude collaboration workspace (iterated prompts, instructions, learnings, exported chats worth keeping; successor to the `Claude Brain` folder in the sandbox)

**Seed Areas (5 notes):**
- `20 Areas/Client Work.md`
- `20 Areas/Personal Creative.md`
- `20 Areas/Audience.md`
- `20 Areas/Wellbeing.md`
- `20 Areas/Family.md`

Each is empty body + frontmatter (`type: area, cadence: weekly`).

**First daily note:** today's, generated from the daily template so the dashboard's `Today: [[…]]` link points somewhere.

**Plugins required in the new vault:** Dataview, Templater, obsidian-git (carry over from existing vault setup). Optional: QuickAdd for keyboard-bound capture.

---

## Migration plan

The user already has working folders in `~/Desktop/Claude Sandbox/` (Branding, Ads, Cold Email, Landing Pages, Offers, *MEMOIR-FAMILY STORIES, reddit-lead-scout, etc.) and a partially-set-up old vault at `~/Documents/Obsidian Vault/ (the previous, now-abandoned vault)` containing a "Creative Equity Hub" structure.

**Migration philosophy:** lazy and lean.
- The old vault is abandoned. Plugin configs may be referenced when setting up plugins in the new vault, but no content is auto-migrated.
- Working files (drafts, exports, screenshots) stay in the sandbox. They do not need to be in the vault.
- A project note is *one* markdown file in `10 Projects/` with the lean frontmatter. The note's body can link to (or describe) wherever its working files live.
- Only projects that are *actively in flight this week* get migrated on day one. Everything else stays in the sandbox; it can be promoted to a project note later when it becomes active.

**Migration interview** is its own step in the implementation plan: I walk the user through the sandbox folders, ask "is this active right now?" for each, and create lean project notes for the yeses. Likely candidates:

| Candidate | Notes |
|---|---|
| Creative Equity Hub | Likely active; pull intent over from old vault |
| Memoir / Family Stories | Asterisk-prefixed in sandbox suggests it's a priority |
| Reddit lead scout, AI Task Walkthrough | Possibly active |
| Ads, Cold Email, Landing Pages, Offers, Branding, Career Story Map | Confirm one by one |

**Drain-down policy for the sandbox:** Once a folder is represented as a project note in the vault, leave the working files in place. As the user touches them and accumulates new artifacts, those new artifacts can land directly in the vault (under `10 Projects/<project>/`) at the user's discretion. The sandbox is not deleted; it shrinks over time.

---

## Roadmap (post-v1)

Each phase is additive; v1's vault structure supports all of them without restructuring.

**Phase 2 — Inbox triager.** A `triage` prompt that reads `99 Inbox/*.md` where `processed: false`, decides where each item belongs (which project, area, or delete), executes the move/append, and flips `processed: true`. New invocation: `triage`.

**Phase 3 — Conversational interface.** Ad-hoc queries: "what's slipping on the memoir area?", "summarize what shipped this week", "what's my Wednesday look like?" CC reads the vault and answers in the terminal. Vault stays unchanged.

**Phase 4 — Doer / executor.** Drafts social posts, processes lead lists, updates client docs. Writes back to project frontmatter (`last_touched`, `next_action`) so the dashboard reflects what was done. Likely needs Claude Max or API; we re-evaluate cost when getting here.

**Phase 5 — NotebookLM connection.** Separate design conversation. Out of scope for the OS itself; integrate when the OS is running smoothly.

---

## Cost & operational notes

**v1 token cost estimate** (per morning run on a small vault, ~10 active projects):
- ~7K input tokens (prompt + daily note + project frontmatter + inbox), ~2K output tokens
- On Sonnet 4.6 via API: ~$0.05/run = ~$1.50/month
- On Opus 4.8 via API: ~$0.09/run = ~$2.70/month
- On Claude Pro plan: well within quota

**Cost scales with vault size.** A vault with 50 active projects can hit ~$0.20/run on Sonnet. Mitigation: prompt asks CC to read frontmatter only (not full project bodies), and the user should mark stale projects `status: dormant` regularly. A "monthly project review" routine will be designed in a later phase.

**Plan posture:** v1 fits comfortably on Claude Pro. Phase 2 may push closer to Pro limits if the inbox is busy. Phase 4 likely requires Max plan upgrade or API key.

**Failure modes:**
- **CC unavailable** — dashboard's Dataview blocks still render active projects, slipping, and inbox. User sees a stale `Today` section with "Run the morning routine to populate this."
- **Frontmatter parse errors** — Dataview ignores malformed notes silently; CC will likely flag them in its output.
- **Vault gets too large for one morning run** — addressed by `status: dormant` discipline; later phases can add per-domain or per-area dashboards if needed.

---

## Open questions / future work

1. **Sandbox folder cleanup cadence.** v1 leaves the sandbox alone. At some point, archive completed or never-reactivated folders. Not blocking.
2. **Calendar source.** v1 expects schedule in `60 System/today-schedule.md` or "no schedule found." A future integration could pull from Google Calendar via an MCP server. Out of v1 scope.
3. **Metrics rollup.** The inspiration screenshots tracked YouTube/IG/Threads/X/TikTok follower counts. Out of v1; could be added as a `20 Areas/Audience` daily-update routine in Phase 2 or later.
4. **Multi-device.** obsidian-git handles vault sync across devices; no special handling in v1.
5. **NotebookLM.** Deferred. Separate Phase 5 design conversation.
