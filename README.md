[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Andia86/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Andia86/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline, open-source guide and tracker for all **55 PlayStation 5 trophies**
of Grand Theft Auto VI: **1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden**.
Every trophy carries its official name, description and grade exactly as
PlayStation publishes them, plus a guide written for this project in our own
words that names its sources beside the text.

The look is our own — a dusk, coral and teal ledger theme. No Rockstar logos,
no official artwork, no external assets, no network requests at runtime:
serve the `app/` folder with any static file server (or run `node serve.ts`)
and open it, online or off.

## Features

- **Checklist tracker** — tick trophies off; progress (earned set, counters,
  spoiler setting) is saved in the browser via localStorage.
- **Tracked counters** — steppers and progress bars for every count
  PlayStation tracks: 250 stunts, 42 shooting-range golds, 18 meditation
  spots, 52 areas, 100 WAiNK locations, 500 choices, $250,000 laundered,
  $100,000 spent, and more. Reaching a target marks the trophy earned.
- **Filters & search** — by kind (story, missable, collectibles, activities,
  online — this list has no online trophies), by grade, by earned state or
  hidden-only, plus full-text search over names, descriptions and guides.
- **Spoiler shield** — when on, unearned story trophies show a placeholder
  instead of their name and description, so the campaign stays unspoiled.
- **Roadmap to the Platinum** — a four-stage route built from the official
  descriptions: Stage 1 story in order (with the missable flagged at its
  chapter), Stage 2 collectibles & activities, Stage 3 counts, grinds and
  the 100% gold, then the platinum itself — with per-stage progress.
- **Missables view** — exactly one missable trophy, **Positive Mental
  Attitude** (a Chapter 1 meditation opportunity), with a LAST CHANCE
  warning and the save discipline that protects a single-playthrough run.
- **Export / import** — download your progress as a JSON file and import it
  back on any machine; a clearly labelled built-in SAMPLE progress shows
  the tracker filled in.
- **Per-trophy cited guidance** — open any trophy to see its official
  description, our guide, its missable warning where it has one, its
  tracked count, and its Sources list.

## Deep links

- `#demo` — load the SAMPLE progress (labelled as sample data in the UI).
- `#view=roadmap` — the Roadmap view. `#view=missables` — the Missables view.
- `#trophy=<exact trophy name>` — open that trophy's guide panel, e.g.
  `#trophy=Positive%20Mental%20Attitude` (combines with `#demo`).
- `#spoiler=1` — turn the spoiler shield on. `#menu=data` — open the data
  (export / import) menu.

## Method note

Guides were written from the official PS5 trophy list: each trophy's name,
description, grade, hidden flag and tracked count come from that list, and
the roadmap stages and missable flag are built from what the official
descriptions ask for. Sources are cited per trophy from: *Official PS5
trophy list (PlayStation)*, *Exophase — GTA VI trophy list*, *PSNProfiles —
GTA VI trophy guide* and *GTA Wiki*. Sources are named, never copied — all
guide text here is original to this project.

## Layout

- `app/` — the static guide (open `app/index.html` via any static server).
- `app/data/trophies.json` — the 55 trophies with guides and sources.
- `screenshots/` — renders of the running app, listed in `shots.json`.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.
