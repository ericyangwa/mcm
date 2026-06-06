# League Friend Group Tracker — Plan

## Overview

A static website that displays your friend group's League of Legends ranks, sorted by role. Data is refreshed automatically via a GitHub Actions cron job and stored as a committed JSON file — no database, no backend, no cost.

---

## Architecture

```
GitHub repo (public)
├── players.json                  ← you maintain this
├── data/
│   └── cache.json                ← auto-generated, committed by Actions
├── scripts/
│   └── refresh.js                ← Node script: calls Riot API, writes cache.json
├── .github/
│   └── workflows/
│       └── refresh.yml           ← cron job: runs refresh.js, commits result
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js                    ← fetches cache.json, renders UI
└── data/
    └── champions.json            ← static champion→role mapping (Meraki Analytics)
```

Hosting: **GitHub Pages** (free, serves the frontend + cache.json as static files).

---

## Player Config (`players.json`)

Each friend is an entry with their summoner name, region, and top champions. Role is optional — if omitted, it is inferred from champion data or match history.

```json
[
  {
    "gameName": "SummonerOne",
    "tagLine": "NA1",
    "puuid": null,
    "region": "na1",
    "topChampions": ["Graves", "Hecarim", "Vi"]
  },
  {
    "gameName": "SummonerTwo",
    "tagLine": "NA1",
    "region": "na1",
    "topChampions": ["Lux", "Morgana"],
    "role": "support"
  }
]
```

`puuid` can be left null on first run — the refresh script will resolve it via the Riot ID and write it back.

**Platform regions (for summoner/league/mastery):** `na1`, `euw1`, `eune1`, `kr`, `br1`, `la1`, `la2`, `oc1`, `tr1`, `ru`, `jp1`  
**Regional clusters (for account + match history):** `americas` (na1, br1, la1, la2), `europe` (euw1, eune1, tr1, ru), `asia` (kr, jp1), `sea` (oc1)

---

## Role Detection Logic

Runs per player during each refresh, in priority order:

```
1. Role explicitly set in players.json
        → use it, skip all detection

2. topChampions all map to the same role in champions.json
        → use that role, no extra API calls

3. topChampions are ambiguous (e.g. mix of mid/support champs)
        → fetch last 10 matches via Match API
        → tally teamPosition across those matches
        → use the majority role
        → cache result so it isn't re-fetched next run if unchanged

4. Still ambiguous (e.g. truly multi-role player)
        → label as "flex", show in an "Other" group on the frontend
```

**Roles:** `top`, `jungle`, `mid`, `bot`, `support`  
**teamPosition values from Riot API:** `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`

---

## Data Sources

### Riot API (requires key)
| Endpoint | Purpose | Calls/player |
|---|---|---|
| `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` | Resolve PUUID via Riot ID | 1 (one-time, cached) |
| `GET /lol/summoner/v4/summoners/by-puuid/{puuid}` | Resolve summoner ID from PUUID | 1 (one-time, cached) |
| `GET /lol/league/v4/entries/by-summoner/{id}` | Rank, LP, W/L | 1 |
| `GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top` | Top 5 masteries | 1 |
| `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` | Last 10 match IDs | 1 (only if ambiguous) |
| `GET /lol/match/v5/matches/{matchId}` | teamPosition per match | up to 10 (only if ambiguous) |

**Estimated total per refresh (10 friends, ~4 ambiguous):**
- Base: 10 × 3 = 30 calls
- Ambiguous: 4 × 11 = 44 calls
- **Total: ~74 calls** — within the 100/2min dev key limit

**Rate limiting:** The refresh script will respect limits by spacing calls with a small delay between players.

### Meraki Analytics `champions.json` (no key, bundled)
Maps each champion name to their primary and secondary roles. Downloaded once and committed to the repo. Updated manually if the meta shifts significantly.

---

## Caching Strategy (`data/cache.json`)

```json
{
  "lastUpdated": "2026-06-05T14:00:00Z",
  "players": [
    {
      "name": "SummonerOne",
      "summonerId": "...",
      "puuid": "...",
      "role": "jungle",
      "roleSource": "champions",
      "rank": {
        "tier": "GOLD",
        "division": "II",
        "lp": 45,
        "wins": 102,
        "losses": 88
      },
      "topChampions": [
        { "name": "Graves", "masteryLevel": 7, "masteryPoints": 148200 }
      ]
    }
  ]
}
```

`roleSource` can be `"manual"`, `"champions"`, or `"matches"` — shown as a small indicator in the UI so you know how confident the role assignment is.

---

## GitHub Actions Cron (`.github/workflows/refresh.yml`)

- **Schedule:** Every 4 hours (`0 */4 * * *`)
- **Steps:**
  1. Checkout repo
  2. Run `node scripts/refresh.js`
  3. If `data/cache.json` changed, commit and push
- **Secret:** `RIOT_API_KEY` stored in GitHub repo secrets (Settings → Secrets → Actions)

The script only commits if data changed, so the git history stays clean.

---

## Frontend

Single-page, no framework. Fetches `data/cache.json` on load.

**Layout:**
```
[ Last updated: 2 hours ago ]

TOP          JUNGLE        MID           BOT           SUPPORT
──────────   ──────────    ──────────    ──────────    ──────────
SummonerA    SummonerB     SummonerC     SummonerD     SummonerE
Gold II      Plat IV       Silver I      Gold III      Bronze II
45 LP        12 LP         88 LP         20 LP         5 LP
102W / 88L
```

Each card links to their OP.GG profile.  
Role source indicator (icon or tooltip) shows `manual` / `auto-detected`.

---

## Setup Steps (for you)

1. Create a GitHub repo, enable GitHub Pages (branch: `main`, folder: `/` or `/frontend`)
2. Add `RIOT_API_KEY` to repo secrets
3. Fill in `players.json` with your friends' summoner names and regions
4. Add top champion hints where you know them
5. Run `node scripts/refresh.js` locally once to populate `cache.json` and resolve PUUIDs
6. Push — Actions takes it from there

---

## Constraints & Limitations

- **API key** is a persistent personal/project key — no expiry, set it once in GitHub secrets
- **Match history API** (`/match/v5`) routes through regional clusters (`americas`, `europe`, `asia`, `sea`), not the platform endpoints — the script handles this mapping
- **Role detection is best-effort** — a player with a truly diverse champion pool may land in "flex" until you add a manual override
- No real-time data; freshness depends on cron cadence (default: 4 hours)
