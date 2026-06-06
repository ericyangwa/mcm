/**
 * find-teammates.js
 *
 * One-off script. Looks at the last N flex games of a seed player,
 * collects all unique teammates, resolves their Riot IDs, and prints
 * suggested players.json entries to stdout.
 *
 * Usage:
 *   node scripts/find-teammates.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Config — edit these if needed
// ---------------------------------------------------------------------------

const SEED_GAME_NAME = 'TheMagykal';
const SEED_TAG_LINE  = 'NA1';
const SEED_REGION    = 'na1';
const MATCH_COUNT    = 10;   // how many recent flex games to scan
const QUEUE          = 440;  // 440 = Ranked Flex

// ---------------------------------------------------------------------------

const HARDCODED_API_KEY = 'RGAPI-your-key-here'; // replace for local use, never commit your real key
const API_KEY = process.env.RIOT_API_KEY ?? HARDCODED_API_KEY;

const PLATFORM_TO_CLUSTER = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  euw1: 'europe', eune1: 'europe', tr1: 'europe', ru: 'europe',
  kr: 'asia', jp1: 'asia',
  oc1: 'sea',
};

const cluster = PLATFORM_TO_CLUSTER[SEED_REGION];

// Simple rate limiter — same as refresh.js
const CALLS = [];
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function riotFetch(url) {
  const now = Date.now();
  CALLS.splice(0, CALLS.length, ...CALLS.filter(t => now - t < 120_000));

  if (CALLS.length >= 95) {
    const waitMs = 120_000 - (now - CALLS[0]) + 500;
    console.error(`  [rate] waiting ${(waitMs/1000).toFixed(1)}s...`);
    await sleep(waitMs);
  }

  if (CALLS.length > 0) {
    const gap = Date.now() - CALLS[CALLS.length - 1];
    if (gap < 55) await sleep(55 - gap);
  }

  CALLS.push(Date.now());

  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } });

  if (res.status === 429) {
    const wait = parseInt(res.headers.get('Retry-After') ?? '10', 10) * 1000;
    console.error(`  [rate] 429, retrying after ${wait/1000}s`);
    await sleep(wait);
    return riotFetch(url);
  }

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// ---------------------------------------------------------------------------

async function main() {
  // 1. Resolve seed player's PUUID (check players.json first to save a call)
  let seedPuuid = null;
  try {
    const players = JSON.parse(readFileSync(resolve(ROOT, 'players.json'), 'utf8'));
    const existing = players.find(
      p => p.gameName.toLowerCase() === SEED_GAME_NAME.toLowerCase() &&
           p.tagLine.toLowerCase() === SEED_TAG_LINE.toLowerCase()
    );
    if (existing?.puuid) {
      seedPuuid = existing.puuid;
      console.error(`Using cached PUUID for ${SEED_GAME_NAME}#${SEED_TAG_LINE}`);
    }
  } catch {}

  if (!seedPuuid) {
    console.error(`Resolving PUUID for ${SEED_GAME_NAME}#${SEED_TAG_LINE}...`);
    const account = await riotFetch(
      `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/` +
      `${encodeURIComponent(SEED_GAME_NAME)}/${encodeURIComponent(SEED_TAG_LINE)}`
    );
    if (!account) {
      console.error('Seed account not found. Check SEED_GAME_NAME and SEED_TAG_LINE.');
      process.exit(1);
    }
    seedPuuid = account.puuid;
  }

  // 2. Fetch last N flex match IDs
  console.error(`Fetching last ${MATCH_COUNT} flex games...`);
  const matchIds = await riotFetch(
    `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${seedPuuid}/ids` +
    `?queue=${QUEUE}&count=${MATCH_COUNT}`
  );

  if (!matchIds?.length) {
    console.error('No flex matches found. Try increasing MATCH_COUNT or changing QUEUE to 0 for all queues.');
    process.exit(1);
  }

  console.error(`Found ${matchIds.length} matches. Scanning for teammates...`);

  // 3. For each match, grab teammates (same teamId as seed player)
  // puuid → { gameName, tagLine, appearances }
  const teammates = new Map();

  for (const matchId of matchIds) {
    console.error(`  Scanning ${matchId}...`);
    const match = await riotFetch(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
    );
    if (!match) continue;

    const participants = match.info.participants;
    const seedParticipant = participants.find(p => p.puuid === seedPuuid);
    if (!seedParticipant) continue;

    const seedTeamId = seedParticipant.teamId;

    for (const p of participants) {
      if (p.puuid === seedPuuid) continue;             // skip the seed player themselves
      if (p.teamId !== seedTeamId) continue;           // only teammates, not enemies

      if (!teammates.has(p.puuid)) {
        teammates.set(p.puuid, { puuid: p.puuid, appearances: 0, riotId: null });
      }
      teammates.get(p.puuid).appearances++;
    }
  }

  console.error(`\nFound ${teammates.size} unique teammates. Resolving Riot IDs...`);

  // 4. Resolve Riot ID for each teammate
  for (const [puuid, data] of teammates) {
    const account = await riotFetch(
      `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`
    );
    if (account) {
      data.riotId = { gameName: account.gameName, tagLine: account.tagLine };
    }
  }

  // 5. Sort by appearances descending and print results
  const sorted = [...teammates.values()]
    .filter(t => t.riotId)
    .sort((a, b) => b.appearances - a.appearances);

  console.error(`\nTotal API calls: ${CALLS.length}`);
  console.error('─'.repeat(50));
  console.error(`Results (sorted by games played together):\n`);

  // Print human-readable summary to stderr so it doesn't pollute the JSON
  for (const t of sorted) {
    console.error(`  ${t.riotId.gameName}#${t.riotId.tagLine} — appeared in ${t.appearances}/${matchIds.length} games`);
  }

  console.error('\n' + '─'.repeat(50));
  console.error('Suggested players.json entries (copy into your file):\n');

  // Print valid JSON to stdout for easy piping/copying
  const entries = sorted.map(t => ({
    gameName: t.riotId.gameName,
    tagLine: t.riotId.tagLine,
    puuid: t.puuid,
    region: SEED_REGION,
    topChampions: [],
  }));

  console.log(JSON.stringify(entries, null, 2));
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
