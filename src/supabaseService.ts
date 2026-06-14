import { supabase } from './supabaseClient';
import { 
  Profile, Team, Player, Tournament, League, Match, 
  Notification, ActivityLog, Season
} from './types';

// =======================================================
// SUPABASE CLIENT-SIDE DATA CRUD SERVICE
// =======================================================

/**
 * 1. LOADING ALL USER & SYSTEM DATA
 * Fetches all records from Supabase tables to populate state
 */
export async function loadUserData() {
  try {
    const [
      { data: profiles, error: errProfiles },
      { data: teams, error: errTeams },
      { data: players, error: errPlayers },
      { data: tournaments, error: errTournaments },
      { data: leagues, error: errLeagues },
      { data: matches, error: errMatches },
      { data: notifications, error: errNotifications },
      { data: activityLogs, error: errActivityLogs }
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('createdAt', { ascending: false }),
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('players').select('*'),
      supabase.from('tournaments').select('*').order('createdAt', { ascending: false }),
      supabase.from('leagues').select('*').order('createdAt', { ascending: false }),
      supabase.from('matches').select('*').order('scheduledTime', { ascending: true }),
      supabase.from('notifications').select('*').order('createdAt', { ascending: false }),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false })
    ]);

    if (errProfiles) throw errProfiles;
    if (errTeams) throw errTeams;
    if (errPlayers) throw errPlayers;
    if (errTournaments) throw errTournaments;
    if (errLeagues) throw errLeagues;
    if (errMatches) throw errMatches;
    if (errNotifications) throw errNotifications;
    if (errActivityLogs) throw errActivityLogs;

    return {
      profiles: (profiles || []) as Profile[],
      teams: (teams || []).map(t => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logoUrl,
        managerId: t.managerId,
        createdAt: t.createdAt
      })) as Team[],
      players: (players || []).map(p => ({
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        teamId: p.teamId,
        sport: p.sport,
        stats: p.stats,
        achievements: p.achievements || [],
        createdAt: p.createdAt
      })) as Player[],
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
      })) as Tournament[],
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
      })) as League[],
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
      })) as Match[],
      notifications: (notifications || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt
      })) as Notification[],
      activityLogs: (activityLogs || []).map(l => ({
        id: l.id,
        userId: l.user_id,
        userName: l.user_name,
        action: l.action,
        details: l.details,
        createdAt: l.created_at
      })) as ActivityLog[]
    };
  } catch (error) {
    console.error("❌ loadUserData Supabase query failed:", error);
    throw error;
  }
}

// =======================================================
// 2. CREATING NEW ITEMS (INSERT)
// =======================================================

export async function createProfile(profile: Profile) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select();
  if (error) throw error;
  return data;
}

export async function createTeam(team: Team) {
  const { data, error } = await supabase
    .from('teams')
    .insert([{
      id: team.id,
      name: team.name,
      logoUrl: team.logoUrl,
      managerId: team.managerId,
      createdAt: team.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createPlayer(player: Player) {
  const { data, error } = await supabase
    .from('players')
    .insert([{
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl,
      teamId: player.teamId,
      sport: player.sport,
      stats: player.stats,
      achievements: player.achievements,
      createdAt: player.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createTournament(tournament: Tournament) {
  const { data, error } = await supabase
    .from('tournaments')
    .insert([{
      id: tournament.id,
      name: tournament.name,
      sport: tournament.sport,
      type: tournament.type,
      status: tournament.status,
      maxTeams: tournament.maxTeams,
      teamIds: tournament.teamIds,
      seeding: tournament.seeding,
      createdBy: tournament.createdBy,
      championId: tournament.championId,
      runnerUpId: tournament.runnerUpId,
      thirdPlaceId: tournament.thirdPlaceId,
      createdAt: tournament.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createLeague(league: League) {
  const { data, error } = await supabase
    .from('leagues')
    .insert([{
      id: league.id,
      name: league.name,
      sport: league.sport,
      format: league.format,
      status: league.status,
      createdBy: league.createdBy,
      teamIds: league.teamIds,
      seasons: league.seasons,
      createdAt: league.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createMatch(match: Match) {
  const { data, error } = await supabase
    .from('matches')
    .insert([{
      id: match.id,
      type: match.type,
      referenceId: match.referenceId,
      round: match.round,
      stage: match.stage,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      status: match.status,
      scheduledTime: match.scheduledTime,
      durationMinutes: match.durationMinutes,
      timeline: match.timeline,
      mvpId: match.mvpId,
      notes: match.notes,
      bracketMatchIndex: match.bracketMatchIndex,
      nextMatchId: match.nextMatchId,
      nextMatchTeamSlot: match.nextMatchTeamSlot,
      isByeMatch: match.isByeMatch,
      loserNextMatchId: match.loserNextMatchId,
      loserNextMatchTeamSlot: match.loserNextMatchTeamSlot,
      team1YellowCards: match.team1YellowCards,
      team1RedCards: match.team1RedCards,
      team2YellowCards: match.team2YellowCards,
      team2RedCards: match.team2RedCards,
      createdAt: match.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createNotification(n: Notification) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      id: n.id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

export async function createActivityLog(l: ActivityLog) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{
      id: l.id,
      user_id: l.userId,
      user_name: l.userName,
      action: l.action,
      details: l.details,
      created_at: l.createdAt
    }])
    .select();
  if (error) throw error;
  return data;
}

// =======================================================
// 3. UPDATING ITEMS (UPDATE)
// =======================================================

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updateTeam(id: string, updates: Partial<Team>) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updatePlayer(id: string, updates: Partial<Player>) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updateTournament(id: string, updates: Partial<Tournament>) {
  const { data, error } = await supabase
    .from('tournaments')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updateLeague(id: string, updates: Partial<League>) {
  const { data, error } = await supabase
    .from('leagues')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updateMatch(id: string, updates: Partial<Match>) {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function updateNotification(id: string, updates: Partial<Notification>) {
  // Translate fields if necessary
  const mappedUpdates: any = { ...updates };
  if (updates.userId !== undefined) {
    mappedUpdates.user_id = updates.userId;
    delete mappedUpdates.userId;
  }
  const { data, error } = await supabase
    .from('notifications')
    .update(mappedUpdates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

// =======================================================
// 4. DELETING ITEMS (DELETE)
// =======================================================

export async function deleteProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string) {
  const { data, error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deletePlayer(id: string) {
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteTournament(id: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteLeague(id: string) {
  const { data, error } = await supabase
    .from('leagues')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteMatch(id: string) {
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteNotification(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}
