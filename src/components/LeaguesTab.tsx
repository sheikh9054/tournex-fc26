/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, TeamStanding } from '../server/db';
import { League, Season, UserRole, Match } from '../types';
import { 
  Trophy, Sparkles, FolderPlus, Compass, AlertCircle, Plus, Trash2, 
  ChevronRight, Calendar, ArrowUpRight, TrendingUp, HelpCircle,
  Download, FileSpreadsheet, FileJson
} from 'lucide-react';

interface LeaguesTabProps {
  db: Database;
  currentUserRole: UserRole;
  onRefresh: () => void;
}

export default function LeaguesTab({ db, currentUserRole, onRefresh }: LeaguesTabProps) {
  const leagues = db.leagues || [];
  const teams = db.teams || [];
  const matches = db.matches || [];

  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(
    leagues.length > 0 ? leagues[0].id : ''
  );

  const activeLeague = leagues.find(l => l.id === selectedLeagueId);
  const activeSeason = activeLeague && activeLeague.seasons.length > 0
    ? activeLeague.seasons[activeLeague.seasons.length - 1] // last/active season
    : null;

  // New League Form state
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueSport, setLeagueSport] = useState('Football');
  const [leagueFormat, setLeagueFormat] = useState<'Single Round Robin' | 'Double Round Robin'>('Single Round Robin');
  const [leagueTeams, setLeagueTeams] = useState<string[]>([]);

  // New Season Form state
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonName, setSeasonName] = useState('');

  // AI Summary state
  const [aiAnalysis, setAiAnalysis] = useState<{ overview: string; forecast: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // --- Inline Match Scorecard Edit State ---
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editT1Score, setEditT1Score] = useState('0');
  const [editT2Score, setEditT2Score] = useState('0');
  const [editT1Yellow, setEditT1Yellow] = useState('0');
  const [editT1Red, setEditT1Red] = useState('0');
  const [editT2Yellow, setEditT2Yellow] = useState('0');
  const [editT2Red, setEditT2Red] = useState('0');
  const [savingMatch, setSavingMatch] = useState(false);

  const canManage = currentUserRole === 'Super Admin' || currentUserRole === 'League Admin';
  const canReport = currentUserRole !== 'Public Viewer';

  // New Team Form state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [registeringTeam, setRegisteringTeam] = useState(false);

  // Export dropdown state and exporter utilities
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const exportLeagueJson = () => {
    if (!activeLeague) return;
    const data = {
      league: {
        id: activeLeague.id,
        name: activeLeague.name,
        sport: activeLeague.sport,
        format: activeLeague.format,
        activeSeason: activeSeason ? activeSeason.name : 'None',
      },
      standings: standings.map(s => ({
        position: s.position,
        team: s.teamName,
        played: s.matchesPlayed,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
        yellowCards: s.yellowCards || 0,
        redCards: s.redCards || 0,
        form: s.form
      })),
      fixtures: leagueSeasonMatches.map(m => {
        const t1Obj = teams.find(t => t.id === m.team1Id);
        const t2Obj = teams.find(t => t.id === m.team2Id);
        return {
          matchId: m.id,
          playday: m.round || 1,
          team1: t1Obj?.name || m.team1Id,
          team2: t2Obj?.name || m.team2Id,
          team1Score: m.team1Score !== undefined ? m.team1Score : null,
          team2Score: m.team2Score !== undefined ? m.team2Score : null,
          team1YellowCards: m.team1YellowCards || 0,
          team1RedCards: m.team1RedCards || 0,
          team2YellowCards: m.team2YellowCards || 0,
          team2RedCards: m.team2RedCards || 0,
          status: m.status
        };
      })
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLeague.name.replace(/\s+/g, '_')}_standings.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const exportLeagueCsv = () => {
    if (!activeLeague) return;
    
    let csvContent = "\ufeff=== CHAMPIONSHIP STANDINGS ===\n";
    csvContent += "Position,TeamName,MatchesPlayed,Wins,Draws,Losses,GoalsFor,GoalsAgainst,GoalDifference,Points,YellowCards,RedCards,RecentForm\n";
    
    standings.forEach(s => {
      csvContent += `${s.position},"${s.teamName}",${s.matchesPlayed},${s.wins},${s.draws},${s.losses},${s.goalsFor},${s.goalsAgainst},${s.goalDifference},${s.points},${s.yellowCards || 0},${s.redCards || 0},"${s.form.join('-')}"\n`;
    });
    
    csvContent += "\n=== SEASON FIXTURES & RESULTS ===\n";
    csvContent += "Playday,Team 1,Team 2,Team 1 Score,Team 2 Score,Team 1 Yellows,Team 1 Reds,Team 2 Yellows,Team 2 Reds,Status\n";
    
    leagueSeasonMatches.forEach(m => {
      const t1Obj = teams.find(t => t.id === m.team1Id);
      const t2Obj = teams.find(t => t.id === m.team2Id);
      const t1Name = t1Obj?.name || m.team1Id || '';
      const t2Name = t2Obj?.name || m.team2Id || '';
      const score1 = m.team1Score !== undefined ? m.team1Score : '';
      const score2 = m.team2Score !== undefined ? m.team2Score : '';
      csvContent += `${m.round || 1},"${t1Name}","${t2Name}",${score1},${score2},${m.team1YellowCards || 0},${m.team1RedCards || 0},${m.team2YellowCards || 0},${m.team2RedCards || 0},"${m.status}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLeague.name.replace(/\s+/g, '_')}_standings_and_fixtures.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      alert("Please provide a team identity name!");
      return;
    }
    setRegisteringTeam(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTeamName, 
          logoUrl: newTeamLogo.trim() || undefined 
        })
      });
      if (res.ok) {
        setNewTeamName('');
        setNewTeamLogo('');
        setShowAddTeamModal(false);
        onRefresh();
      } else {
         const errorData = await res.json();
         alert(errorData.error || 'Failed to register team.');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering team.');
    } finally {
      setRegisteringTeam(false);
    }
  };

  const handleSaveMatchScore = async (matchId: string) => {
    setSavingMatch(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Score: parseInt(editT1Score) || 0,
          team2Score: parseInt(editT2Score) || 0,
          team1YellowCards: parseInt(editT1Yellow) || 0,
          team1RedCards: parseInt(editT1Red) || 0,
          team2YellowCards: parseInt(editT2Yellow) || 0,
          team2RedCards: parseInt(editT2Red) || 0,
          status: 'Completed'
        })
      });
      if (res.ok) {
        setEditingMatchId(null);
        onRefresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to store score.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating match details.');
    } finally {
      setSavingMatch(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName || leagueTeams.length < 2) {
      alert("Provide a custom name and include at least 2 teams!");
      return;
    }

    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leagueName,
          sport: leagueSport,
          format: leagueFormat,
          teamIds: leagueTeams
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowLeagueModal(false);
        setLeagueName('');
        setLeagueTeams([]);
        onRefresh();
        if (data.league) {
          setSelectedLeagueId(data.league.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeague) return;

    try {
      const res = await fetch(`/api/leagues/${activeLeague.id}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonName })
      });
      const data = await res.json();
      if (data.success) {
        setShowSeasonModal(false);
        setSeasonName('');
        setAiAnalysis(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLeague = async (id: string) => {
    if (!confirm("Are you sure you want to delete this league, seasons, and fixtures?")) return;
    try {
      const res = await fetch(`/api/leagues/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSelectedLeagueId('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAiLeagueSummary = async (sId: string) => {
    setLoadingAi(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/ai/summarize-league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId: sId })
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Calculate standings on the fly using our db function!
  let standings: TeamStanding[] = [];
  let leagueSeasonMatches: Match[] = [];

  if (activeSeason) {
    // Collect standings list
    // Sum matches
    leagueSeasonMatches = matches.filter(m => m.referenceId === activeSeason.id);
    
    // We can run the same standing calculation algorithm client-side!
    // Since we import the types, let's execute the client side standings calculation code so we render instantly
    const standMap: Record<string, TeamStanding> = {};
    activeLeague?.teamIds.forEach(id => {
      const tObj = teams.find(t => t.id === id);
      standMap[id] = {
        position: 0,
        teamId: id,
        teamName: tObj?.name || `Team`,
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

    const completedMatches = leagueSeasonMatches.filter(m => m.status === 'Completed');
    
    // Sort completed chronological
    const sortedCompleted = [...completedMatches].sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    sortedCompleted.forEach(m => {
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

    standings = Object.values(standMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });

    standings.forEach((s, idx) => {
      s.position = idx + 1;
    });
  }

  // Group playdays
  const playdays: Record<number, Match[]> = {};
  leagueSeasonMatches.forEach(m => {
    const playdayValue = m.round || 1;
    if (!playdays[playdayValue]) playdays[playdayValue] = [];
    playdays[playdayValue].push(m);
  });

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            League Standings
          </h2>
          <p className="text-xs text-zinc-400 font-normal">Manage championship tables, view schedules, and query AI prediction models.</p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {leagues.length > 0 && (
            <select
              id="select-league-dropdown"
              value={selectedLeagueId}
              onChange={(e) => {
                setSelectedLeagueId(e.target.value);
                setAiAnalysis(null);
              }}
              className="bg-zinc-900 border border-white/10 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500/50"
            >
              {leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.sport})</option>
              ))}
            </select>
          )}

          {canManage && (
            <button
              id="btn-create-league-trigger"
              onClick={() => setShowLeagueModal(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              Create League
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Team
            </button>
          )}

          {canManage && activeLeague && (
            <button
              onClick={() => handleDeleteLeague(activeLeague.id)}
              className="border border-red-500/20 bg-red-500/10 text-red-400 p-2 rounded-xl hover:bg-red-500/20 transition cursor-pointer"
              title="Delete League"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeLeague ? (
        <div className="space-y-6">
          
          {/* Active Season Information Header */}
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                {activeLeague.name}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                  {activeLeague.format}
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Discipline: <span className="text-zinc-300 font-medium">{activeLeague.sport}</span> • Registered Teams: <span className="text-zinc-300 font-medium">{activeLeague.teamIds.length}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSeason ? (
                <>
                  <span className="text-xs font-semibold text-zinc-400">Active Season: {activeSeason.name}</span>
                  <button
                    id="btn-trigger-league-forecast"
                    onClick={() => getAiLeagueSummary(activeSeason.id)}
                    className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition flex items-center gap-1 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Standings Analysis
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <button
                      id="btn-export-league"
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-350 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold tracking-wide text-[10.5px] uppercase cursor-pointer transition select-none text-zinc-300"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Export
                    </button>
                    {showExportDropdown && (
                      <div id="league-export-dropdown" className="absolute right-0 mt-2 w-44 bg-[#121214] border border-[#27272a] rounded-xl p-1.5 shadow-2xl z-50 space-y-1 animate-fade-in text-left">
                        <button
                          onClick={exportLeagueCsv}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg text-left transition cursor-pointer font-medium"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          Download CSV (.csv)
                        </button>
                        <button
                          onClick={exportLeagueJson}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg text-left transition cursor-pointer font-medium"
                        >
                          <FileJson className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          Download JSON (.json)
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 italic">No seasons active currently.</span>
                  {canManage && (
                    <button
                      id="btn-create-season-trigger"
                      onClick={() => setShowSeasonModal(true)}
                      className="bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-500 transition cursor-pointer"
                    >
                      Initialize Season 1
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Analytics analysis display box */}
          {aiAnalysis && (
            <div id="ai-league-toast" className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini AI League performance analysis
                </span>
                <button onClick={() => setAiAnalysis(null)} className="text-zinc-500 hover:text-white text-xs">Close</button>
              </div>
              {loadingAi ? (
                <p className="text-xs text-zinc-400 animate-pulse">Running Monte Carlo simulation trends...</p>
              ) : (
                <div className="space-y-1 text-xs text-zinc-300">
                  <p className="leading-relaxed"><strong>Overview:</strong> {aiAnalysis.overview}</p>
                  <p className="leading-relaxed text-indigo-300 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <strong>Forecast Run:</strong> {aiAnalysis.forecast}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSeason ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Standings List (2x Columns) */}
              <div className="lg:col-span-2 border border-white/5 bg-white/[0.01] rounded-2xl p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">Championship Table</h4>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Win = 3pts, Draw = 1pt, Loss = 0pt</span>
                </div>

                <table id="league-standings-table" className="w-full text-left text-xs text-zinc-300 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 font-medium font-mono">
                      <th className="py-2.5 w-10 text-center">Pos</th>
                      <th className="py-2.5">Club / Team Roster</th>
                      <th className="py-2.5 text-center">PL</th>
                      <th className="py-2.5 text-center">W</th>
                      <th className="py-2.5 text-center">D</th>
                      <th className="py-2.5 text-center">L</th>
                      <th className="py-2.5 text-center">GF</th>
                      <th className="py-2.5 text-center text-yellow-500">🟨</th>
                      <th className="py-2.5 text-center text-red-550 text-red-500">🟥</th>
                      <th className="py-2.5 text-center">GD</th>
                      <th className="py-2.5 text-center font-bold text-white">Pts</th>
                      <th className="py-2.5 w-32 text-center">Recent Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, index) => {
                      const isLeader = index === 0;
                      return (
                        <tr 
                          key={row.teamId} 
                          id={`standing-row-pos-${row.position}`}
                          className={`border-b border-white/[0.02] hover:bg-white/[0.01] transition-all duration-150 ${isLeader ? 'bg-indigo-500/[0.02]' : ''}`}
                        >
                          <td className="py-3 text-center">
                            {isLeader ? (
                              <span className="inline-flex items-center justify-center p-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 text-[10px] rounded-full h-5 w-5">
                                1
                              </span>
                            ) : (
                              <span className="font-mono text-zinc-400">{row.position}</span>
                            )}
                          </td>
                          <td className="py-3 font-medium text-white">
                            <div className="flex items-center gap-2">
                              {row.logoUrl && (
                                <img src={row.logoUrl} className="w-4.5 h-4.5 rounded object-cover" referrerPolicy="no-referrer" />
                              )}
                              <span>{row.teamName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center font-mono text-zinc-400">{row.matchesPlayed}</td>
                          <td className="py-3 text-center font-mono text-zinc-400">{row.wins}</td>
                          <td className="py-3 text-center font-mono text-zinc-400">{row.draws}</td>
                          <td className="py-3 text-center font-mono text-zinc-400">{row.losses}</td>
                          <td className="py-3 text-center font-mono text-zinc-400">{row.goalsFor}</td>
                          <td className="py-3 text-center font-mono text-yellow-500 font-bold">{row.yellowCards || 0}</td>
                          <td className="py-3 text-center font-mono text-red-500 font-bold">{row.redCards || 0}</td>
                          <td className="py-3 text-center font-mono font-medium text-zinc-300">
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="py-3 text-center font-bold text-indigo-400 font-mono text-sm">{row.points}</td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1 select-none">
                              {row.form.map((f, fIdx) => (
                                <span 
                                  key={fIdx} 
                                  className={`inline-block text-[9px] font-mono font-extrabold w-4 h-4 rounded text-center leading-4 ${
                                    f === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
                                    f === 'D' ? 'bg-slate-500/20 text-slate-400' : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {f}
                                </span>
                              ))}
                              {row.form.length === 0 && <span className="text-zinc-600 text-[10px] italic">No games</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Matchweeks / Fixtures list sidebar */}
              <div className="space-y-4">
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      Season Schedule
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {leagueSeasonMatches.length} Fixtures
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {Object.keys(playdays).map((pdKey) => {
                      const pd = Number(pdKey);
                      const pdMatches = playdays[pd];
                      return (
                        <div key={pd} className="space-y-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 border-b border-white/5 pb-1 block">
                            Playday {pd}
                          </span>
                          
                          <div className="space-y-1.5 text-[11px]">
                            {pdMatches.map((m) => {
                              const t1 = teams.find(t=>t.id === m.team1Id);
                              const t2 = teams.find(t=>t.id === m.team2Id);
                              const isCompleted = m.status === 'Completed';
                              const isEditing = editingMatchId === m.id;

                              if (isEditing) {
                                return (
                                  <div key={m.id} className="p-3 border border-indigo-500/30 rounded-xl bg-zinc-950/80 space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Record Match Card</span>
                                      <button 
                                        type="button" 
                                        onClick={() => setEditingMatchId(null)}
                                        className="text-[10px] text-zinc-500 hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    
                                    {/* Team 1 Score & Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                      <span className="text-xs font-semibold text-white truncate">{t1?.name}</span>
                                      <div className="col-span-2 flex items-center gap-2">
                                        <div className="flex-1">
                                          <label className="block text-[8px] uppercase tracking-wider text-zinc-500 font-mono mb-0.5">Goals</label>
                                          <input 
                                            type="number" 
                                            value={editT1Score} 
                                            onChange={(e) => setEditT1Score(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-white animate-none" 
                                          />
                                        </div>
                                        <div className="w-12">
                                          <label className="block text-[8px] uppercase tracking-wider text-zinc-500 font-mono mb-0.5">🟨 Cards</label>
                                          <input 
                                            type="number" 
                                            value={editT1Yellow} 
                                            onChange={(e) => setEditT1Yellow(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-[#fbbf24] animate-none" 
                                          />
                                        </div>
                                        <div className="w-12">
                                          <label className="block text-[8px] uppercase tracking-wider text-zinc-500 font-mono mb-0.5">🟥 Cards</label>
                                          <input 
                                            type="number" 
                                            value={editT1Red} 
                                            onChange={(e) => setEditT1Red(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-[#ef4444] animate-none" 
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Team 2 Score & Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center pt-1">
                                      <span className="text-xs font-semibold text-white truncate">{t2?.name}</span>
                                      <div className="col-span-2 flex items-center gap-2">
                                        <div className="flex-1">
                                          <input 
                                            type="number" 
                                            value={editT2Score} 
                                            onChange={(e) => setEditT2Score(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-white animate-none" 
                                          />
                                        </div>
                                        <div className="w-12">
                                          <input 
                                            type="number" 
                                            value={editT2Yellow} 
                                            onChange={(e) => setEditT2Yellow(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-[#fbbf24] animate-none" 
                                          />
                                        </div>
                                        <div className="w-12">
                                          <input 
                                            type="number" 
                                            value={editT2Red} 
                                            onChange={(e) => setEditT2Red(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-center font-bold font-mono text-[#ef4444] animate-none" 
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={savingMatch}
                                      onClick={() => handleSaveMatchScore(m.id)}
                                      className="w-full mt-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer"
                                    >
                                      {savingMatch ? 'Saving...' : 'Confirm Match Result'}
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div key={m.id} className="p-2.5 border border-white/5 rounded-lg bg-zinc-950/20 flex justify-between items-center gap-3 hover:border-white/10 transition-all group">
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between text-zinc-300">
                                      <span className="truncate font-medium">{t1?.name}</span>
                                      {isCompleted && (m.team1YellowCards || m.team1RedCards) ? (
                                        <span className="text-[9px] font-mono opacity-80 flex items-center gap-1 shrink-0 ml-2">
                                          {m.team1YellowCards ? <span className="bg-[#fbbf24]/20 text-[#fbbf24] px-1 rounded-sm font-extrabold">🟨 {m.team1YellowCards}</span> : null}
                                          {m.team1RedCards ? <span className="bg-[#ef4444]/20 text-[#ef4444] px-1 rounded-sm font-extrabold">🟥 {m.team1RedCards}</span> : null}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-300">
                                      <span className="truncate font-medium">{t2?.name}</span>
                                      {isCompleted && (m.team2YellowCards || m.team2RedCards) ? (
                                        <span className="text-[9px] font-mono opacity-80 flex items-center gap-1 shrink-0 ml-2">
                                          {m.team2YellowCards ? <span className="bg-[#fbbf24]/20 text-[#fbbf24] px-1 rounded-sm font-extrabold">🟨 {m.team2YellowCards}</span> : null}
                                          {m.team2RedCards ? <span className="bg-[#ef4444]/20 text-[#ef4444] px-1 rounded-sm font-extrabold">🟥 {m.team2RedCards}</span> : null}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 flex items-center gap-2">
                                    {isCompleted ? (
                                      <div className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 text-center">
                                        {m.team1Score} - {m.team2Score}
                                      </div>
                                    ) : (
                                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 bg-white/5 px-1.5 py-1 rounded font-mono">Scheduled</span>
                                    )}
                                    {canReport && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMatchId(m.id);
                                          setEditT1Score(String(m.team1Score ?? 0));
                                          setEditT2Score(String(m.team2Score ?? 0));
                                          setEditT1Yellow(String(m.team1YellowCards ?? 0));
                                          setEditT1Red(String(m.team1RedCards ?? 0));
                                          setEditT2Yellow(String(m.team2YellowCards ?? 0));
                                          setEditT2Red(String(m.team2RedCards ?? 0));
                                        }}
                                        className="opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2 py-1 rounded border border-white/10 text-[9px] uppercase font-bold transition-all cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Calendar className="w-12 h-12 text-zinc-500 opacity-30 animate-pulse" />
              <h3 className="text-base font-semibold text-white">Season 1 is currently not active</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Initial rosters are bound, but no competitive fixture templates have been paired. Initialize your seasonal Round Robin grid to begin leagues.
              </p>
              {canManage && (
                <button
                  onClick={() => setShowSeasonModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Activate League Fixtures
                </button>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Trophy className="w-12 h-12 text-zinc-500 opacity-20" />
          <h3 className="text-base font-semibold text-white">No active leagues setup</h3>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            There are no running league tables or playoff divisions created currently. Tap below to define a custom sporting division!
          </p>
          {canManage && (
            <button
              onClick={() => setShowLeagueModal(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
            >
              Configure First League
            </button>
          )}
        </div>
      )}

      {/* NEW LEAGUE MODAL */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              Form League Championship
            </h3>

            <form onSubmit={handleCreateLeague} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Championship Name</label>
                <input
                  type="text"
                  placeholder="e.g. Premier League, FIFA Champions"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Associated Sport</label>
                  <select
                    value={leagueSport}
                    onChange={(e) => setLeagueSport(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                  >
                    <option value="Football">Football</option>
                    <option value="FIFA">FIFA</option>
                    <option value="FC 26">FC 26</option>
                    <option value="Chess">Chess</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Format</label>
                  <select
                    value={leagueFormat}
                    onChange={(e) => setLeagueFormat(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                  >
                    <option value="Single Round Robin">Single Round Robin</option>
                    <option value="Double Round Robin">Double Round Robin</option>
                  </select>
                </div>
              </div>

              {/* Roster selection list */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Include Teams ({leagueTeams.length} selected)</label>
                <div className="bg-zinc-950 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 hover:bg-zinc-900 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leagueTeams.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLeagueTeams([...leagueTeams, t.id]);
                          } else {
                            setLeagueTeams(leagueTeams.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded accent-indigo-500"
                      />
                      <span className="text-zinc-300">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeagueModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-xl"
                >
                  Confirm League setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SEASON MODAL */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-indigo-400" />
              Configure Season Fixtures
            </h3>

            <form onSubmit={handleCreateSeason} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Season Title</label>
                <input
                  type="text"
                  placeholder="e.g. Season 2026 / Cup 1"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeasonModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-xl"
                >
                  Activate & Pair Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW TEAM MODAL */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-indigo-400" />
              Register Virtual Club
            </h3>

            <form onSubmit={handleRegisterTeam} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Club Name</label>
                <input
                  type="text"
                  placeholder="e.g. Manchester Red, Real Madrid"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Emblem / Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newTeamLogo}
                  onChange={(e) => setNewTeamLogo(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-indigo-500 font-mono text-[10px]"
                />
                <p className="text-[9px] text-[#71717a]">Leave empty to default-assign high resolution vectors automatically.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringTeam}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1"
                >
                  {registeringTeam ? 'Creating...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
