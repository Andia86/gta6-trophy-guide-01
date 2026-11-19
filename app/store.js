// Leonida Ledger — progress store.
// Owns everything about the player's progress: the earned set, the per-trophy
// counters, the spoiler setting, localStorage persistence, export/import as a
// JSON file, and the built-in SAMPLE progress used by the #demo deep link.
// No network, no libraries: plain browser APIs only.
'use strict';

const LEDGER_STORAGE_KEY = 'leonida-ledger-progress-v1';

function createEmptyProgress() {
  return { earned: {}, counters: {}, spoilerShield: false, sample: false };
}

// The sample state is deliberately generous but incomplete: the story is
// finished, the missable meditation trophy is safely earned, and the long
// counters are part-way, so every part of the UI has something to show.
function createSampleProgress(trophies) {
  const progress = createEmptyProgress();
  progress.sample = true;
  const storyAndSafe = [
    'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money',
    'Vice City, Baby!', 'Top Of The World, Ma',
    'You Gotta Know When to Get Off', 'Trust', 'Break the Bank',
    'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm',
    'Positive Mental Attitude', 'Master of None', 'Stick Fiddler',
    'Baited My Tackle', 'Hot Together', 'Retail Therapy', 'Gunslinger',
    'Sneakthief', 'A Classic Blitz Play', 'Catch Me If You Can',
    'Challenging Tank', 'In The Beginning…', 'Capital Offense',
    'Ten Pin', 'Road to Rehabilitation', 'The Lone Rider'
  ];
  for (const name of storyAndSafe) progress.earned[name] = true;
  const partialCounters = {
    'Cunning Stunts': 173,
    'The Shootist': 29,
    'Top Fun': 9,
    'Earn Cash, Not Kudos': 14,
    'Strangers & Freaks': 5,
    "Don't Touch My Deck": 2,
    'You WAiNKer!': 61,
    'One Last Thing': 34,
    'Whip It Good': 72,
    'The Goodtime State': 38,
    'Pest Control': 6,
    'Maximum Withdrawal': 3,
    'Actions Speak Louder': 312,
    'Dime on the Dollar': 142500,
    'Treat Yo Self': 63800,
    'Little Boxes': 5,
    'On the Spot': 7,
    'Positive Mental Attitude': 18,
    'Master of None': 9
  };
  for (const trophy of trophies) {
    if (Object.prototype.hasOwnProperty.call(partialCounters, trophy.name)) {
      progress.counters[trophy.name] = partialCounters[trophy.name];
      if (trophy.target && partialCounters[trophy.name] >= trophy.target) {
        progress.earned[trophy.name] = true;
      }
    }
  }
  return progress;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    const progress = createEmptyProgress();
    if (parsed && typeof parsed === 'object') {
      if (parsed.earned && typeof parsed.earned === 'object') progress.earned = parsed.earned;
      if (parsed.counters && typeof parsed.counters === 'object') progress.counters = parsed.counters;
      progress.spoilerShield = parsed.spoilerShield === true;
      progress.sample = parsed.sample === true;
    }
    return progress;
  } catch (err) {
    return createEmptyProgress();
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    // Storage can be unavailable (private mode, quota). The tracker keeps
    // working for the session; export still offers a file backup.
  }
}

function exportProgressFile(progress) {
  const payload = {
    app: 'leonida-ledger',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: progress.earned,
    counters: progress.counters,
    spoilerShield: progress.spoilerShield
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-ledger-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function parseImportedProgress(text) {
  const parsed = JSON.parse(text);
  const progress = createEmptyProgress();
  if (Array.isArray(parsed)) {
    // Tolerate a bare array of earned trophy names.
    for (const name of parsed) {
      if (typeof name === 'string') progress.earned[name] = true;
    }
    return progress;
  }
  if (parsed && typeof parsed === 'object') {
    if (parsed.earned && typeof parsed.earned === 'object' && !Array.isArray(parsed.earned)) {
      progress.earned = parsed.earned;
    } else if (Array.isArray(parsed.earned)) {
      for (const name of parsed.earned) {
        if (typeof name === 'string') progress.earned[name] = true;
      }
    }
    if (parsed.counters && typeof parsed.counters === 'object') progress.counters = parsed.counters;
    progress.spoilerShield = parsed.spoilerShield === true;
  }
  return progress;
}
