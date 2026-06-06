import './style.css';
import type { Cache, Player, Rank, Role, Game, RoleScore } from './types';

// How many recent games to consider when computing scores (user-controlled)
let gameWindow = 20;

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
// Render helpers
// ---------------------------------------------------------------------------

function renderGameRow(game: Game): string {
  if (game.opScore == null) return '';
  const won       = game.result === 'WIN';
  const resultCls = game.result === 'WIN' ? 'win' : game.result === 'LOSE' ? 'loss' : '';
  const scoreColor = opScoreColor(game.opScore);
  const champ     = game.champion ?? '?';
  const date      = game.createdAt
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

  // Games for this specific role, limited to current window
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
// Main render
// ---------------------------------------------------------------------------

function render(cache: Cache): void {
  // Group players by every role they have a score for, using the current window
  const columns: Partial<Record<Role, Array<{ player: Player; score: RoleScore }>>> = {};

  for (const player of cache.players) {
    const windowedGames = player.recentGames.slice(0, gameWindow);
    const roleScores = computeRoleScores(windowedGames);
    for (const [role, score] of Object.entries(roleScores) as [Role, RoleScore][]) {
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

  const app = document.getElementById('app')!;
  app.innerHTML = `
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Updated ${timeAgo(cache.lastUpdated)} · ${cache.players.length} players tracked
      </div>
      <div class="controls">
        <label for="window-select">Look back</label>
        <select id="window-select">${windowOptions}</select>
      </div>
    </header>
    <div class="grid">
      ${allRoles.map(role => renderColumn(role, columns[role] ?? [])).join('')}
    </div>`;

  // Wire up toggle buttons
  app.querySelectorAll<HTMLButtonElement>('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.dataset.card!;
      const card = document.getElementById(`card-${cardId}`)!;
      const list = card.querySelector<HTMLElement>('.games-list');
      const icon = btn.querySelector<HTMLElement>('.toggle-icon')!;
      if (!list) return;
      const open = list.classList.toggle('open');
      icon.textContent = open ? '▴' : '▾';
    });
  });

  // Wire up window selector
  const select = document.getElementById('window-select') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    gameWindow = parseInt(select.value, 10);
    render(cache);
  });
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    const res = await fetch('./data/cache.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cache: Cache = await res.json();
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
