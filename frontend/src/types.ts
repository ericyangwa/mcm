export interface Rank {
  tier: string;
  division: number;
  lp: number;
  wins: number;
  losses: number;
}

export interface Champion {
  name: string;
  play: number;
  win: number;
}

export type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support' | 'flex';

export interface Game {
  id: string;
  createdAt: string;
  opScore: number | null;
  result: 'WIN' | 'LOSE' | null;
  position: Role | null;
  champion: string | null;
}

export interface RoleScore {
  avgOpScore: number;
  games: number;
}

export interface Player {
  gameName: string;
  tagLine: string;
  region: string;
  rank: Rank | null;
  profileUpdatedAt: string | null;
  recentGames: Game[];
  topChampions: Champion[];
}

export interface Cache {
  lastUpdated: string;
  players: Player[];
}
