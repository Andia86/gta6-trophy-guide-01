// Leonida Ledger — view renderers.
// Builds the trophy cards, the guide detail panel, the staged Roadmap view
// and the Missables view from the trophy data and the progress store.
// Everything is DOM built with textContent, so trophy text is never parsed
// as markup. Spoiler rule: with the shield on, an unearned story trophy is
// shown as a placeholder until it is earned.
'use strict';

const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze'
};

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online'
};

const ROADMAP_STAGES = [
  {
    key: 'Stage 1 — Story',
    title: 'Stage 1 — Story, in order',
    blurb: 'Play the campaign from Gone Fishing to the final mission, in order. Keep a manual save at the start of every chapter so that chapter stays within your own reach, and keep cheats out of a trophy run as a precaution. One stop in this stage is time-sensitive: the Chapter 1 meditation for Positive Mental Attitude, flagged on its card and in the Missables view. Everything else in this stage is unmissable story progress.'
  },
  {
    key: 'Stage 2 — Collectibles & Activities',
    title: 'Stage 2 — Collectibles & activities',
    blurb: 'With the map open, sweep the strands, sets and one-off moments: finish the character strands (Andy, Kenton, Billy, Randy, Tyrone and Bret), complete the card sets, explore all 52 areas of Leonida, and clear the partner, robbery and hidden-moment trophies while you travel. Finish any meditation spots left over from Stage 1 here.'
  },
  {
    key: 'Stage 3 — Counts, Grinds & Cleanup',
    title: 'Stage 3 — Counts, grinds & cleanup',
    blurb: 'The long counters: 250 stunts, 42 shooting-range golds, 100 WAiNK locations, 100 vehicles, 50 challenges, 500 choices, $250,000 laundered and $100,000 spent, every gang operation and every garage. This stage ends with A Long Road, the gold for 100% completion. There are no online trophies in this list, so nothing here needs another player or a network connection.'
  },
  {
    key: 'Final — Platinum',
    title: 'Final — The platinum',
    blurb: 'When the other 54 trophies are earned, Vice Got a Price! unlocks by itself. If the counter says 54 of 55, the checklist filters (State: not yet earned) show the one trophy still standing between you and Leonida legend status.'
  }
];

function isSpoilerHidden(trophy, progress) {
  return progress.spoilerShield === true
    && trophy.kind === 'story'
    && !progress.earned[trophy.name];
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function buildBadge(text, className) {
  const span = document.createElement('span');
  span.className = 'badge ' + className;
  span.textContent = text;
  return span;
}

function renderTrophyCard(trophy, progress, callbacks) {
  const card = document.createElement('article');
  card.className = 'trophy-card grade-' + trophy.grade;
  if (progress.earned[trophy.name]) card.classList.add('is-earned');
  if (callbacks.selectedName === trophy.name) card.classList.add('is-selected');

  const hiddenBySpoiler = isSpoilerHidden(trophy, progress);

  const head = document.createElement('div');
  head.className = 'card-head';
  const checkLabel = document.createElement('label');
  checkLabel.className = 'earned-check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = progress.earned[trophy.name] === true;
  box.setAttribute('aria-label', 'Mark earned');
  box.addEventListener('change', () => callbacks.onToggleEarned(trophy, box.checked));
  const checkText = document.createElement('span');
  checkText.textContent = 'Earned';
  checkLabel.append(box, checkText);
  head.appendChild(checkLabel);
  head.appendChild(buildBadge(GRADE_LABELS[trophy.grade] || trophy.grade, 'badge-grade grade-' + trophy.grade));
  if (trophy.hidden) head.appendChild(buildBadge('Hidden', 'badge-hidden'));
  if (trophy.missable) head.appendChild(buildBadge('MISSABLE', 'badge-missable'));
  head.appendChild(buildBadge(KIND_LABELS[trophy.kind] || trophy.kind, 'badge-kind'));
  card.appendChild(head);

  const title = document.createElement('h3');
  title.className = 'trophy-name';
  title.textContent = hiddenBySpoiler ? '— Story trophy (spoiler shield on) —' : trophy.name;
  card.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = hiddenBySpoiler
    ? 'Name and official description hidden until earned. Turn the spoiler shield off, or earn it, to reveal it.'
    : trophy.description;
  card.appendChild(desc);

  if (trophy.chapter && !hiddenBySpoiler) {
    const chapter = document.createElement('p');
    chapter.className = 'trophy-chapter';
    chapter.textContent = trophy.chapter;
    card.appendChild(chapter);
  }

  if (trophy.target) {
    const counterRow = document.createElement('div');
    counterRow.className = 'counter-row';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count');
    minus.addEventListener('click', () => callbacks.onCounter(trophy, -1));
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count');
    plus.addEventListener('click', () => callbacks.onCounter(trophy, 1));
    const value = document.createElement('span');
    value.className = 'counter-value';
    const current = progress.counters[trophy.name] || 0;
    value.textContent = formatCount(current) + ' / ' + formatCount(trophy.target);
    const bar = document.createElement('div');
    bar.className = 'counter-bar';
    const fill = document.createElement('div');
    fill.className = 'counter-fill';
    fill.style.width = Math.min(100, (current / trophy.target) * 100) + '%';
    bar.appendChild(fill);
    counterRow.append(minus, value, plus, bar);
    card.appendChild(counterRow);
  }

  const guideButton = document.createElement('button');
  guideButton.type = 'button';
  guideButton.className = 'guide-btn';
  guideButton.textContent = 'Read guide + sources';
  guideButton.addEventListener('click', () => callbacks.onSelect(trophy));
  card.appendChild(guideButton);
  return card;
}

function renderGuidePanel(trophy, progress, callbacks) {
  const panel = document.getElementById('guide-content');
  const empty = document.getElementById('guide-empty');
  panel.replaceChildren();
  if (!trophy) {
    panel.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  panel.hidden = false;

  if (isSpoilerHidden(trophy, progress)) {
    const shieldTitle = document.createElement('h2');
    shieldTitle.textContent = 'Story trophy — spoiler shield on';
    panel.appendChild(shieldTitle);
    const shieldText = document.createElement('p');
    shieldText.textContent = 'While the spoiler shield is on and this trophy is unearned, its name, official description and guide all stay hidden in this panel too. Earn it in the game, or switch the shield off in the filter bar, and the full guide appears here.';
    panel.appendChild(shieldText);
    return;
  }

  const title = document.createElement('h2');
  title.textContent = trophy.name;
  panel.appendChild(title);

  const badges = document.createElement('div');
  badges.className = 'panel-badges';
  badges.appendChild(buildBadge(GRADE_LABELS[trophy.grade] || trophy.grade, 'badge-grade grade-' + trophy.grade));
  if (trophy.hidden) badges.appendChild(buildBadge('Hidden trophy', 'badge-hidden'));
  if (trophy.missable) badges.appendChild(buildBadge('MISSABLE', 'badge-missable'));
  badges.appendChild(buildBadge(KIND_LABELS[trophy.kind] || trophy.kind, 'badge-kind'));
  if (progress.earned[trophy.name]) badges.appendChild(buildBadge('Earned ✓', 'badge-earned'));
  panel.appendChild(badges);

  const officialHead = document.createElement('h3');
  officialHead.textContent = 'Official description (PlayStation)';
  panel.appendChild(officialHead);
  const official = document.createElement('p');
  official.className = 'official-desc';
  official.textContent = trophy.description;
  panel.appendChild(official);

  if (trophy.chapter) {
    const context = document.createElement('p');
    context.className = 'panel-context';
    context.textContent = 'Context: ' + trophy.chapter + ' · Roadmap: ' + trophy.stage;
    panel.appendChild(context);
  }

  if (trophy.missable) {
    const warning = document.createElement('div');
    warning.className = 'missable-warning';
    const strong = document.createElement('strong');
    strong.textContent = '⚠ MISSABLE — LAST CHANCE IN CHAPTER 1. ';
    warning.appendChild(strong);
    warning.appendChild(document.createTextNode(
      'One meditation spot for this trophy is a Chapter 1 opportunity that disappears when the chapter ends. Do it as soon as it is offered, and keep a Chapter 1 manual save until this trophy is earned so that moment stays within reach.'
    ));
    panel.appendChild(warning);
  }

  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide (our own words)';
  panel.appendChild(guideHead);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  panel.appendChild(guide);

  const sourcesHead = document.createElement('h3');
  sourcesHead.textContent = 'Sources';
  panel.appendChild(sourcesHead);
  const list = document.createElement('ul');
  list.className = 'sources-list';
  for (const source of trophy.sources || []) {
    const item = document.createElement('li');
    item.textContent = source;
    list.appendChild(item);
  }
  panel.appendChild(list);

  if (trophy.target) {
    const count = document.createElement('p');
    count.className = 'panel-context';
    count.textContent = 'Tracked count: ' + formatCount(progress.counters[trophy.name] || 0) + ' / ' + formatCount(trophy.target) + ' — use the − / + counter on its checklist card.';
    panel.appendChild(count);
  }

  const note = document.createElement('p');
  note.className = 'panel-context';
  note.textContent = 'Sources are named, never copied: names, descriptions and grades come from the official list; the guide text is written for this guide.';
  panel.appendChild(note);

  if (callbacks && typeof callbacks.onToggleEarned === 'function') {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-btn panel-toggle';
    const isEarned = progress.earned[trophy.name] === true;
    toggle.textContent = isEarned ? '✓ Earned — tap to undo' : 'Mark this trophy as earned';
    toggle.addEventListener('click', () => callbacks.onToggleEarned(trophy, !isEarned));
    panel.appendChild(toggle);
  }
}

function stageTrophies(trophies, stageKey) {
  return trophies.filter((trophy) => {
    if (stageKey === 'Stage 1 — Story') return trophy.stage.indexOf('Stage 1') === 0;
    if (stageKey === 'Stage 2 — Collectibles & Activities') return trophy.stage.indexOf('Stage 2') === 0 || trophy.id === 28;
    if (stageKey === 'Stage 3 — Counts, Grinds & Cleanup') return trophy.stage.indexOf('Stage 3') === 0;
    return trophy.stage.indexOf('Final') === 0;
  });
}

function renderRoadmap(trophies, progress, callbacks) {
  const body = document.getElementById('roadmap-body');
  body.replaceChildren();
  const intro = document.createElement('div');
  intro.className = 'roadmap-intro';
  const heading = document.createElement('h2');
  heading.textContent = 'Roadmap to the Platinum — built from the official descriptions';
  intro.appendChild(heading);
  const text = document.createElement('p');
  text.textContent = 'Four stages, in order. The stage of every trophy comes from what its official description asks for: chapter and mission trophies first, collectibles and activities second, the tracked counts and 100% completion third, and the platinum last. Save discipline for the whole run: a manual save at the start of every chapter, one untouched save before the final mission, cheats kept off the trophy save as a precaution, and the Chapter 1 meditation done the moment it appears.';
  intro.appendChild(text);
  body.appendChild(intro);

  for (const stage of ROADMAP_STAGES) {
    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    const title = document.createElement('h3');
    const members = stageTrophies(trophies, stage.key);
    const done = members.filter((trophy) => progress.earned[trophy.name]).length;
    title.textContent = stage.title + ' — ' + done + ' / ' + members.length + ' earned';
    section.appendChild(title);
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    section.appendChild(blurb);
    const list = document.createElement('ol');
    list.className = 'roadmap-list';
    for (const trophy of members) {
      const item = document.createElement('li');
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'roadmap-link';
      const hiddenBySpoiler = isSpoilerHidden(trophy, progress);
      link.textContent = (progress.earned[trophy.name] ? '✓ ' : '') + (hiddenBySpoiler ? 'Story trophy (shielded)' : trophy.name);
      link.addEventListener('click', () => callbacks.onSelect(trophy));
      item.appendChild(link);
      const meta = document.createElement('span');
      meta.className = 'roadmap-meta';
      meta.textContent = ' — ' + (GRADE_LABELS[trophy.grade] || trophy.grade)
        + (trophy.target ? ' · ' + formatCount(trophy.target) + ' tracked' : '')
        + (trophy.missable ? ' · MISSABLE: Chapter 1 stop' : '')
        + (trophy.chapter && !hiddenBySpoiler ? ' · ' + trophy.chapter : '');
      item.appendChild(meta);
      list.appendChild(item);
    }
    section.appendChild(list);
    body.appendChild(section);
  }
}

function renderMissables(trophies, progress, callbacks) {
  const body = document.getElementById('missables-body');
  body.replaceChildren();
  const missables = trophies.filter((trophy) => trophy.missable);

  const banner = document.createElement('div');
  banner.className = 'last-chance';
  const bannerTitle = document.createElement('h2');
  bannerTitle.textContent = '⚠ LAST CHANCE — ONE MISSABLE TROPHY';
  banner.appendChild(bannerTitle);
  const bannerText = document.createElement('p');
  bannerText.textContent = 'The published guides agree there is exactly ONE missable trophy in the 55: Positive Mental Attitude. One of its 18 meditation spots is a Chapter 1 opportunity that disappears when Chapter 1 ends, and once the chapter closes that spot is gone for this playthrough. Do it in Chapter 1, and keep a Chapter 1 manual save until the trophy pops.';
  banner.appendChild(bannerText);
  body.appendChild(banner);

  const advice = document.createElement('div');
  advice.className = 'save-advice';
  const adviceTitle = document.createElement('h3');
  adviceTitle.textContent = 'Save discipline that protects the platinum';
  advice.appendChild(adviceTitle);
  const tips = [
    'Keep a manual save at the start of every chapter, and never overwrite the Chapter 1 save until Positive Mental Attitude is earned.',
    'Keep one untouched save from just before the final mission.',
    'Rotate the remaining save slots as you play; never rely on the autosave alone.',
    'Keep cheats off your trophy save as a precaution, so nothing about the run is left in doubt.',
    'After Chapter 1, the remaining meditation spots stay available in free roam: sweep them in Stage 2 and tick the counter after each one.'
  ];
  const tipList = document.createElement('ul');
  for (const tip of tips) {
    const item = document.createElement('li');
    item.textContent = tip;
    tipList.appendChild(item);
  }
  advice.appendChild(tipList);
  body.appendChild(advice);

  for (const trophy of missables) {
    body.appendChild(renderTrophyCard(trophy, progress, callbacks));
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = 'Status: ' + (progress.earned[trophy.name]
      ? 'Earned — the one missable trophy is safe. ✓'
      : 'Not yet earned — if you are still in Chapter 1, do the Chapter 1 meditation now; if you kept a Chapter 1 save, it can still save this run.');
    body.appendChild(note);
  }
}
