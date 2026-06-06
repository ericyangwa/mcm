import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPGG_API    = 'https://mcp-api.op.gg/mcp';
const GAME_WINDOW = 200; // max recent games to keep per player

const RIOT_TO_OPGG_REGION = {
  na1: 'NA', euw1: 'EUW', eune1: 'EUNE', kr: 'KR',
  br1: 'BR', la1: 'LAN', la2: 'LAS', oc1: 'OCE',
  tr1: 'TR', ru: 'RU', jp1: 'JP',
};

// ---------------------------------------------------------------------------
// OP.GG API client
// ---------------------------------------------------------------------------

let callCount = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function opggCall(toolName, args, attempt = 1) {
  const MAX_ATTEMPTS = 3;
  callCount++;
  if (callCount > 1) await sleep(200);

  let res;
  try {
    res = await fetch(OPGG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: callCount,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
    });
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      const wait = attempt * 5000;
      console.warn(`  [retry] Network error on ${toolName}, retrying in ${wait / 1000}s... (${err.message})`);
      await sleep(wait);
      return opggCall(toolName, args, attempt + 1);
    }
    throw new Error(`Network error after ${MAX_ATTEMPTS} attempts for ${toolName}: ${err.message}`);
  }

  if (res.status === 429) {
    if (attempt < MAX_ATTEMPTS) {
      const wait = attempt * 10000;
      console.warn(`  [retry] Rate limited on ${toolName}, waiting ${wait / 1000}s...`);
      await sleep(wait);
      return opggCall(toolName, args, attempt + 1);
    }
    throw new Error(`Rate limited after ${MAX_ATTEMPTS} attempts for ${toolName}`);
  }

  if (!res.ok) throw new Error(`OP.GG HTTP ${res.status} for ${toolName}`);

  const json = await res.json();
  if (json.error) throw new Error(`OP.GG error: ${json.error.message}`);

  const text = json.result?.content?.[0]?.text;
  if (!text) throw new Error(`No content in OP.GG response for ${toolName}`);
  return parseOPGGText(text);
}

// ---------------------------------------------------------------------------
// OP.GG response parser
// ---------------------------------------------------------------------------

function parseOPGGText(text) {
  const lines = text.trim().split('\n');
  const classDefs = {};
  let dataLine = '';

  for (const line of lines) {
    const m = line.match(/^class (\w+): (.+)$/);
    if (m) classDefs[m[1]] = m[2].split(',');
    else if (line.trim()) dataLine = line.trim();
  }

  if (!dataLine) throw new Error('No data line in OP.GG response');
  return parseValue(dataLine, classDefs, { i: 0 });
}

function parseValue(s, defs, cur) {
  skipWS(s, cur);
  const c = s[cur.i];
  if (c === '"')                              return parseString(s, cur);
  if (c === '[')                              return parseArray(s, defs, cur);
  if (s.slice(cur.i, cur.i + 4) === 'null')  { cur.i += 4; return null; }
  if (c === '-' || (c >= '0' && c <= '9'))   return parseNumber(s, cur);
  if (/[A-Z]/.test(c))                       return parseClass(s, defs, cur);
  throw new Error(`Unexpected '${c}' at ${cur.i}: ...${s.slice(cur.i, cur.i + 20)}`);
}

function parseClass(s, defs, cur) {
  let name = '';
  while (cur.i < s.length && /\w/.test(s[cur.i])) name += s[cur.i++];
  expect(s, cur, '(');
  const args = [];
  if (s[cur.i] !== ')') {
    args.push(parseValue(s, defs, cur));
    while (s[cur.i] === ',') { cur.i++; args.push(parseValue(s, defs, cur)); }
  }
  expect(s, cur, ')');
  const obj = {};
  (defs[name] ?? []).forEach((f, i) => { if (i < args.length) obj[f] = args[i]; });
  return obj;
}

function parseArray(s, defs, cur) {
  expect(s, cur, '[');
  const arr = [];
  if (s[cur.i] === ']') { cur.i++; return arr; }
  arr.push(parseValue(s, defs, cur));
  while (s[cur.i] === ',') { cur.i++; arr.push(parseValue(s, defs, cur)); }
  expect(s, cur, ']');
  return arr;
}

function parseString(s, cur) {
  expect(s, cur, '"');
  let out = '';
  while (cur.i < s.length && s[cur.i] !== '"')
    out += s[cur.i] === '\\' ? (cur.i++, s[cur.i++]) : s[cur.i++];
  expect(s, cur, '"');
  return out;
}

function parseNumber(s, cur) {
  let n = '';
  if (s[cur.i] === '-') n += s[cur.i++];
  while (cur.i < s.length && /[\d.]/.test(s[cur.i])) n += s[cur.i++];
  return parseFloat(n);
}

function skipWS(s, cur) { while (cur.i < s.length && /\s/.test(s[cur.i])) cur.i++; }
function expect(s, cur, ch) {
  if (s[cur.i] !== ch) throw new Error(`Expected '${ch}' at ${cur.i}, got '${s[cur.i]}'`);
  cur.i++;
}

// ---------------------------------------------------------------------------
// Role scores — compute per-role averages from a game list
// ---------------------------------------------------------------------------

const POSITION_MAP = {
  TOP: 'top', JUNGLE: 'jungle', MID: 'mid', ADC: 'bot', SUPPORT: 'support',
};

function computeRoleScores(games) {
  const buckets = {};
  for (const g of games) {
    if (!g.position) continue;
    if (!buckets[g.position]) buckets[g.position] = [];
    buckets[g.position].push(g.opScore);
  }
  const result = {};
  for (const [role, scores] of Object.entries(buckets)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    result[role] = {
      avgOpScore: Math.round(avg * 100) / 100,
      games: scores.length,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Per-player refresh
// ---------------------------------------------------------------------------

async function refreshPlayer(player, existingPlayer) {
  const { gameName, tagLine } = player;
  const region = RIOT_TO_OPGG_REGION[player.region] ?? player.region.toUpperCase();
  const label  = `${gameName}#${tagLine}`;

  console.log(`\nProcessing ${label} (${region})`);

  // 1. Fetch profile for rank + updated_at
  console.log('  Fetching profile...');
  let profile;
  try {
    profile = await opggCall('lol_get_summoner_profile', {
      game_name: gameName, tag_line: tagLine, region,
      desired_output_fields: [
        'data.summoner.updated_at',
        'data.summoner.league_stats[].game_type',
        'data.summoner.league_stats[].tier_info.{tier,division,lp}',
        'data.summoner.league_stats[].{win,lose}',
        'data.summoner.most_champions.champion_stats[].{champion_name,play,win}',
      ],
    });
  } catch (err) {
    console.warn(`  Profile fetch failed: ${err.message}`);
    return null;
  }

  const summoner = profile?.data?.summoner;
  if (!summoner) { console.warn('  No summoner data, skipping.'); return null; }

  const profileUpdatedAt = summoner.updated_at ?? null;

  const flexStat = summoner.league_stats?.find(s => s.game_type === 'FLEXRANKED');
  const rank = flexStat?.tier_info?.tier
    ? { tier: flexStat.tier_info.tier, division: flexStat.tier_info.division,
        lp: flexStat.tier_info.lp, wins: flexStat.win, losses: flexStat.lose }
    : null;

  if (!rank) console.log('  No flex rank (unranked).');

  const topChampions = (summoner.most_champions?.champion_stats ?? [])
    .sort((a, b) => b.play - a.play).slice(0, 5)
    .map(c => ({ name: c.champion_name, play: c.play, win: c.win }));

  // 2. Check if profile has updated since last cache
  const cachedGames      = existingPlayer?.recentGames ?? [];
  const cachedUpdatedAt  = existingPlayer?.profileUpdatedAt ?? null;

  if (profileUpdatedAt && profileUpdatedAt === cachedUpdatedAt && cachedGames.length > 0) {
    console.log('  Profile unchanged since last run — reusing cached games.');
    return {
      gameName, tagLine, region: player.region,
      rank, profileUpdatedAt, topChampions,
      recentGames: cachedGames,
    };
  }

  // 3. Fetch recent flex matches
  console.log('  Fetching recent flex matches...');
  let matchData;
  try {
    matchData = await opggCall('lol_list_summoner_matches', {
      game_name: gameName, tag_line: tagLine, region,
      limit: 20,
      desired_output_fields: [
        'data.game_history[].game_type',
        'data.game_history[].id',
        'data.game_history[].created_at',
        'data.game_history[].participants[].stats.op_score',
        'data.game_history[].participants[].stats.result',
        'data.game_history[].participants[].position',
        'data.game_history[].participants[].champion_name',
      ],
    });
  } catch (err) {
    console.warn(`  Match fetch failed: ${err.message}`);
  }

  const allGames   = matchData?.data?.game_history ?? [];
  const flexGames  = allGames.filter(g => g.game_type === 'FLEXRANKED');

  // 4. Incremental merge — stop at the first game ID we already have cached
  const cachedIds  = new Set(cachedGames.map(g => g.id));
  const newGames   = [];

  for (const g of flexGames) {
    if (cachedIds.has(g.id)) break; // hit a game we already have — stop
    const participant = g.participants?.[0];
    if (!participant) continue;

    const position = POSITION_MAP[participant.position] ?? participant.position?.toLowerCase() ?? null;
    newGames.push({
      id:        g.id,
      createdAt: g.created_at,
      opScore:   participant.stats?.op_score ?? null,
      result:    participant.stats?.result ?? null,   // "WIN" | "LOSE"
      position,
      champion:  participant.champion_name ?? null,
    });
  }

  if (newGames.length === 0) {
    console.log('  No new games found.');
  } else {
    console.log(`  ${newGames.length} new game(s) found.`);
  }

  // Merge: prepend new games, trim to window
  const updatedGames = [...newGames, ...cachedGames].slice(0, GAME_WINDOW);
  const roleScores = computeRoleScores(updatedGames);
  const roleSummary = Object.entries(roleScores)
    .map(([r, s]) => `${r}: ${s.avgOpScore} (${s.games}g)`).join(', ');
  console.log(`  Role scores (all games) — ${roleSummary || 'none'}`);

  return {
    gameName, tagLine, region: player.region,
    rank, profileUpdatedAt, topChampions,
    recentGames: updatedGames,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const playersPath = resolve(ROOT, 'players.json');
  // Write to frontend/public/data/ — Vite copies this into docs/ on build
  // and serves it directly during npm run dev
  const cachePath = resolve(ROOT, 'frontend', 'public', 'data', 'cache.json');

  const { mkdirSync } = await import('fs');
  mkdirSync(resolve(ROOT, 'frontend', 'public', 'data'), { recursive: true });

  const players = JSON.parse(readFileSync(playersPath, 'utf8'));

  // Load existing cache for incremental updates
  let existingCache = { players: [] };
  if (existsSync(cachePath)) {
    try { existingCache = JSON.parse(readFileSync(cachePath, 'utf8')); }
    catch { console.warn('Could not parse existing cache, starting fresh.'); }
  }

  const existingByName = new Map(
    (existingCache.players ?? []).map(p => [`${p.gameName}#${p.tagLine}`, p])
  );

  const results = [];
  for (const player of players) {
    try {
      const existing = existingByName.get(`${player.gameName}#${player.tagLine}`) ?? null;
      const result   = await refreshPlayer(player, existing);
      if (result) results.push(result);
    } catch (err) {
      console.error(`  Error processing ${player.gameName}#${player.tagLine}:`, err.message);
    }
  }

  // Find the most recent game timestamp across all players
  let lastGameAt = null;
  for (const p of results) {
    for (const g of p.recentGames ?? []) {
      if (g.createdAt && (!lastGameAt || g.createdAt > lastGameAt)) {
        lastGameAt = g.createdAt;
      }
    }
  }

  writeFileSync(cachePath, JSON.stringify({
    lastRefreshed: new Date().toISOString(),  // when the GHA last ran
    lastGameAt,                               // when the most recent game was played
    players: results,
  }, null, 2));

  console.log(`\nDone. ${results.length}/${players.length} players updated.`);
  console.log(`Total OP.GG API calls: ${callCount}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
