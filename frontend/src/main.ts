import './style.css';
import type { Cache, Player, Rank, Role, Game, RoleScore } from './types';

// How many recent games to consider when computing scores (user-controlled)
let gameWindow = 20;
let minRoleGames = 0; // 0 = no filter
let activeTab: 'stats' | 'builder' = 'stats';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];

const ROLE_LABELS: Record<Role, string> = {
  top: 'Top', jungle: 'Jungle', mid: 'Mid',
  bot: 'Bot', support: 'Support', flex: 'Flex',
};

const ROLE_ICONS: Record<Role, string> = {
  top: '🛡️', jungle: '🌿', mid: '⚡',
  bot: '🏹', support: '💙', flex: '🔀',
};

const TIER_COLORS: Record<string, string> = {
  IRON: '#6a6a6a', BRONZE: '#a05000', SILVER: '#6a7f9a',
  GOLD: '#e5a330', PLATINUM: '#00b4b4', EMERALD: '#00c080',
  DIAMOND: '#576bce', MASTER: '#9d4dc6', GRANDMASTER: '#e84057',
  CHALLENGER: '#f4c874',
};

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

const OPGG_REGIONS: Record<string, string> = {
  na1: 'na', euw1: 'euw', eune1: 'eune', kr: 'kr',
  br1: 'br', la1: 'lan', la2: 'las', oc1: 'oce',
  tr1: 'tr', ru: 'ru', jp1: 'jp',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function opggUrl(player: Player): string {
  const region = OPGG_REGIONS[player.region] ?? player.region.toLowerCase();
  return `https://www.op.gg/summoners/${region}/${encodeURIComponent(player.gameName)}-${player.tagLine}`;
}

function formatRank(rank: Rank): string {
  const div = ROMAN[rank.division] ?? '';
  return `${rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()}${div ? ` ${div}` : ''}`;
}

function winRate(rank: Rank): string {
  const total = rank.wins + rank.losses;
  return total ? `${Math.round((rank.wins / total) * 100)}%` : '0%';
}

function opScoreColor(score: number): string {
  if (score >= 7)  return '#f4c874';
  if (score >= 6)  return '#00c080';
  if (score >= 5)  return '#4a9eff';
  if (score >= 4)  return '#e5a330';
  return '#e84057';
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Score computation (client-side, respects gameWindow)
// ---------------------------------------------------------------------------

function computeRoleScores(games: Game[]): Partial<Record<Role, RoleScore>> {
  const buckets: Partial<Record<Role, number[]>> = {};
  for (const g of games) {
    if (!g.position || g.opScore == null) continue;
    if (!buckets[g.position]) buckets[g.position] = [];
    buckets[g.position]!.push(g.opScore);
  }
  const result: Partial<Record<Role, RoleScore>> = {};
  for (const [role, scores] of Object.entries(buckets) as [Role, number[]][]) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    result[role] = { avgOpScore: Math.round(avg * 100) / 100, games: scores.length };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Render helpers — Stats tab
// ---------------------------------------------------------------------------

function renderGameRow(game: Game): string {
  if (game.opScore == null) return '';
  const won        = game.result === 'WIN';
  const resultCls  = game.result === 'WIN' ? 'win' : game.result === 'LOSE' ? 'loss' : '';
  const scoreColor = opScoreColor(game.opScore);
  const champ      = game.champion ?? '?';
  const date       = game.createdAt
    ? new Date(game.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return `
    <div class="game-row ${resultCls}">
      <span class="game-result-dot" title="${game.result ?? ''}">${won ? '▲' : '▼'}</span>
      <span class="game-champion">${champ}</span>
      <span class="game-score" style="color:${scoreColor}">${game.opScore.toFixed(2)}</span>
      <span class="game-date">${date}</span>
    </div>`;
}

function renderCard(player: Player, role: Role, roleScore: RoleScore): string {
  const tierColor  = player.rank ? (TIER_COLORS[player.rank.tier] ?? '#888') : '#555';
  const scoreColor = opScoreColor(roleScore.avgOpScore);

  const rankBlock = player.rank
    ? `<div class="rank" style="color:${tierColor}">
         ${formatRank(player.rank)}<span class="lp">${player.rank.lp} LP</span>
       </div>
       <div class="winrate">${winRate(player.rank)} WR · ${player.rank.wins}W ${player.rank.losses}L</div>`
    : `<div class="rank unranked">Unranked</div>`;

  const roleGames = player.recentGames.slice(0, gameWindow).filter(g => g.position === role);

  const gamesHtml = roleGames.length
    ? `<div class="games-list">${roleGames.map(renderGameRow).join('')}</div>`
    : '';

  const cardId = `${player.gameName}-${player.tagLine}-${role}`.replace(/[^a-zA-Z0-9-]/g, '_');

  return `
    <div class="card" id="card-${cardId}">
      <div class="card-header">
        <a class="player-name" href="${opggUrl(player)}" target="_blank" rel="noopener">
          ${player.gameName}<span class="tag">#${player.tagLine}</span>
        </a>
        <button class="toggle-btn" data-card="${cardId}" title="Show games">
          <span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="op-score" style="color:${scoreColor}">
        ${roleScore.avgOpScore.toFixed(2)}
        <span class="op-label">OP Score</span>
      </div>
      <span class="sample-size">${roleScore.games} game${roleScore.games !== 1 ? 's' : ''} as ${ROLE_LABELS[role]}</span>

      ${rankBlock}
      ${gamesHtml}
    </div>`;
}

function renderColumn(role: Role, entries: Array<{ player: Player; score: RoleScore }>): string {
  const sorted = [...entries].sort((a, b) => b.score.avgOpScore - a.score.avgOpScore);

  return `
    <div class="column">
      <div class="column-header">
        <span class="role-icon">${ROLE_ICONS[role]}</span>
        ${ROLE_LABELS[role]}
        <span class="player-count">${entries.length}</span>
      </div>
      ${sorted.length
        ? sorted.map(({ player, score }) => renderCard(player, role, score)).join('')
        : '<div class="empty">No players</div>'}
    </div>`;
}

// ---------------------------------------------------------------------------
// Team Builder — assignment solver
// ---------------------------------------------------------------------------

interface Assignment {
  role: Role;
  player: Player | null;
  score: number | null;
  games: number;
}

function findBestLineup(players: Player[], minGames: number): Assignment[] {
  type Eligible = { role: Role; avgOpScore: number; games: number };

  // Build eligibility per player: only roles with >= minGames games in current window
  const eligibility: Eligible[][] = players.map(p => {
    const scores = computeRoleScores(p.recentGames.slice(0, gameWindow));
    return ROLES.flatMap(role => {
      const rs = scores[role];
      if (!rs || rs.games < minGames) return [];
      return [{ role, avgOpScore: rs.avgOpScore, games: rs.games }];
    });
  });

  let bestScore = -Infinity;
  let bestMap = new Map<Role, { player: Player; score: number; games: number }>();

  // Backtrack over roles, trying each eligible player (or nobody) per role
  function solve(
    roleIdx: number,
    usedPlayers: Set<number>,
    current: Map<Role, { player: Player; score: number; games: number }>,
    currentScore: number,
  ) {
    if (roleIdx === ROLES.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestMap = new Map(current);
      }
      return;
    }

    const role = ROLES[roleIdx];

    // Option: leave this role unassigned
    solve(roleIdx + 1, usedPlayers, current, currentScore);

    // Option: assign an eligible, unused player
    for (let pi = 0; pi < players.length; pi++) {
      if (usedPlayers.has(pi)) continue;
      const eligible = eligibility[pi].find(e => e.role === role);
      if (!eligible) continue;

      current.set(role, { player: players[pi], score: eligible.avgOpScore, games: eligible.games });
      usedPlayers.add(pi);
      solve(roleIdx + 1, usedPlayers, current, currentScore + eligible.avgOpScore);
      usedPlayers.delete(pi);
      current.delete(role);
    }
  }

  solve(0, new Set(), new Map(), 0);

  return ROLES.map(role => {
    const a = bestMap.get(role);
    return a
      ? { role, player: a.player, score: a.score, games: a.games }
      : { role, player: null, score: null, games: 0 };
  });
}

// ---------------------------------------------------------------------------
// Render — Team Builder tab
// ---------------------------------------------------------------------------

function renderTeamBuilder(cache: Cache): string {
  const playerCheckboxes = cache.players.map((p, i) => `
    <label class="tb-player-check">
      <input type="checkbox" class="tb-player-cb" data-idx="${i}" />
      <span class="tb-player-label">${p.gameName}<span class="tag">#${p.tagLine}</span></span>
    </label>`).join('');

  return `
    <div class="tb-wrapper">
      <div class="tb-controls">
        <div class="tb-section-label">Players</div>
        <div class="tb-players">${playerCheckboxes}</div>

        <div class="tb-row">
          <label class="tb-section-label" for="tb-min-games">Min games per role</label>
          <input id="tb-min-games" type="number" class="tb-number-input" value="3" min="1" max="200" />
        </div>

        <button id="tb-solve-btn" class="tb-btn">⚡ Find Best Lineup</button>
      </div>

      <div id="tb-result" class="tb-result-area"></div>
    </div>`;
}

function renderLineupResult(assignments: Assignment[], totalScore: number): string {
  const filledCount = assignments.filter(a => a.player).length;
  const avgColor    = filledCount ? opScoreColor(totalScore / filledCount) : '#888';

  const rows = assignments.map(a => {
    if (!a.player || a.score == null) {
      return `
        <div class="lineup-row lineup-empty">
          <span class="lineup-role-icon">${ROLE_ICONS[a.role]}</span>
          <span class="lineup-role-name">${ROLE_LABELS[a.role]}</span>
          <span class="lineup-player muted">— No eligible player</span>
          <span></span>
        </div>`;
    }
    const color = opScoreColor(a.score);
    return `
      <div class="lineup-row">
        <span class="lineup-role-icon">${ROLE_ICONS[a.role]}</span>
        <span class="lineup-role-name">${ROLE_LABELS[a.role]}</span>
        <a class="lineup-player player-name" href="${opggUrl(a.player)}" target="_blank" rel="noopener">
          ${a.player.gameName}<span class="tag">#${a.player.tagLine}</span>
        </a>
        <span class="lineup-score" style="color:${color}">
          ${a.score.toFixed(2)}
          <span class="lineup-games">${a.games} games</span>
        </span>
      </div>`;
  }).join('');

  return `
    <div class="lineup-card">
      <div class="lineup-header">
        Best lineup &mdash;
        <span style="color:${avgColor}">${totalScore.toFixed(2)}</span>
        <span class="muted"> total · ${filledCount} role${filledCount !== 1 ? 's' : ''} filled</span>
      </div>
      ${rows}
    </div>`;
}

// ---------------------------------------------------------------------------
// Top-level render
// ---------------------------------------------------------------------------

function renderStats(cache: Cache): string {
  const columns: Partial<Record<Role, Array<{ player: Player; score: RoleScore }>>> = {};

  for (const player of cache.players) {
    const windowedGames = player.recentGames.slice(0, gameWindow);
    const roleScores    = computeRoleScores(windowedGames);
    for (const [role, score] of Object.entries(roleScores) as [Role, RoleScore][]) {
      if (minRoleGames > 0 && score.games < minRoleGames) continue;
      if (!columns[role]) columns[role] = [];
      columns[role]!.push({ player, score });
    }
  }

  const allRoles: Role[] = [...ROLES];
  if (columns['flex']?.length) allRoles.push('flex');

  const maxGames = Math.max(...cache.players.map(p => p.recentGames.length), 20);
  const windowOptions = [5, 10, 20, 50, 100, 200]
    .filter(n => n <= maxGames || n === 20)
    .map(n => `<option value="${n}" ${n === gameWindow ? 'selected' : ''}>${n} games</option>`)
    .join('');

  const minGamesOptions = [
    { value: 0, label: 'No filter' },
    { value: 2, label: '2+ games' },
    { value: 3, label: '3+ games' },
    { value: 4, label: '4+ games' },
    { value: 5, label: '5+ games' },
  ].map(o => `<option value="${o.value}" ${o.value === minRoleGames ? 'selected' : ''}>${o.label}</option>`)
   .join('');

  return `
    <div class="controls">
      <label for="window-select">Look back</label>
      <select id="window-select">${windowOptions}</select>
      <span class="controls-divider">·</span>
      <label for="min-games-select">Min games per role</label>
      <select id="min-games-select">${minGamesOptions}</select>
    </div>
    <div class="grid">
      ${allRoles.map(role => renderColumn(role, columns[role] ?? [])).join('')}
    </div>`;
}

function render(cache: Cache): void {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Updated ${timeAgo(cache.lastUpdated)} · ${cache.players.length} players tracked
      </div>
      <div class="tabs">
        <button class="tab-btn ${activeTab === 'stats'   ? 'active' : ''}" data-tab="stats">📊 Stats</button>
        <button class="tab-btn ${activeTab === 'builder' ? 'active' : ''}" data-tab="builder">⚙️ Team Builder</button>
      </div>
    </header>

    <div id="tab-stats"   class="tab-panel ${activeTab === 'stats'   ? '' : 'hidden'}">
      ${renderStats(cache)}
    </div>
    <div id="tab-builder" class="tab-panel ${activeTab === 'builder' ? '' : 'hidden'}">
      ${renderTeamBuilder(cache)}
    </div>`;

  // Tab switching
  app.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab as 'stats' | 'builder';
      render(cache);
    });
  });

  // Stats: window selector
  const select = document.getElementById('window-select') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    gameWindow = parseInt(select.value, 10);
    render(cache);
  });

  // Stats: min games per role filter
  const minGamesSelect = document.getElementById('min-games-select') as HTMLSelectElement | null;
  minGamesSelect?.addEventListener('change', () => {
    minRoleGames = parseInt(minGamesSelect.value, 10);
    render(cache);
  });

  // Stats: expand/collapse game history
  app.querySelectorAll<HTMLButtonElement>('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.dataset.card!;
      const card   = document.getElementById(`card-${cardId}`)!;
      const list   = card.querySelector<HTMLElement>('.games-list');
      const icon   = btn.querySelector<HTMLElement>('.toggle-icon')!;
      if (!list) return;
      const open = list.classList.toggle('open');
      icon.textContent = open ? '▴' : '▾';
    });
  });

  // Team Builder: enforce 5-player cap on checkboxes
  function updateCheckboxCap() {
    const allCbs = [...document.querySelectorAll<HTMLInputElement>('.tb-player-cb')];
    const checkedCount = allCbs.filter(cb => cb.checked).length;
    for (const cb of allCbs) {
      if (!cb.checked) cb.disabled = checkedCount >= 5;
    }
  }

  document.querySelectorAll<HTMLInputElement>('.tb-player-cb').forEach(cb => {
    cb.addEventListener('change', updateCheckboxCap);
  });

  // Team Builder: solve
  document.getElementById('tb-solve-btn')?.addEventListener('click', () => {
    const checked = [...document.querySelectorAll<HTMLInputElement>('.tb-player-cb:checked')]
      .map(cb => parseInt(cb.dataset.idx!, 10));
    const minGames = parseInt(
      (document.getElementById('tb-min-games') as HTMLInputElement).value, 10,
    ) || 1;

    const selectedPlayers = checked.map(i => cache.players[i]).filter(Boolean);
    if (selectedPlayers.length === 0) {
      document.getElementById('tb-result')!.innerHTML =
        '<div class="tb-msg">Select at least one player.</div>';
      return;
    }

    const assignments  = findBestLineup(selectedPlayers, minGames);
    const totalScore   = assignments.reduce((s, a) => s + (a.score ?? 0), 0);
    document.getElementById('tb-result')!.innerHTML = renderLineupResult(assignments, totalScore);
  });
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    const res = await fetch('./data/cache.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cache = await res.json() as Cache;
    render(cache);
  } catch (err) {
    document.getElementById('app')!.innerHTML = `
      <div class="error">
        Failed to load data. Run <code>npm run refresh</code> then <code>npm run build</code>.
      </div>`;
    console.error(err);
  }
}

main();
