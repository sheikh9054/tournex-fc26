/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 
  | 'Super Admin' 
  | 'League Admin' 
  | 'Tournament Admin' 
  | 'Team Manager' 
  | 'Player' 
  | 'Public Viewer';

export type SportType = 
  | 'FC 26' 
  | 'FIFA' 
  | 'eFootball' 
  | 'BGMI' 
  | 'Cricket' 
  | 'Football' 
  | 'Chess' 
  | 'Custom';

export type TournamentType = 
  | 'Single Elimination' 
  | 'Double Elimination' 
  | 'Round Robin' 
  | 'Swiss System';

export type TournamentStatus = 
  | 'Draft' 
  | 'Upcoming' 
  | 'Ongoing' 
  | 'Completed';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  password?: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  managerId?: string;
  createdAt: string;
  // Stats aggregated or memoized
  stats?: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
}

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  teamId?: string;
  sport: SportType;
  createdAt: string;
  
  // Player statistics
  stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsAssisted: number;
    goalsConceded: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    mvpAwards: number;
    winPercentage: number;
  };
  achievements: string[]; // Badge keys e.g. "champion", "top-scorer"
}

export interface Season {
  id: string;
  leagueId: string;
  name: string; // e.g. "Premier League Season 1"
  status: 'Draft' | 'Active' | 'Completed';
  championId?: string;
  topScorerId?: string;
  mostAssistsId?: string;
  bestDefenseTeamId?: string;
  mvpId?: string;
  createdAt: string;
}

export interface League {
  id: string;
  name: string;
  sport: SportType;
  format: 'Single Round Robin' | 'Double Round Robin';
  status: 'Draft' | 'Active' | 'Completed';
  createdBy: string;
  teamIds: string[];
  createdAt: string;
  seasons: Season[];
}

export interface Tournament {
  id: string;
  name: string;
  sport: SportType;
  type: TournamentType;
  status: TournamentStatus;
  maxTeams: number;
  teamIds: string[]; // Participated teams / players
  seeding?: Record<string, number>; // Team ID -> Seed position
  createdBy: string;
  championId?: string;
  runnerUpId?: string;
  thirdPlaceId?: string;
  createdAt: string;
}

export interface MatchTimelineEvent {
  id: string;
  type: 'Goal' | 'Own Goal' | 'Assist' | 'Yellow Card' | 'Red Card' | 'Substitution' | 'MVP';
  minute: number;
  teamId?: string;
  player1Id: string; // Main actor e.g. scorer, carded player, player out
  player2Id?: string; // Secondary actor e.g. assist provider, player in
}

export interface Match {
  id: string;
  type: 'Tournament' | 'League' | 'Friendly';
  referenceId?: string; // league season ID or tournament ID
  round?: number; // bracket round, or Swiss round, or League playday
  stage?: string; // 'Winners Bracket', 'Losers Bracket', 'Quarter', 'Semi', 'Final', etc.
  
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  
  status: 'Scheduled' | 'Live' | 'Completed';
  scheduledTime: string;
  durationMinutes?: number;
  
  timeline: MatchTimelineEvent[];
  mvpId?: string;
  notes?: string;
  
  // For Tournaments: bracket position
  bracketMatchIndex?: number; // within round
  nextMatchId?: string; // pointer to the next match
  nextMatchTeamSlot?: 1 | 2; // is winner team 1 or team 2 in next match?
  isByeMatch?: boolean;
  
  // For double elimination support
  loserNextMatchId?: string;
  loserNextMatchTeamSlot?: 1 | 2;
  
  team1YellowCards?: number;
  team1RedCards?: number;
  team2YellowCards?: number;
  team2RedCards?: number;
  
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string; // empty means public alert
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind color class
}

export const AVAILABLE_BADGES: Record<string, AchievementBadge> = {
  'champion': {
    id: 'champion',
    title: 'Champion',
    description: 'Winner of a competitive tournament',
    icon: 'Trophy',
    color: 'from-amber-400 to-yellow-600 text-amber-100'
  },
  'league-winner': {
    id: 'league-winner',
    title: 'League Winner',
    description: 'First place finisher in a tournament season league',
    icon: 'Crown',
    color: 'from-blue-400 to-indigo-600 text-blue-100'
  },
  'top-scorer': {
    id: 'top-scorer',
    title: 'Top Scorer',
    description: 'Most goals scored in a single league or tournament',
    icon: 'Flame',
    color: 'from-orange-400 to-red-600 text-orange-100'
  },
  'assist-king': {
    id: 'assist-king',
    title: 'Assist King',
    description: 'Most plays made in a single league or tournament',
    icon: 'Compass',
    color: 'from-emerald-400 to-teal-600 text-emerald-100'
  },
  'golden-glove': {
    id: 'golden-glove',
    title: 'Golden Glove',
    description: 'Most clean sheets recorded as a goalkeeper',
    icon: 'Shield',
    color: 'from-purple-400 to-fuchsia-600 text-purple-100'
  },
  'streak-10': {
    id: 'streak-10',
    title: '10-Match Fire',
    description: 'Achieved a spectacular 10-match win streak',
    icon: 'Zap',
    color: 'from-rose-400 to-orange-500 text-rose-100'
  },
  'mvp': {
    id: 'mvp',
    title: 'MVP',
    description: 'Most Valuable Player award winner',
    icon: 'Award',
    color: 'from-cyan-400 to-blue-500 text-cyan-100'
  }
};
