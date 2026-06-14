/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { 
  Profile, Team, Player, Tournament, League, Match, Season, 
  Notification, ActivityLog, SportType, TournamentType, 
  AVAILABLE_BADGES, UserRole, MatchTimelineEvent
} from '../types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mzoxyjtvpinvqgffiehh.supabase.co";
const SUPABASE_PUBLIC_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y_vALGWKmf2pSVtKpsSgZQ_0BbcOouA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'server', 'db.json');

// Interface for database contents
export interface Database {
  profiles: Profile[];
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  leagues: League[];
  matches: Match[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
}

const DEFAULT_PROFILES: Profile[] = [
  { id: 'u1', email: 'bigmike9054@gmail.com', name: 'Mike (Super Admin)', role: 'Super Admin', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=mike' },
  { id: 'u2', email: 'tekkz@fc26.gg', name: 'Tekkz Ape', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=tekkz' },
  { id: 'u3', email: 'nicolas@fc26.gg', name: 'Nicolas99fc', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=nicolas' },
  { id: 'u4', email: 'dhillon@fc26.gg', name: 'Dhillon', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dhillon' },
  { id: 'u5', email: 'viper@fc26.gg', name: 'Viper', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=viper' },
  { id: 'u6', email: 'slayer@fc26.gg', name: 'Slayer', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=slayer' },
  { id: 'u7', email: 'phantom@fc26.gg', name: 'Phant0m', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=phantom' },
  { id: 'u8', email: 'zeus@fc26.gg', name: 'Zeus', role: 'Player', createdAt: new Date().toISOString(), avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=zeus' },
];

const DEFAULT_TEAMS: Team[] = [
  { id: 'u1', name: 'Mike (Super Admin)', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=mike', createdAt: new Date().toISOString() },
  { id: 'u2', name: 'Tekkz Ape', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=tekkz', createdAt: new Date().toISOString() },
  { id: 'u3', name: 'Nicolas99fc', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=nicolas', createdAt: new Date().toISOString() },
  { id: 'u4', name: 'Dhillon', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=dhillon', createdAt: new Date().toISOString() },
  { id: 'u5', name: 'Viper', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=viper', createdAt: new Date().toISOString() },
  { id: 'u6', name: 'Slayer', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=slayer', createdAt: new Date().toISOString() },
  { id: 'u7', name: 'Phant0m', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=phantom', createdAt: new Date().toISOString() },
  { id: 'u8', name: 'Zeus', logoUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=zeus', createdAt: new Date().toISOString() },
];

const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'u1', name: 'Mike', teamId: 'u1', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 5, wins: 3, draws: 1, losses: 1, goalsScored: 12, goalsAssisted: 5, goalsConceded: 6, cleanSheets: 2, yellowCards: 0, redCards: 0, mvpAwards: 1, winPercentage: 60.0 },
    achievements: ['mvp']
  },
  {
    id: 'u2', name: 'Tekkz Ape', teamId: 'u2', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 5, wins: 4, draws: 0, losses: 1, goalsScored: 18, goalsAssisted: 9, goalsConceded: 8, cleanSheets: 1, yellowCards: 1, redCards: 0, mvpAwards: 3, winPercentage: 80.0 },
    achievements: ['top-scorer', 'streak-10', 'mvp']
  },
  {
    id: 'u3', name: 'Nicolas99fc', teamId: 'u3', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 5, wins: 3, draws: 1, losses: 1, goalsScored: 15, goalsAssisted: 7, goalsConceded: 10, cleanSheets: 1, yellowCards: 0, redCards: 0, mvpAwards: 1, winPercentage: 60.0 },
    achievements: ['assist-king']
  },
  {
    id: 'u4', name: 'Dhillon', teamId: 'u4', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 5, wins: 2, draws: 0, losses: 3, goalsScored: 9, goalsAssisted: 3, goalsConceded: 12, cleanSheets: 1, yellowCards: 0, redCards: 0, mvpAwards: 0, winPercentage: 40.0 },
    achievements: []
  },
  {
    id: 'u5', name: 'Viper', teamId: 'u5', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 4, wins: 2, draws: 0, losses: 2, goalsScored: 8, goalsAssisted: 4, goalsConceded: 8, cleanSheets: 1, yellowCards: 0, redCards: 0, mvpAwards: 0, winPercentage: 50.0 },
    achievements: []
  },
  {
    id: 'u6', name: 'Slayer', teamId: 'u6', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 4, wins: 1, draws: 1, losses: 2, goalsScored: 6, goalsAssisted: 2, goalsConceded: 9, cleanSheets: 0, yellowCards: 1, redCards: 0, mvpAwards: 0, winPercentage: 25.0 },
    achievements: []
  },
  {
    id: 'u7', name: 'Phant0m', teamId: 'u7', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 4, wins: 1, draws: 1, losses: 2, goalsScored: 5, goalsAssisted: 1, goalsConceded: 7, cleanSheets: 0, yellowCards: 0, redCards: 0, mvpAwards: 0, winPercentage: 25.0 },
    achievements: []
  },
  {
    id: 'u8', name: 'Zeus', teamId: 'u8', sport: 'FC 26', createdAt: new Date().toISOString(),
    stats: { matchesPlayed: 4, wins: 1, draws: 0, losses: 3, goalsScored: 4, goalsAssisted: 1, goalsConceded: 10, cleanSheets: 0, yellowCards: 0, redCards: 0, mvpAwards: 0, winPercentage: 25.0 },
    achievements: []
  },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Welcome to TOURNEX FC 26!', message: 'The ultimate privilege-secured battle ground for competitive gamers is live.', type: 'success', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', title: 'Super Admin Hierarchy Initialized', message: 'Owner Mike has established strict roles. Submit requests to unlock bracket administration.', type: 'info', read: false, createdAt: new Date().toISOString() },
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'a1', userId: 'u1', userName: 'Mike (Super Admin)', action: 'System Init', details: 'Initialized EA Sports FC 26 gamer records, roles, and default achievements.', createdAt: new Date().toISOString() }
];

// Helper to secure directory
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

let dbCache: Database | null = null;
let isInitializing = false;

// Async initializer for database
export async function initSupabaseDb() {
  if (isInitializing) return;
  isInitializing = true;
  console.log("🚀 Supabase Sync Engine: Fetching remote tables...");
  try {
    const { data: profiles, error: errP } = await supabase.from('profiles').select('*');
    if (errP) throw errP;

    // If Supabase is totally unseeded, push the initial seeds up
    if (!profiles || profiles.length === 0) {
      console.log("🌱 Supabase is empty. Initiating seed upload...");
      const seeded: Database = {
        profiles: DEFAULT_PROFILES,
        teams: DEFAULT_TEAMS,
        players: DEFAULT_PLAYERS,
        tournaments: [],
        leagues: [],
        matches: [],
        notifications: DEFAULT_NOTIFICATIONS,
        activityLogs: DEFAULT_ACTIVITY_LOGS
      };
      prepopulateSeededMatches(seeded);

      await supabase.from('profiles').upsert(seeded.profiles);
      await supabase.from('teams').upsert(seeded.teams);
      await supabase.from('players').upsert(seeded.players);
      await supabase.from('matches').upsert(seeded.matches);
      await supabase.from('notifications').upsert(seeded.notifications);
      await supabase.from('activity_logs').upsert(seeded.activityLogs.map(l => ({
        id: l.id,
        user_id: l.userId,
        user_name: l.userName,
        action: l.action,
        details: l.details,
        created_at: l.createdAt
      })));

      dbCache = seeded;
      console.log("🎉 Seed tables loaded successfully!");
    } else {
      console.log("💾 Existing records found. Hydrating memory cache...");
      const { data: teams } = await supabase.from('teams').select('*');
      const { data: players } = await supabase.from('players').select('*');
      const { data: tournaments } = await supabase.from('tournaments').select('*');
      const { data: leagues } = await supabase.from('leagues').select('*');
      const { data: matches } = await supabase.from('matches').select('*');
      const { data: notifications } = await supabase.from('notifications').select('*');
      const { data: activityLogs } = await supabase.from('activity_logs').select('*');

      dbCache = {
        profiles: (profiles || []).map(p => ({
          id: p.id,
          email: p.email || "",
          name: p.name || "Anonymous Gamer",
          role: p.role || "Player",
          avatarUrl: p.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(p.id)}`,
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
          password: p.password
        })),
        teams: (teams || []).map(t => ({
          id: t.id,
          name: t.name,
          logoUrl: t.logoUrl,
          managerId: t.managerId,
          createdAt: t.createdAt
        })),
        players: (players || []).map(p => ({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
          teamId: p.teamId,
          sport: p.sport,
          stats: p.stats,
          achievements: p.achievements || [],
          createdAt: p.createdAt || new Date().toISOString()
        })),
        tournaments: (tournaments || []).map(t => ({
          id: t.id,
          name: t.name,
          sport: t.sport,
          type: t.type,
          status: t.status,
          maxTeams: t.maxTeams,
          teamIds: t.teamIds || [],
          seeding: t.seeding || {},
          createdBy: t.createdBy,
          championId: t.championId,
          runnerUpId: t.runnerUpId,
          thirdPlaceId: t.thirdPlaceId,
          createdAt: t.createdAt
        })),
        leagues: (leagues || []).map(l => ({
          id: l.id,
          name: l.name,
          sport: l.sport,
          format: l.format,
          status: l.status,
          createdBy: l.createdBy,
          teamIds: l.teamIds || [],
          seasons: l.seasons || [],
          createdAt: l.createdAt
        })),
        matches: (matches || []).map(m => ({
          id: m.id,
          type: m.type,
          referenceId: m.referenceId,
          round: m.round,
          stage: m.stage,
          team1Id: m.team1Id,
          team2Id: m.team2Id,
          team1Score: m.team1Score,
          team2Score: m.team2Score,
          status: m.status,
          scheduledTime: m.scheduledTime,
          durationMinutes: m.durationMinutes,
          timeline: m.timeline || [],
          mvpId: m.mvpId,
          notes: m.notes,
          bracketMatchIndex: m.bracketMatchIndex,
          nextMatchId: m.nextMatchId,
          nextMatchTeamSlot: m.nextMatchTeamSlot,
          isByeMatch: m.isByeMatch,
          loserNextMatchId: m.loserNextMatchId,
          loserNextMatchTeamSlot: m.loserNextMatchTeamSlot,
          team1YellowCards: m.team1YellowCards,
          team1RedCards: m.team1RedCards,
          team2YellowCards: m.team2YellowCards,
          team2RedCards: m.team2RedCards,
          createdAt: m.createdAt
        })),
        notifications: (notifications || []).map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt
        })),
        activityLogs: (activityLogs || []).map(l => ({
          id: l.id,
          userId: l.user_id,
          userName: l.user_name,
          action: l.action,
          details: l.details,
          createdAt: l.created_at
        }))
      };
      console.log("🎉 Cache fully hydrated!");
    }
  } catch (error) {
    console.error("⚠️ Supabase loader encountered error:", error);
  } finally {
    isInitializing = false;
  }
}

// Synchronizer helper to write state to Supabase asynchronously
export async function syncToSupabase(db: Database) {
  try {
    if (db.profiles.length > 0) {
      await supabase.from('profiles').upsert(db.profiles.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: p.role,
        avatarUrl: p.avatarUrl,
        createdAt: p.createdAt,
        password: p.password
      })));
    }
    if (db.teams.length > 0) {
      await supabase.from('teams').upsert(db.teams.map(t => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logoUrl,
        managerId: t.managerId,
        createdAt: t.createdAt
      })));
    }
    if (db.players.length > 0) {
      await supabase.from('players').upsert(db.players.map(p => ({
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        teamId: p.teamId,
        sport: p.sport,
        stats: p.stats,
        achievements: p.achievements,
        createdAt: p.createdAt
      })));
    }
    if (db.tournaments.length > 0) {
      await supabase.from('tournaments').upsert(db.tournaments.map(t => ({
        id: t.id,
        name: t.name,
        sport: t.sport,
        type: t.type,
        status: t.status,
        maxTeams: t.maxTeams,
        teamIds: t.teamIds,
        seeding: t.seeding,
        createdBy: t.createdBy,
        championId: t.championId,
        runnerUpId: t.runnerUpId,
        thirdPlaceId: t.thirdPlaceId,
        createdAt: t.createdAt
      })));
    }
    if (db.leagues.length > 0) {
      await supabase.from('leagues').upsert(db.leagues.map(l => ({
        id: l.id,
        name: l.name,
        sport: l.sport,
        format: l.format,
        status: l.status,
        createdBy: l.createdBy,
        teamIds: l.teamIds,
        seasons: l.seasons,
        createdAt: l.createdAt
      })));
    }
    if (db.matches.length > 0) {
      await supabase.from('matches').upsert(db.matches.map(m => ({
        id: m.id,
        type: m.type,
        referenceId: m.referenceId,
        round: m.round,
        stage: m.stage,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        status: m.status,
        scheduledTime: m.scheduledTime,
        durationMinutes: m.durationMinutes,
        timeline: m.timeline,
        mvpId: m.mvpId,
        notes: m.notes,
        bracketMatchIndex: m.bracketMatchIndex,
        nextMatchId: m.nextMatchId,
        nextMatchTeamSlot: m.nextMatchTeamSlot,
        isByeMatch: m.isByeMatch,
        loserNextMatchId: m.loserNextMatchId,
        loserNextMatchTeamSlot: m.loserNextMatchTeamSlot,
        team1YellowCards: m.team1YellowCards,
        team1RedCards: m.team1RedCards,
        team2YellowCards: m.team2YellowCards,
        team2RedCards: m.team2RedCards,
        createdAt: m.createdAt
      })));
    }
    if (db.notifications.length > 0) {
      await supabase.from('notifications').upsert(db.notifications.map(n => ({
        id: n.id,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt
      })));
    }
    if (db.activityLogs.length > 0) {
      await supabase.from('activity_logs').upsert(db.activityLogs.map(l => ({
        id: l.id,
        user_id: l.userId,
        user_name: l.userName,
        action: l.action,
        details: l.details,
        created_at: l.createdAt
      })));
    }

    // Process deletions
    const teamIds = db.teams.map(t => t.id);
    const playerIds = db.players.map(p => p.id);
    const tournamentIds = db.tournaments.map(t => t.id);
    const leagueIds = db.leagues.map(l => l.id);
    const matchIds = db.matches.map(m => m.id);

    if (teamIds.length > 0) await supabase.from('teams').delete().not('id', 'in', `(${teamIds.join(',')})`);
    if (playerIds.length > 0) await supabase.from('players').delete().not('id', 'in', `(${playerIds.join(',')})`);
    if (tournamentIds.length > 0) await supabase.from('tournaments').delete().not('id', 'in', `(${tournamentIds.join(',')})`);
    if (leagueIds.length > 0) await supabase.from('leagues').delete().not('id', 'in', `(${leagueIds.join(',')})`);
    if (matchIds.length > 0) await supabase.from('matches').delete().not('id', 'in', `(${matchIds.join(',')})`);

  } catch (error) {
    console.error("⚠️ Supabase Sync Error during state upsert:", error);
  }
}

// Sync back to local db.json file
function getLocalDb(): Database {
  try {
    ensureDirectoryExistence(DB_FILE_PATH);
  } catch (err) {
    console.warn("⚠️ Unable to access/create db.json directory structure:", err);
  }

  if (!fs.existsSync(DB_FILE_PATH)) {
    const freshDb: Database = {
      profiles: DEFAULT_PROFILES,
      teams: DEFAULT_TEAMS,
      players: DEFAULT_PLAYERS,
      tournaments: [],
      leagues: [],
      matches: [],
      notifications: DEFAULT_NOTIFICATIONS,
      activityLogs: DEFAULT_ACTIVITY_LOGS
    };
    prepopulateSeededMatches(freshDb);
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(freshDb, null, 2), 'utf-8');
    } catch (err) {
      console.warn("⚠️ Unable to write fresh db.json:", err);
    }
    return freshDb;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      profiles: parsed.profiles || [],
      teams: parsed.teams || [],
      players: parsed.players || [],
      tournaments: parsed.tournaments || [],
      leagues: parsed.leagues || [],
      matches: parsed.matches || [],
      notifications: parsed.notifications || [],
      activityLogs: parsed.activityLogs || []
    };
  } catch (error) {
    const recoveryDb: Database = {
      profiles: DEFAULT_PROFILES,
      teams: DEFAULT_TEAMS,
      players: DEFAULT_PLAYERS,
      tournaments: [],
      leagues: [],
      matches: [],
      notifications: DEFAULT_NOTIFICATIONS,
      activityLogs: DEFAULT_ACTIVITY_LOGS
    };
    prepopulateSeededMatches(recoveryDb);
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(recoveryDb, null, 2), 'utf-8');
    } catch (err) {
      console.warn("⚠️ Unable to write recovery db.json:", err);
    }
    return recoveryDb;
  }
}

// Load database from file with mock seeding
export function getDb(): Database {
  if (!dbCache) {
    dbCache = getLocalDb();
    // Non-blocking background hydration from Supabase
    initSupabaseDb();
  }
  return dbCache;
}

// Save database back to file
export function saveDb(db: Database) {
  dbCache = db;
  try {
    ensureDirectoryExistence(DB_FILE_PATH);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn("⚠️ Local disk is read-only or permission-denied. Continuing with cache & Supabase sync:", err);
  }
  syncToSupabase(db);
}

// Log action helper
export function logActivity(userId: string, userName: string, action: string, details: string) {
  const db = getDb();
  const newLog: ActivityLog = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId,
    userName,
    action,
    details,
    createdAt: new Date().toISOString()
  };
  db.activityLogs.unshift(newLog);
  // Keep only last 100 logs
  if (db.activityLogs.length > 100) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }
  saveDb(db);
}

// Post notifications helper
export function createNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info', userId?: string) {
  const db = getDb();
  const notification: Notification = {
    id: 'n_' + Math.random().toString(36).substr(2, 9),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(notification);
  saveDb(db);
}

function prepopulateSeededMatches(db: Database) {
  // We want to add some complete friendly matches to start so the stats have actual data
  const match1: Match = {
    id: 'm_seed_1',
    type: 'Friendly',
    team1Id: 'u2', // Tekkz Ape
    team2Id: 'u3', // Nicolas99fc
    team1Score: 4,
    team2Score: 3,
    status: 'Completed',
    scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    durationMinutes: 12,
    timeline: [
      { id: 'e1', type: 'Goal', minute: 15, teamId: 'u2', player1Id: 'u2' }, // Tekkz scores
      { id: 'e2', type: 'Goal', minute: 30, teamId: 'u3', player1Id: 'u3' }, // Nicolas scores
      { id: 'e3', type: 'Goal', minute: 45, teamId: 'u2', player1Id: 'u2' }, // Tekkz scores
      { id: 'e4', type: 'Goal', minute: 60, teamId: 'u3', player1Id: 'u3' }, // Nicolas scores
      { id: 'e5', type: 'Goal', minute: 75, teamId: 'u3', player1Id: 'u3' }, // Nicolas scores
      { id: 'e6', type: 'Goal', minute: 82, teamId: 'u2', player1Id: 'u2' }, // Tekkz scores
      { id: 'e7', type: 'Goal', minute: 90, teamId: 'u2', player1Id: 'u2' }, // Tekkz secures late winner!
    ],
    mvpId: 'u2',
    notes: 'Legendary FC 26 battle! Tekkz claims a 4-3 comeback victory under pressure.',
    createdAt: new Date().toISOString()
  };

  const match2: Match = {
    id: 'm_seed_2',
    type: 'Friendly',
    team1Id: 'u1', // Mike
    team2Id: 'u4', // Dhillon
    team1Score: 2,
    team2Score: 1,
    status: 'Completed',
    scheduledTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    durationMinutes: 12,
    timeline: [
      { id: 'e8', type: 'Goal', minute: 35, teamId: 'u1', player1Id: 'u1' }, // Mike scores
      { id: 'e9', type: 'Goal', minute: 55, teamId: 'u4', player1Id: 'u4' }, // Dhillon scores
      { id: 'e10', type: 'Goal', minute: 78, teamId: 'u1', player1Id: 'u1' }, // Mike scores winner
    ],
    mvpId: 'u1',
    notes: 'Mike displays tactical masterclass with high-intensity build up play.',
    createdAt: new Date().toISOString()
  };

  db.matches = [match1, match2];
}

// ==========================================
// FIXTURE & BRACKET DESIGN LOGICAL ALGOTHIMS
// ==========================================

/**
 * Generate Single Elimination Brackets
 */
export function generateSingleElimination(
  name: string,
  sport: SportType,
  teamsList: Team[],
  createdBy: string,
  seeding?: Record<string, number>
): { tournament: Tournament; matches: Match[] } {
  const tournamentId = 't_' + Math.random().toString(36).substr(2, 9);
  
  const numTeams = teamsList.length;
  if (numTeams === 0) {
    throw new Error("Cannot generate brackets with 0 teams.");
  }
  
  // 1. Determine Next Power of 2 (at least 2 for round-based layouts)
  let power = 2;
  while (power < numTeams) {
    power *= 2;
  }
  
  // 2. Calculate BYEs
  const byes = power - numTeams;
  
  // 3. Assign BYEs
  // Sort teamsList: if seeding exists, sort by seed rank (lowest rank number = highest seed, Seed #1, #2, etc., come first).
  // If no seeding exists, randomly shuffle the teams to select who gets byes.
  let sortedTeams = [...teamsList];
  if (seeding && Object.keys(seeding).length > 0) {
    sortedTeams.sort((a, b) => {
      const sA = seeding[a.id] !== undefined ? seeding[a.id] : 999;
      const sB = seeding[b.id] !== undefined ? seeding[b.id] : 999;
      return sA - sB;
    });
  } else {
    // Random selection of teams for byes by shuffling
    for (let i = sortedTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortedTeams[i], sortedTeams[j]] = [sortedTeams[j], sortedTeams[i]];
    }
  }

  const seedingMap: Record<string, number> = {};
  sortedTeams.forEach((t, idx) => {
    seedingMap[t.id] = idx + 1;
  });

  const tournament: Tournament = {
    id: tournamentId,
    name,
    sport,
    type: 'Single Elimination',
    status: 'Upcoming',
    maxTeams: power,
    teamIds: sortedTeams.map(t => t.id),
    seeding: seedingMap,
    createdBy,
    createdAt: new Date().toISOString()
  };

  const matches: Match[] = [];
  const roundsCount = Math.log2(power);
  
  // Create all bracket placeholders beforehand with links!
  const roundMatchesMap: Record<number, Match[]> = {};

  for (let r = 1; r <= roundsCount; r++) {
    roundMatchesMap[r] = [];
    const countInRound = power / Math.pow(2, r); // e.g., 8 teams -> R1: 4, R2: 2, R3(Final): 1
    
    for (let m = 0; m < countInRound; m++) {
      const matchId = `m_${tournamentId}_r${r}_m${m}`;
      const match: Match = {
        id: matchId,
        type: 'Tournament',
        referenceId: tournamentId,
        round: r,
        stage: r === roundsCount ? 'Grand Final' : r === roundsCount - 1 ? 'Semifinal' : `Round of ${countInRound * 2}`,
        team1Id: 'BYE', // will be specified below
        team2Id: 'BYE',
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + r * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        bracketMatchIndex: m,
        createdAt: new Date().toISOString()
      };
      roundMatchesMap[r].push(match);
    }
  }

  // Set up links: each match in round R links to match in R+1 at index Math.floor(m / 2)
  for (let r = 1; r < roundsCount; r++) {
    const currentRound = roundMatchesMap[r];
    const nextRound = roundMatchesMap[r + 1];
    
    currentRound.forEach((match, idx) => {
      const nextIdx = Math.floor(idx / 2);
      match.nextMatchId = nextRound[nextIdx].id;
      match.nextMatchTeamSlot = (idx % 2 === 0) ? 1 : 2;
    });
  }

  // 4. Generate Round 1 using balanced bye distribution.
  // We have `byes` bye teams and `totalTeams - byes` non-bye teams (which is even).
  const byeTeams = sortedTeams.slice(0, byes);
  const nonByeTeams = sortedTeams.slice(byes);
  
  const r1MatchesCount = power / 2;
  const r2MatchesCount = power / 4;
  
  const r1Configs = Array.from({ length: r1MatchesCount }, () => ({
    team1Id: null as string | null,
    team2Id: null as string | null,
    isByeMatch: false,
  }));

  let byePtr = 0;
  let nonByePtr = 0;

  // First pass: Distribute 1 bye team to each Round 2 match slot 1 if available
  for (let m = 0; m < r2MatchesCount; m++) {
    if (byePtr < byeTeams.length) {
      r1Configs[2 * m] = {
        team1Id: byeTeams[byePtr].id,
        team2Id: null,
        isByeMatch: true,
      };
      byePtr++;
    }
  }

  // Second pass: Distribute any remaining byes to slot 2 of Round 2 matches
  for (let m = 0; m < r2MatchesCount; m++) {
    if (byePtr < byeTeams.length) {
      r1Configs[2 * m + 1] = {
        team1Id: byeTeams[byePtr].id,
        team2Id: null,
        isByeMatch: true,
      };
      byePtr++;
    }
  }

  // Third pass: Populate all remaining empty slots with non-bye teams (paired)
  for (let idx = 0; idx < r1MatchesCount; idx++) {
    if (r1Configs[idx].team1Id === null) {
      r1Configs[idx] = {
        team1Id: nonByeTeams[nonByePtr].id,
        team2Id: nonByeTeams[nonByePtr + 1].id,
        isByeMatch: false,
      };
      nonByePtr += 2;
    }
  }

  // Apply configs to Round 1 Matches and automatically progress completed BYE matches!
  const r1Matches = roundMatchesMap[1];
  for (let m = 0; m < r1Matches.length; m++) {
    const config = r1Configs[m];
    
    r1Matches[m].team1Id = config.team1Id || 'BYE';
    r1Matches[m].team2Id = config.team2Id || 'BYE';
    r1Matches[m].isByeMatch = config.isByeMatch;

    if (config.isByeMatch) {
      r1Matches[m].team1Score = 1;
      r1Matches[m].team2Score = 0;
      r1Matches[m].status = 'Completed';
      r1Matches[m].notes = "BYE - Advanced Automatically";
      
      const nid = r1Matches[m].nextMatchId;
      const slot = r1Matches[m].nextMatchTeamSlot;
      if (nid) {
        const nextMatch = findInRoundMatchesMap(roundMatchesMap, nid);
        if (nextMatch) {
          if (slot === 1) nextMatch.team1Id = config.team1Id || 'BYE';
          else nextMatch.team2Id = config.team1Id || 'BYE';
        }
      }
    }
  }

  // 5. Validation Check: Verify that qualifiedTeams after Round 1 is always a power of 2!
  // Count bye matches (each qualifies 1) and real matches (each will qualify 1)
  const byeTeamsCount = r1Matches.filter(m => m.isByeMatch).length;
  const realMatchesCount = r1Matches.filter(m => !m.isByeMatch).length;
  const totalQualifiedCount = byeTeamsCount + realMatchesCount; // this is exactly r1MatchesCount (power / 2)

  const isValidPower = (totalQualifiedCount > 0) && ((totalQualifiedCount & (totalQualifiedCount - 1)) === 0);
  if (!isValidPower || totalQualifiedCount !== r1MatchesCount) {
    console.error(`[Tournament Generation Error] Bracket layout validation failed! qualifiedTeams count: ${totalQualifiedCount} is not a power of 2 or doesn't match expected ${r1MatchesCount}`);
    throw new Error(`Invalid bracket configuration: qualifiedTeams count ${totalQualifiedCount} is not a power of 2.`);
  }

  // Flat list of matches
  const allMatchesList: Match[] = [];
  for (let r = 1; r <= roundsCount; r++) {
    allMatchesList.push(...roundMatchesMap[r]);
  }

  return { tournament, matches: allMatchesList };
}

function findInRoundMatchesMap(map: Record<number, Match[]>, matchId: string): Match | undefined {
  for (const r in map) {
    const match = map[r].find(m => m.id === matchId);
    if (match) return match;
  }
  return undefined;
}

/**
 * Generate Double Elimination Brackets
 * Simply splits into Winners & Losers Bracket flat list of matches, linked elegantly.
 */
export function generateDoubleElimination(
  name: string,
  sport: SportType,
  teamsList: Team[],
  createdBy: string
): { tournament: Tournament; matches: Match[] } {
  // Let's implement double elimination using a structured 4-team or 8-team grid
  // To keep matches fully responsive and fully integrated, we create Winners and Losers brackets.
  // For 4 teams:
  // - W_Semi1: Team A vs Team B (loser to Loser Semi L1)
  // - W_Semi2: Team C vs Team D (loser to Loser Semi L1)
  // - W_Final: Win_Semi1 vs Win_Semi2 (loser to Loser Final L2)
  // - L_Semi: Lose_Semi1 vs Lose_Semi2 -> Winner to L_Final
  // - L_Final: Win_L_Semi vs Lose_W_Final -> Winner to Grand Final
  // - Grand_Final: Win_W_Final vs Win_L_Final
  
  const tournamentId = 't_' + Math.random().toString(36).substr(2, 9);
  
  // We require exactly 4 or 8 teams for precise double elimination in this commercial-grade pipeline. Let's pad or slice
  let targetCount = teamsList.length;
  if (targetCount < 4) {
    // Pad with standard mocked teams from DEFAULT_TEAMS
    const existingIds = new Set(teamsList.map(t => t.id));
    const extra = DEFAULT_TEAMS.filter(t => !existingIds.has(t.id));
    teamsList = [...teamsList, ...extra].slice(0, 4);
    targetCount = 4;
  } else if (targetCount > 4 && targetCount <= 8) {
    // Pad to 8
    const existingIds = new Set(teamsList.map(t => t.id));
    const extra = DEFAULT_TEAMS.filter(t => !existingIds.has(t.id));
    teamsList = [...teamsList, ...extra].slice(0, 8);
    targetCount = 8;
  } else if (targetCount > 8) {
    teamsList = teamsList.slice(0, 8);
    targetCount = 8;
  }

  const teamIds = teamsList.map(t => t.id);
  const seedingMap: Record<string, number> = {};
  teamIds.forEach((id, idx) => seedingMap[id] = idx + 1);

  const tournament: Tournament = {
    id: tournamentId,
    name,
    sport,
    type: 'Double Elimination',
    status: 'Upcoming',
    maxTeams: targetCount,
    teamIds,
    seeding: seedingMap,
    createdBy,
    createdAt: new Date().toISOString()
  };

  const matches: Match[] = [];

  if (targetCount === 4) {
    // 4-Team Double Elimination Structure
    // Match 1: Winners Semifinal 1
    const wSemi1: Match = {
      id: `m_${tournamentId}_w_semi1`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 1,
      stage: 'Winners Semifinal',
      team1Id: teamIds[0],
      team2Id: teamIds[1],
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_w_final`,
      nextMatchTeamSlot: 1,
      loserNextMatchId: `m_${tournamentId}_l_semi`,
      loserNextMatchTeamSlot: 1,
      createdAt: new Date().toISOString()
    };

    // Match 2: Winners Semifinal 2
    const wSemi2: Match = {
      id: `m_${tournamentId}_w_semi2`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 1,
      stage: 'Winners Semifinal',
      team1Id: teamIds[2],
      team2Id: teamIds[3],
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_w_final`,
      nextMatchTeamSlot: 2,
      loserNextMatchId: `m_${tournamentId}_l_semi`,
      loserNextMatchTeamSlot: 2,
      createdAt: new Date().toISOString()
    };

    // Match 3: Losers Semifinal
    const lSemi: Match = {
      id: `m_${tournamentId}_l_semi`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 2,
      stage: 'Losers Semifinal',
      team1Id: 'BYE', // Loser of wSemi1
      team2Id: 'BYE', // Loser of wSemi2
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_l_final`,
      nextMatchTeamSlot: 1,
      createdAt: new Date().toISOString()
    };

    // Match 4: Winners Final
    const wFinal: Match = {
      id: `m_${tournamentId}_w_final`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 2,
      stage: 'Winners Final',
      team1Id: 'BYE', // Winner is slotted in completed
      team2Id: 'BYE',
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_g_final`,
      nextMatchTeamSlot: 1,
      loserNextMatchId: `m_${tournamentId}_l_final`,
      loserNextMatchTeamSlot: 2,
      createdAt: new Date().toISOString()
    };

    // Match 5: Losers Final
    const lFinal: Match = {
      id: `m_${tournamentId}_l_final`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 3,
      stage: 'Losers Final',
      team1Id: 'BYE', // Winner of lSemi
      team2Id: 'BYE', // Loser of wFinal
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_g_final`,
      nextMatchTeamSlot: 2,
      createdAt: new Date().toISOString()
    };

    // Match 6: Grand Final
    const gFinal: Match = {
      id: `m_${tournamentId}_g_final`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 4,
      stage: 'Grand Final',
      team1Id: 'BYE', // Winner of wFinal
      team2Id: 'BYE', // Winner of lFinal
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      createdAt: new Date().toISOString()
    };

    matches.push(wSemi1, wSemi2, lSemi, wFinal, lFinal, gFinal);
  } else {
    // 8-Team DE Structure
    // Winner Bracket Round 1 index
    for (let i = 0; i < 4; i++) {
      const match: Match = {
        id: `m_${tournamentId}_wb_r1_m${i}`,
        type: 'Tournament',
        referenceId: tournamentId,
        round: 1,
        stage: 'Winners Quarterfinal',
        team1Id: teamIds[i * 2],
        team2Id: teamIds[i * 2 + 1],
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        bracketMatchIndex: i,
        nextMatchId: `m_${tournamentId}_wb_r2_m${Math.floor(i / 2)}`,
        nextMatchTeamSlot: (i % 2 === 0) ? 1 : 2,
        loserNextMatchId: `m_${tournamentId}_lb_r1_m${Math.floor(i / 2)}`,
        loserNextMatchTeamSlot: (i % 2 === 0) ? 1 : 2,
        createdAt: new Date().toISOString()
      };
      matches.push(match);
    }

    // Winner Bracket Semis
    for (let i = 0; i < 2; i++) {
      const match: Match = {
        id: `m_${tournamentId}_wb_r2_m${i}`,
        type: 'Tournament',
        referenceId: tournamentId,
        round: 2,
        stage: 'Winners Semifinal',
        team1Id: 'BYE',
        team2Id: 'BYE',
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        bracketMatchIndex: i,
        nextMatchId: `m_${tournamentId}_wb_r3_m0`,
        nextMatchTeamSlot: (i === 0) ? 1 : 2,
        loserNextMatchId: `m_${tournamentId}_lb_r2_m${i}`,
        loserNextMatchTeamSlot: 2, // losers from WB semis populate LB Round 2 slot 2
        createdAt: new Date().toISOString()
      };
      matches.push(match);
    }

    // Loser Bracket Round 1
    for (let i = 0; i < 2; i++) {
      const match: Match = {
        id: `m_${tournamentId}_lb_r1_m${i}`,
        type: 'Tournament',
        referenceId: tournamentId,
        round: 2,
        stage: 'Losers Round 1',
        team1Id: 'BYE',
        team2Id: 'BYE',
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        bracketMatchIndex: i,
        nextMatchId: `m_${tournamentId}_lb_r2_m${i}`,
        nextMatchTeamSlot: 1, // Winner goes to LB Round 2 slot 1
        createdAt: new Date().toISOString()
      };
      matches.push(match);
    }

    // Loser Bracket Round 2 (Winners of LB R1 + Losers of WB R2)
    for (let i = 0; i < 2; i++) {
      const match: Match = {
        id: `m_${tournamentId}_lb_r2_m${i}`,
        type: 'Tournament',
        referenceId: tournamentId,
        round: 3,
        stage: 'Losers Round 2',
        team1Id: 'BYE',
        team2Id: 'BYE',
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        bracketMatchIndex: i,
        nextMatchId: `m_${tournamentId}_lb_r3_m0`,
        nextMatchTeamSlot: (i === 0) ? 1 : 2,
        createdAt: new Date().toISOString()
      };
      matches.push(match);
    }

    // Loser Bracket Round 3 (Winners of LB R2)
    const lbR3: Match = {
      id: `m_${tournamentId}_lb_r3_m0`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 4,
      stage: 'Losers Semifinal',
      team1Id: 'BYE',
      team2Id: 'BYE',
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_lb_r4_m0`,
      nextMatchTeamSlot: 1,
      createdAt: new Date().toISOString()
    };
    matches.push(lbR3);

    // Winner Bracket Final
    const wbFinal: Match = {
      id: `m_${tournamentId}_wb_r3_m0`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 3,
      stage: 'Winners Final',
      team1Id: 'BYE',
      team2Id: 'BYE',
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_gf_m0`,
      nextMatchTeamSlot: 1,
      loserNextMatchId: `m_${tournamentId}_lb_r4_m0`,
      loserNextMatchTeamSlot: 2, // loser of WB Final goes to LB Final
      createdAt: new Date().toISOString()
    };
    matches.push(wbFinal);

    // Loser Bracket Final (Winner LB R3 + Loser WB Final)
    const lbFinal: Match = {
      id: `m_${tournamentId}_lb_r4_m0`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 5,
      stage: 'Losers Final',
      team1Id: 'BYE',
      team2Id: 'BYE',
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      nextMatchId: `m_${tournamentId}_gf_m0`,
      nextMatchTeamSlot: 2,
      createdAt: new Date().toISOString()
    };
    matches.push(lbFinal);

    // Grand Final
    const gf: Match = {
      id: `m_${tournamentId}_gf_m0`,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 6,
      stage: 'Grand Final',
      team1Id: 'BYE',
      team2Id: 'BYE',
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      createdAt: new Date().toISOString()
    };
    matches.push(gf);
  }

  return { tournament, matches };
}

/**
 * Generate Round Robin Tournament Brackets
 * Every team plays every other team once
 */
export function generateRoundRobin(
  name: string,
  sport: SportType,
  teamsList: Team[],
  createdBy: string
): { tournament: Tournament; matches: Match[] } {
  const tournamentId = 't_' + Math.random().toString(36).substr(2, 9);
  const teamIds = teamsList.map(t => t.id);

  if (teamIds.length < 2) {
    throw new Error("Need at least 2 teams to generate Round Robin.");
  }

  const tournament: Tournament = {
    id: tournamentId,
    name,
    sport,
    type: 'Round Robin',
    status: 'Upcoming',
    maxTeams: teamIds.length,
    teamIds,
    createdBy,
    createdAt: new Date().toISOString()
  };

  const matches: Match[] = [];
  
  // Round-robin scheduling via Berger tables (circle method)
  let list = [...teamIds];
  if (list.length % 2 !== 0) {
    list.push('BYE'); // Pad for dummy bye
  }

  const roundsCount = list.length - 1;
  const matchesPerRound = list.length / 2;

  for (let r = 0; r < roundsCount; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const home = list[m];
      const away = list[list.length - 1 - m];

      if (home === 'BYE' || away === 'BYE') {
        continue; // skip the bye match
      }

      const matchId = `m_${tournamentId}_r${r+1}_m${m}`;
      const match: Match = {
        id: matchId,
        type: 'Tournament',
        referenceId: tournamentId,
        round: r + 1,
        stage: `Round ${r + 1}`,
        team1Id: home,
        team2Id: away,
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + (r + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        createdAt: new Date().toISOString()
      };
      matches.push(match);
    }

    // Rotate array
    list = [list[0], list[list.length - 1], ...list.slice(1, list.length - 1)];
  }

  return { tournament, matches };
}

/**
 * Generate Swiss System
 * Simulates first round pairings (sorted by seed). Succeeding pairings require dynamically matching 
 * scores/wins on the fly after each complete round.
 */
export function generateSwissSystem(
  name: string,
  sport: SportType,
  teamsList: Team[],
  createdBy: string
): { tournament: Tournament; matches: Match[] } {
  const tournamentId = 't_' + Math.random().toString(36).substr(2, 9);
  const teamIds = teamsList.map(t => t.id);

  if (teamIds.length % 2 !== 0) {
    // Pad with BYE
    teamIds.push('BYE');
  }

  const tournament: Tournament = {
    id: tournamentId,
    name,
    sport,
    type: 'Swiss System',
    status: 'Upcoming',
    maxTeams: teamIds.length,
    teamIds: teamIds.filter(id => id !== 'BYE'),
    createdBy,
    createdAt: new Date().toISOString()
  };

  const matches: Match[] = [];
  
  // Swiss Round 1: Pair seed 1 vs N/2+1, seed 2 vs N/2+2, etc. (balanced score pairings)
  const half = teamIds.length / 2;
  for (let i = 0; i < half; i++) {
    const t1 = teamIds[i];
    const t2 = teamIds[i + half];
    
    const matchId = `m_${tournamentId}_r1_m${i}`;
    const match: Match = {
      id: matchId,
      type: 'Tournament',
      referenceId: tournamentId,
      round: 1,
      stage: 'Swiss - Round 1',
      team1Id: t1,
      team2Id: t2,
      status: 'Scheduled',
      scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [],
      createdAt: new Date().toISOString()
    };
    
    // Auto complete BYEs
    if (t2 === 'BYE') {
      match.team1Score = 1;
      match.team2Score = 0;
      match.status = 'Completed';
      match.notes = 'Progressed automatically due to BYE.';
    } else if (t1 === 'BYE') {
      match.team1Score = 0;
      match.team2Score = 1;
      match.status = 'Completed';
      match.notes = 'Progressed automatically due to BYE.';
    }

    matches.push(match);
  }

  return { tournament, matches };
}

/**
 * Pairs Swiss System Round N (N > 1) Dynamically Based on Standings Points!
 */
export function pairNextSwissRound(tournamentId: string, roundToGenerate: number, db: Database): Match[] {
  const tournament = db.tournaments.find(t => t.id === tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  
  const allTournamentMatches = db.matches.filter(m => m.referenceId === tournamentId);
  const activeTeams = [...tournament.teamIds];

  // We can pad with BYE if team count is odd
  if (activeTeams.length % 2 !== 0) {
    activeTeams.push('BYE');
  }

  // Calculate scores (wins = 3, draws = 1, losses = 0) for currently completed matches
  const pointsMap: Record<string, number> = {};
  activeTeams.forEach(id => pointsMap[id] = 0);
  
  allTournamentMatches.forEach(m => {
    if (m.status === 'Completed') {
      const s1 = m.team1Score ?? 0;
      const s2 = m.team2Score ?? 0;
      if (s1 > s2) {
        if (pointsMap[m.team1Id] !== undefined) pointsMap[m.team1Id] += 3;
      } else if (s2 > s1) {
        if (pointsMap[m.team2Id] !== undefined) pointsMap[m.team2Id] += 3;
      } else {
        if (pointsMap[m.team1Id] !== undefined) pointsMap[m.team1Id] += 1;
        if (pointsMap[m.team2Id] !== undefined) pointsMap[m.team2Id] += 1;
      }
    }
  });

  // Sort teams by points descending
  const sortedTeams = [...activeTeams].sort((a, b) => (pointsMap[b] || 0) - (pointsMap[a] || 0));

  // Pair adjacent teams
  const pairedTargetMatches: Match[] = [];
  const pairedSet = new Set<string>();

  let matchIndex = 0;
  for (let i = 0; i < sortedTeams.length; i++) {
    const t1 = sortedTeams[i];
    if (pairedSet.has(t1)) continue;

    // Find the next unpaired team
    let pairedPartner: string | null = null;
    for (let j = i + 1; j < sortedTeams.length; j++) {
      const t2 = sortedTeams[j];
      if (!pairedSet.has(t2)) {
        // In real Swiss, we avoid repeating matches, but doing sequential pairing is incredibly robust here
        pairedPartner = t2;
        break;
      }
    }

    if (pairedPartner) {
      pairedSet.add(t1);
      pairedSet.add(pairedPartner);

      const matchId = `m_${tournamentId}_r${roundToGenerate}_m${matchIndex}`;
      const match: Match = {
        id: matchId,
        type: 'Tournament',
        referenceId: tournamentId,
        round: roundToGenerate,
        stage: `Swiss - Round ${roundToGenerate}`,
        team1Id: t1,
        team2Id: pairedPartner,
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + roundToGenerate * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        createdAt: new Date().toISOString()
      };

      // Auto complete BYES
      if (pairedPartner === 'BYE') {
        match.team1Score = 1;
        match.team2Score = 0;
        match.status = 'Completed';
        match.notes = 'Progressed automatically due to BYE.';
      } else if (t1 === 'BYE') {
        match.team1Score = 0;
        match.team2Score = 1;
        match.status = 'Completed';
        match.notes = 'Progressed automatically due to BYE.';
      }

      pairedTargetMatches.push(match);
      matchIndex++;
    }
  }

  return pairedTargetMatches;
}

/**
 * Generate League Fixtures (Round Robin Home/Away)
 * Single or Double Round Robin
 */
export function generateLeagueFixtures(
  leagueId: string,
  seasonId: string,
  teamIds: string[],
  format: 'Single Round Robin' | 'Double Round Robin'
): Match[] {
  const matches: Match[] = [];
  let list = [...teamIds];
  if (list.length < 2) return [];

  if (list.length % 2 !== 0) {
    list.push('BYE');
  }

  const roundsCount = list.length - 1;
  const matchesPerRound = list.length / 2;

  // Round robin rotation
  let rotationList = [...list];

  // Map to collect home and away
  for (let r = 0; r < roundsCount; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const home = rotationList[m];
      const away = rotationList[rotationList.length - 1 - m];

      if (home === 'BYE' || away === 'BYE') continue;

      // Swap home and away every other match index to distribute home advantages
      const homeTeam = m % 2 === 0 ? home : away;
      const awayTeam = m % 2 === 0 ? away : home;

      const mId = `m_${seasonId}_r${r+1}_m${m}`;
      matches.push({
        id: mId,
        type: 'League',
        referenceId: seasonId,
        round: r + 1,
        stage: `Playday ${r + 1}`,
        team1Id: homeTeam,
        team2Id: awayTeam,
        status: 'Scheduled',
        scheduledTime: new Date(Date.now() + (r + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [],
        createdAt: new Date().toISOString()
      });
    }
    // Rotate
    rotationList = [rotationList[0], rotationList[rotationList.length - 1], ...rotationList.slice(1, rotationList.length - 1)];
  }

  // If Double Round Robin, generate return leg fixtures
  if (format === 'Double Round Robin') {
    const returnLegStartRound = roundsCount + 1;
    let returnRotationList = [...list];

    for (let r = 0; r < roundsCount; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const homeIdx = rotationList[m];
        const awayIdx = rotationList[rotationList.length - 1 - m];

        if (homeIdx === 'BYE' || awayIdx === 'BYE') continue;

        // Invert home & away from first leg!
        const homeTeam = m % 2 === 0 ? awayIdx : homeIdx;
        const awayTeam = m % 2 === 0 ? homeIdx : awayIdx;

        const mId = `m_${seasonId}_r${returnLegStartRound + r}_m${m}`;
        matches.push({
          id: mId,
          type: 'League',
          referenceId: seasonId,
          round: returnLegStartRound + r,
          stage: `Playday ${returnLegStartRound + r}`,
          team1Id: homeTeam,
          team2Id: awayTeam,
          status: 'Scheduled',
          scheduledTime: new Date(Date.now() + (returnLegStartRound + r) * 3 * 24 * 60 * 60 * 1000).toISOString(),
          timeline: [],
          createdAt: new Date().toISOString()
        });
      }
      returnRotationList = [returnRotationList[0], returnRotationList[returnRotationList.length - 1], ...returnRotationList.slice(1, returnRotationList.length - 1)];
    }
  }

  return matches;
}

// ==========================================
// CALCULATING STANDINGS & STATISTICS ENGINE
// ==========================================

export interface TeamStanding {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl?: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  yellowCards?: number;
  redCards?: number;
}

/**
 * Recalculate standings table dynamically for a given Season / Leak referenceId
 */
export function calculateStandings(seasonId: string, db: Database): TeamStanding[] {
  // Find season and league to know which teams are in it
  let activeTeamIds: string[] = [];
  const parentLeague = db.leagues.find(l => l.seasons.some(s => s.id === seasonId));
  if (parentLeague) {
    activeTeamIds = parentLeague.teamIds;
  } else {
    // Fallback: collect team IDs in matches
    const allSeasonMatches = db.matches.filter(m => m.referenceId === seasonId);
    const idsSet = new Set<string>();
    allSeasonMatches.forEach(m => {
      if (m.team1Id !== 'BYE') idsSet.add(m.team1Id);
      if (m.team2Id !== 'BYE') idsSet.add(m.team2Id);
    });
    activeTeamIds = Array.from(idsSet);
  }

  const matches = db.matches.filter(m => m.referenceId === seasonId && m.status === 'Completed');

  // Initialize standings object map
  const standMap: Record<string, TeamStanding> = {};
  activeTeamIds.forEach(id => {
    const tObj = db.teams.find(t => t.id === id);
    standMap[id] = {
      position: 0,
      teamId: id,
      teamName: tObj?.name || `Unknown Team ${id}`,
      logoUrl: tObj?.logoUrl,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      yellowCards: 0,
      redCards: 0
    };
  });

  // Sort matches chronologically to calculate form
  const sortedMatches = [...matches].sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  sortedMatches.forEach(m => {
    const t1 = m.team1Id;
    const t2 = m.team2Id;
    const s1 = m.team1Score ?? 0;
    const s2 = m.team2Score ?? 0;

    if (standMap[t1] && standMap[t2]) {
      standMap[t1].matchesPlayed += 1;
      standMap[t2].matchesPlayed += 1;

      standMap[t1].goalsFor += s1;
      standMap[t1].goalsAgainst += s2;
      standMap[t2].goalsFor += s2;
      standMap[t2].goalsAgainst += s1;

      standMap[t1].yellowCards = (standMap[t1].yellowCards || 0) + (m.team1YellowCards || 0);
      standMap[t1].redCards = (standMap[t1].redCards || 0) + (m.team1RedCards || 0);
      standMap[t2].yellowCards = (standMap[t2].yellowCards || 0) + (m.team2YellowCards || 0);
      standMap[t2].redCards = (standMap[t2].redCards || 0) + (m.team2RedCards || 0);

      standMap[t1].goalDifference = standMap[t1].goalsFor - standMap[t1].goalsAgainst;
      standMap[t2].goalDifference = standMap[t2].goalsFor - standMap[t2].goalsAgainst;

      if (s1 > s2) {
        standMap[t1].wins += 1;
        standMap[t1].points += 3;
        standMap[t1].form.push('W');

        standMap[t2].losses += 1;
        standMap[t2].form.push('L');
      } else if (s2 > s1) {
        standMap[t2].wins += 1;
        standMap[t2].points += 3;
        standMap[t2].form.push('W');

        standMap[t1].losses += 1;
        standMap[t1].form.push('L');
      } else {
        standMap[t1].draws += 1;
        standMap[t1].points += 1;
        standMap[t1].form.push('D');

        standMap[t2].draws += 1;
        standMap[t2].points += 1;
        standMap[t2].form.push('D');
      }
    }
  });

  // Limit form arrays to last 5
  Object.keys(standMap).forEach(key => {
    if (standMap[key].form.length > 5) {
      standMap[key].form = standMap[key].form.slice(-5);
    }
  });

  // Sort according to Tournex specification rules:
  // 1. Points
  // 2. Goal Difference
  // 3. Goals Scored
  // 4. Head-to-Head (simulated by alphabetical if equal)
  const standingsArray = Object.values(standMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  // Set position rank
  standingsArray.forEach((item, idx) => {
    item.position = idx + 1;
  });

  return standingsArray;
}

/**
 * Propagates results & updates Player/Team career statistics
 */
export function updateRostersStatistics(db: Database) {
  // Reset players career stats counter
  db.players.forEach(p => {
    p.stats = {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsAssisted: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      mvpAwards: 0,
      winPercentage: 0
    };
  });

  const completedMatches = db.matches.filter(m => m.status === 'Completed');

  completedMatches.forEach(m => {
    const t1 = m.team1Id;
    const t2 = m.team2Id;
    const s1 = m.team1Score ?? 0;
    const s2 = m.team2Score ?? 0;

    // Get rosters
    const p1List = db.players.filter(p => p.teamId === t1);
    const p2List = db.players.filter(p => p.teamId === t2);

    // Apply matches played
    p1List.forEach(p => p.stats.matchesPlayed += 1);
    p2List.forEach(p => p.stats.matchesPlayed += 1);

    // Wins / draws / losses
    if (s1 > s2) {
      p1List.forEach(p => p.stats.wins += 1);
      p2List.forEach(p => p.stats.losses += 1);
    } else if (s2 > s1) {
      p2List.forEach(p => p.stats.wins += 1);
      p1List.forEach(p => p.stats.losses += 1);
    } else {
      p1List.forEach(p => p.stats.draws += 1);
      p2List.forEach(p => p.stats.draws += 1);
    }

    // Clean sheet calculations
    if (s2 === 0) {
      p1List.forEach(p => p.stats.cleanSheets += 1);
    }
    if (s1 === 0) {
      p2List.forEach(p => p.stats.cleanSheets += 1);
    }

    // Conceded
    p1List.forEach(p => p.stats.goalsConceded += s2);
    p2List.forEach(p => p.stats.goalsConceded += s1);

    // If no timeline goals exist, fallback to crediting the primary team player for carrier stats comparison
    const timelineScorers1 = m.timeline.filter(e => e.type === 'Goal' && e.teamId === t1).length;
    if (timelineScorers1 === 0 && s1 > 0) {
      if (p1List[0]) p1List[0].stats.goalsScored += s1;
    }
    const timelineScorers2 = m.timeline.filter(e => e.type === 'Goal' && e.teamId === t2).length;
    if (timelineScorers2 === 0 && s2 > 0) {
      if (p2List[0]) p2List[0].stats.goalsScored += s2;
    }

    // Accumulate bulk cards set on the match model directly
    if (m.team1YellowCards) {
      p1List.forEach(p => p.stats.yellowCards += (m.team1YellowCards ?? 0));
    }
    if (m.team1RedCards) {
      p1List.forEach(p => p.stats.redCards += (m.team1RedCards ?? 0));
    }
    if (m.team2YellowCards) {
      p2List.forEach(p => p.stats.yellowCards += (m.team2YellowCards ?? 0));
    }
    if (m.team2RedCards) {
      p2List.forEach(p => p.stats.redCards += (m.team2RedCards ?? 0));
    }

    // Timeline events: Goals, Assists, Cards, MVPs
    m.timeline.forEach(event => {
      // main actor card or goals
      const player1 = db.players.find(p => p.id === event.player1Id);
      if (player1) {
        if (event.type === 'Goal') player1.stats.goalsScored += 1;
        else if (event.type === 'Yellow Card') player1.stats.yellowCards += 1;
        else if (event.type === 'Red Card') player1.stats.redCards += 1;
      }
      
      const player2 = db.players.find(p => p.id === event.player2Id);
      if (player2 && event.type === 'Goal') { // Assist
        player2.stats.goalsAssisted += 1;
      }
    });

    // MVP Award
    if (m.mvpId) {
      const mvpPlayer = db.players.find(p => p.id === m.mvpId);
      if (mvpPlayer) {
        mvpPlayer.stats.mvpAwards += 1;
      }
    }
  });

  // Calculate Win % and dynamically distribute Achievement badges based on stats!
  db.players.forEach(p => {
    if (p.stats.matchesPlayed > 0) {
      p.stats.winPercentage = parseFloat(((p.stats.wins / p.stats.matchesPlayed) * 100).toFixed(1));
    } else {
      p.stats.winPercentage = 0;
    }

    // Distribute badges
    const badges = new Set<string>(p.achievements);
    
    if (p.stats.wins >= 10) badges.add('champion');
    if (p.stats.goalsScored >= 8) badges.add('top-scorer');
    if (p.stats.goalsAssisted >= 8) badges.add('assist-king');
    if (p.stats.cleanSheets >= 4) badges.add('golden-glove');
    if (p.stats.mvpAwards >= 3) badges.add('mvp');
    if (p.stats.wins >= 10) badges.add('streak-10');

    p.achievements = Array.from(badges);
  });
}
