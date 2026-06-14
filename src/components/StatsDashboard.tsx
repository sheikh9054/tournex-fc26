/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database } from '../server/db';
import { 
  Trophy, Goal, Users, Gamepad2, AlertCircle, TrendingUp, Calendar, Zap, 
  BarChart2, Search, Medal, ShieldAlert, Sparkles, Plus, PlaySquare, BarChart as ChartIcon,
  Clock, Activity, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
  LineChart, Line
} from 'recharts';

interface StatsDashboardProps {
  db: Database;
}

export default function StatsDashboard({ db }: StatsDashboardProps) {
  const [subTab, setSubTab] = useState<'overview' | 'tournaments' | 'players' | 'teams'>('overview');
  const [playerSportFilter, setPlayerSportFilter] = useState<string>('All');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('All');

  const teams = db.teams || [];
  const players = db.players || [];
  const tournaments = db.tournaments || [];
  const leagues = db.leagues || [];
  const matches = db.matches || [];

  const completedMatches = matches.filter(m => m.status === 'Completed');
  const scheduledMatches = matches.filter(m => m.status === 'Scheduled');
  const liveMatches = matches.filter(m => m.status === 'Live');
  
  // Aggregate goals
  let totalGoals = 0;
  completedMatches.forEach(m => {
    totalGoals += (m.team1Score ?? 0) + (m.team2Score ?? 0);
  });

  const avgGoalsPerMatch = completedMatches.length > 0 
    ? (totalGoals / completedMatches.length).toFixed(1) 
    : '0.0';

  // 4. Team Performance Over Time Graph & Metrics
  const teamPowerData = teams.map(t => {
    const teamMatches = completedMatches.filter(m => m.team1Id === t.id || m.team2Id === t.id);
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let yellowCards = 0;
    let redCards = 0;

    teamMatches.forEach(m => {
      const isT1 = m.team1Id === t.id;
      const scoreSelf = isT1 ? (m.team1Score ?? 0) : (m.team2Score ?? 0);
      const scoreOpp = isT1 ? (m.team2Score ?? 0) : (m.team1Score ?? 0);
      
      goalsFor += scoreSelf;
      goalsAgainst += scoreOpp;

      const selfYellows = isT1 ? (m.team1YellowCards ?? 0) : (m.team2YellowCards ?? 0);
      const selfReds = isT1 ? (m.team1RedCards ?? 0) : (m.team2RedCards ?? 0);
      yellowCards += selfYellows;
      redCards += selfReds;

      if (scoreSelf > scoreOpp) {
        wins++;
      } else if (scoreSelf < scoreOpp) {
        losses++;
      } else {
        draws++;
      }
    });
    
    const winRate = teamMatches.length > 0 ? Math.round((wins / teamMatches.length) * 100) : 0;
    return {
      id: t.id,
      name: t.name,
      logoUrl: t.logoUrl,
      winRate,
      goals: goalsFor, // kept for backward compatibility with charts
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      played: teamMatches.length,
      wins,
      losses,
      draws,
      yellowCards,
      redCards
    };
  }).sort((a, b) => b.winRate - a.winRate);

  const mostGoalsTeam = [...teamPowerData].sort((a, b) => b.goalsFor - a.goalsFor)[0] || null;
  const mostCardsTeam = [...teamPowerData].sort((a, b) => (b.yellowCards + b.redCards) - (a.yellowCards + a.redCards))[0] || null;
  const bestDefenseTeam = [...teamPowerData]
    .filter(t => t.played > 0)
    .sort((a, b) => (a.goalsAgainst / a.played) - (b.goalsAgainst / b.played))[0] || null;

  // Standings calculator helpers
  const getTeamStandingsAcrossLeagues = (teamId: string) => {
    const stands: { leagueName: string; seasonName: string; position: number; points: number; played: number }[] = [];
    leagues.forEach(l => {
      if (l.teamIds.includes(teamId)) {
        l.seasons.forEach(s => {
          const seasonMatches = matches.filter(m => m.referenceId === s.id && m.status === 'Completed');
          const standMap: Record<string, any> = {};
          l.teamIds.forEach(id => {
            standMap[id] = { teamId: id, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, matchesPlayed: 0 };
          });
          seasonMatches.forEach(m => {
            const t1 = m.team1Id;
            const t2 = m.team2Id;
            const s1 = m.team1Score ?? 0;
            const s2 = m.team2Score ?? 0;
            if (standMap[t1] && standMap[t2]) {
              standMap[t1].matchesPlayed++;
              standMap[t2].matchesPlayed++;
              standMap[t1].goalsFor += s1;
              standMap[t1].goalsAgainst += s2;
              standMap[t2].goalsFor += s2;
              standMap[t2].goalsAgainst += s1;
              standMap[t1].goalDifference = standMap[t1].goalsFor - standMap[t1].goalsAgainst;
              standMap[t2].goalDifference = standMap[t2].goalsFor - standMap[t2].goalsAgainst;
              if (s1 > s2) {
                standMap[t1].points += 3;
              } else if (s2 > s1) {
                standMap[t2].points += 3;
              } else {
                standMap[t1].points += 1;
                standMap[t2].points += 1;
              }
            }
          });
          const sorted = Object.values(standMap).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          });
          const idx = sorted.findIndex(item => item.teamId === teamId);
          if (idx !== -1) {
            stands.push({
              leagueName: l.name,
              seasonName: s.name,
              position: idx + 1,
              points: sorted[idx].points,
              played: sorted[idx].matchesPlayed
            });
          }
        });
      }
    });
    return stands;
  };

  const getTeamTournamentRecords = (teamId: string) => {
    const records: { tournamentName: string; status: string; result: string; played: number }[] = [];
    tournaments.forEach(t => {
      if (t.teamIds && t.teamIds.includes(teamId)) {
        let result = 'Participant';
        if (t.championId === teamId) {
          result = '🏆 Champion (1st)';
        } else if (t.runnerUpId === teamId) {
          result = '🥈 Runner-Up (2nd)';
        } else if (t.status === 'Completed') {
          result = 'Eliminated';
        } else {
          const tMatches = matches.filter(m => m.type === 'Tournament' && m.referenceId === t.id && (m.team1Id === teamId || m.team2Id === teamId));
          if (tMatches.length > 0) {
            const activeMatches = tMatches.filter(m => m.status !== 'Completed');
            if (activeMatches.length > 0) {
              result = `Playing in R${Math.max(...activeMatches.map(m => m.round || 1))}`;
            } else {
              result = 'Eliminated (In bracket)';
            }
          } else {
            result = 'Seeded';
          }
        }
        const gamesCount = matches.filter(m => m.type === 'Tournament' && m.referenceId === t.id && m.status === 'Completed' && (m.team1Id === teamId || m.team2Id === teamId)).length;
        records.push({
          tournamentName: t.name,
          status: t.status,
          result,
          played: gamesCount
        });
      }
    });
    return records;
  };

  // Analytical helper functions for each tournament and league
  const getTournamentTopScorer = (tId: string) => {
    const tMatches = matches.filter(m => m.type === 'Tournament' && m.referenceId === tId);
    const playerGoals: Record<string, number> = {};
    
    tMatches.forEach(m => {
      m.timeline.forEach(e => {
        if (e.type === 'Goal' && e.player1Id) {
          playerGoals[e.player1Id] = (playerGoals[e.player1Id] || 0) + 1;
        }
      });
      
      if (m.timeline.filter(e => e.type === 'Goal').length === 0) {
        const s1 = m.team1Score || 0;
        const s2 = m.team2Score || 0;
        if (s1 > 0) {
          const teamPlayers = players.filter(p => p.teamId === m.team1Id);
          if (teamPlayers[0]) {
            playerGoals[teamPlayers[0].id] = (playerGoals[teamPlayers[0].id] || 0) + s1;
          }
        }
        if (s2 > 0) {
          const teamPlayers = players.filter(p => p.teamId === m.team2Id);
          if (teamPlayers[0]) {
            playerGoals[teamPlayers[0].id] = (playerGoals[teamPlayers[0].id] || 0) + s2;
          }
        }
      }
    });
    
    let topScorerName = 'N/A';
    let maxGoals = 0;
    Object.entries(playerGoals).forEach(([pId, goals]) => {
      if (goals > maxGoals) {
        maxGoals = goals;
        const pObj = players.find(p => p.id === pId);
        if (pObj) {
          topScorerName = pObj.name;
        }
      }
    });
    
    return { name: topScorerName, goals: maxGoals };
  };

  const getLeagueTopScorer = (leagueId: string) => {
    const leagueObj = leagues.find(l => l.id === leagueId);
    const seasonIds = (leagueObj?.seasons || []).map(s => s.id);
    const lMatches = matches.filter(m => m.type === 'League' && (m.referenceId === leagueId || (m.referenceId && seasonIds.includes(m.referenceId))));
    
    const playerGoals: Record<string, number> = {};
    lMatches.forEach(m => {
      m.timeline.forEach(e => {
        if (e.type === 'Goal' && e.player1Id) {
          playerGoals[e.player1Id] = (playerGoals[e.player1Id] || 0) + 1;
        }
      });
      
      if (m.timeline.filter(e => e.type === 'Goal').length === 0) {
        const s1 = m.team1Score || 0;
        const s2 = m.team2Score || 0;
        if (s1 > 0) {
          const tPlayers = players.filter(p => p.teamId === m.team1Id);
          if (tPlayers[0]) playerGoals[tPlayers[0].id] = (playerGoals[tPlayers[0].id] || 0) + s1;
        }
        if (s2 > 0) {
          const tPlayers = players.filter(p => p.teamId === m.team2Id);
          if (tPlayers[0]) playerGoals[tPlayers[0].id] = (playerGoals[tPlayers[0].id] || 0) + s2;
        }
      }
    });

    let topName = 'N/A';
    let topGoals = 0;
    Object.entries(playerGoals).forEach(([pId, goals]) => {
      if (goals > topGoals) {
        topGoals = goals;
        const pObj = players.find(p => p.id === pId);
        if (pObj) topName = pObj.name;
      }
    });
    return { name: topName, goals: topGoals };
  };

  const getLeagueTopCardedPlayer = (leagueId: string) => {
    const leagueObj = leagues.find(l => l.id === leagueId);
    const seasonIds = (leagueObj?.seasons || []).map(s => s.id);
    const lMatches = matches.filter(m => m.type === 'League' && (m.referenceId === leagueId || (m.referenceId && seasonIds.includes(m.referenceId))));
    
    const playerYellows: Record<string, number> = {};
    const playerReds: Record<string, number> = {};
    
    lMatches.forEach(m => {
      m.timeline.forEach(e => {
        if (e.type === 'Yellow Card' && e.player1Id) {
          playerYellows[e.player1Id] = (playerYellows[e.player1Id] || 0) + 1;
        }
        if (e.type === 'Red Card' && e.player1Id) {
          playerReds[e.player1Id] = (playerReds[e.player1Id] || 0) + 1;
        }
      });
      
      if (m.timeline.filter(e => e.type === 'Yellow Card' || e.type === 'Red Card').length === 0) {
        const y1 = m.team1YellowCards || 0;
        const r1 = m.team1RedCards || 0;
        const y2 = m.team2YellowCards || 0;
        const r2 = m.team2RedCards || 0;
        
        if (y1 > 0 || r1 > 0) {
          const pList = players.filter(p => p.teamId === m.team1Id);
          if (pList[0]) {
            playerYellows[pList[0].id] = (playerYellows[pList[0].id] || 0) + y1;
            playerReds[pList[0].id] = (playerReds[pList[0].id] || 0) + r1;
          }
        }
        if (y2 > 0 || r2 > 0) {
          const pList = players.filter(p => p.teamId === m.team2Id);
          if (pList[0]) {
            playerYellows[pList[0].id] = (playerYellows[pList[0].id] || 0) + y2;
            playerReds[pList[0].id] = (playerReds[pList[0].id] || 0) + r2;
          }
        }
      }
    });
    
    let maxWeight = 0;
    let topName = 'Clean Fairplay';
    let topY = 0;
    let topR = 0;
    
    const allPlayerIds = new Set([...Object.keys(playerYellows), ...Object.keys(playerReds)]);
    allPlayerIds.forEach(pId => {
      const y = playerYellows[pId] || 0;
      const r = playerReds[pId] || 0;
      const weight = y * 1 + r * 3;
      if (weight > maxWeight) {
        maxWeight = weight;
        topY = y;
        topR = r;
        const pObj = players.find(p => p.id === pId);
        if (pObj) topName = pObj.name;
      }
    });
    
    return { name: topName, yellow: topY, red: topR };
  };

  // Get dynamic stats summary for the current subTab
  const getStatsSummary = () => {
    if (subTab === 'overview') {
      return [
        { label: 'Virtual Matches', value: matches.length, caption: `${completedMatches.length} finished / ${liveMatches.length} live`, icon: Gamepad2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
        { label: 'Match Goals Scored', value: totalGoals, caption: `Average ${avgGoalsPerMatch} per match`, icon: Goal, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Seeded Gamers', value: teams.length, caption: `${leagues.length} leagues configured`, icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        { label: 'Registered Accounts', value: players.length, caption: 'FC 26 Active Battleground', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
      ];
    } else if (subTab === 'tournaments') {
      const finishedLeagues = leagues.filter(l => l.status === 'Completed').length;
      const activeLeagues = leagues.filter(l => l.status === 'Active').length;
      const lMatches = matches.filter(m => m.type === 'League');
      const lGoals = lMatches.filter(m => m.status === 'Completed').reduce((sum, m) => sum + (m.team1Score || 0) + (m.team2Score || 0), 0);
      
      const lTeamsWithPoints = teams.map(t => {
        const tMatches = lMatches.filter(m => m.status === 'Completed' && (m.team1Id === t.id || m.team2Id === t.id));
        let points = 0;
        tMatches.forEach(m => {
          const isT1 = m.team1Id === t.id;
          const scoreSelf = isT1 ? (m.team1Score || 0) : (m.team2Score || 0);
          const scoreOpp = isT1 ? (m.team2Score || 0) : (m.team1Score || 0);
          if (scoreSelf > scoreOpp) points += 3;
          else if (scoreSelf === scoreOpp) points += 1;
        });
        return { name: t.name, points };
      }).sort((a,b) => b.points - a.points);
      
      const topLeagueTeam = lTeamsWithPoints[0]?.points > 0 ? lTeamsWithPoints[0].name : 'N/A';

      return [
        { label: 'Leagues Configured', value: leagues.length, caption: `${finishedLeagues} completed / ${activeLeagues} active`, icon: Trophy, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        { label: 'League Fixtures', value: lMatches.length, caption: `${lMatches.filter(m=>m.status === 'Completed').length} finished matchdays`, icon: Gamepad2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
        { label: 'League Goals Scored', value: lGoals, caption: 'Total net goals in group stage', icon: Goal, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Dominant League Club', value: topLeagueTeam, caption: lTeamsWithPoints[0]?.points > 0 ? `${lTeamsWithPoints[0].points} points secured` : 'No league points yet', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
      ];
    } else if (subTab === 'players') {
      const finishedTs = tournaments.filter(t => t.status === 'Completed').length;
      const pendingTs = tournaments.filter(t => t.status !== 'Completed').length;
      const tMatches = matches.filter(m => m.type === 'Tournament');
      const completedTMatches = tMatches.filter(m => m.status === 'Completed');
      const tGoals = completedTMatches.reduce((sum, m) => sum + (m.team1Score || 0) + (m.team2Score || 0), 0);
      const crownedTourns = tournaments.filter(t => t.championId).length;

      return [
        { label: 'Tournaments Created', value: tournaments.length, caption: `${finishedTs} concluded / ${pendingTs} pending`, icon: Trophy, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
        { label: 'Bracket Battles', value: tMatches.length, caption: `${completedTMatches.length} finished / ${tMatches.filter(m => m.isByeMatch).length} autom. byes`, icon: Gamepad2, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
        { label: 'Trophies Awarded', value: crownedTourns, caption: 'Champions crowned & seeded', icon: Medal, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        { label: 'T-Tournament Goals', value: tGoals, caption: `${tGoals} exclusive bracket goals`, icon: Goal, color: 'text-emerald-400 bg-[#10b981]/10 border-[#10b981]/20' }
      ];
    } else {
      const highestWinRateTeam = teamPowerData[0] ? `${teamPowerData[0].winRate}%` : '0%';
      const bestOffensiveTeam = [...teamPowerData].sort((a,b) => b.goals - a.goals)[0]?.name || 'N/A';
      const totalYCards = players.reduce((sum, p) => sum + p.stats.yellowCards, 0);
      const totalRCards = players.reduce((sum, p) => sum + p.stats.redCards, 0);

      return [
        { label: 'Registered Power Clubs', value: teams.length, caption: 'Formidable league rosters', icon: Trophy, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
        { label: 'Peak Overall Win Rate', value: highestWinRateTeam, caption: `Dominance set by ${teamPowerData[0]?.name || 'N/A'}`, icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        { label: 'Strongest Offensive Core', value: bestOffensiveTeam, caption: `Most goals scored (${[...teamPowerData].sort((a,b) => b.goals - a.goals)[0]?.goals || 0})`, icon: Goal, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Platform Aggressive Index', value: `${totalYCards}🟨 ${totalRCards}🟥`, caption: 'Total discipline violations', icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
      ];
    }
  };

  const statsSummary = getStatsSummary();

  // 1. Sport Match Distribution Data
  const sportMatchDistribution: Record<string, number> = {};
  matches.forEach(m => {
    let sport: string = 'Friendly';
    if (m.type === 'Tournament') {
      const t = tournaments.find(x => x.id === m.referenceId);
      if (t) sport = t.sport;
    } else if (m.type === 'League') {
      const l = leagues.find(x => x.id === m.referenceId);
      if (l) sport = l.sport;
    }
    sportMatchDistribution[sport] = (sportMatchDistribution[sport] || 0) + 1;
  });
  const sportChartData = Object.entries(sportMatchDistribution).map(([sport, count]) => ({
    sport,
    fixtures: count
  }));

  // 2. Player Career Win Percentages & Top Scorers
  const topScorersData = [...players]
    .filter(p => p.stats.goalsScored > 0)
    .sort((a,b) => b.stats.goalsScored - a.stats.goalsScored)
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      goals: p.stats.goalsScored,
      assists: p.stats.goalsAssisted,
      sport: p.sport,
      team: teams.find(t => t.id === p.teamId)?.name || 'Independent'
    }));

  const playerWinRatesData = [...players]
    .filter(p => (p.sport === playerSportFilter || playerSportFilter === 'All'))
    .sort((a, b) => b.stats.winPercentage - a.stats.winPercentage)
    .slice(0, 8)
    .map(p => ({
      name: p.name.split(' ')[0] + '.',
      winPercentage: p.stats.winPercentage,
      matches: p.stats.matchesPlayed,
      team: teams.find(t => t.id === p.teamId)?.name || 'FA'
    }));

  // 3. Yellow vs Red Cards Count
  let totalYellow = 0;
  let totalRed = 0;
  players.forEach(p => {
    totalYellow += p.stats.yellowCards;
    totalRed += p.stats.redCards;
  });

  const cardsData = [
    { name: 'Yellow Cards', value: totalYellow, color: '#facc15' },
    { name: 'Red Cards', value: totalRed, color: '#f87171' }
  ];

  // 4. Team Performance Over Time Graph & Metrics (Declaration moved to the top to resolve TDZ crash)

  // 5. Sequenced overall goal scorer intensity over past 10 matches
  const recentTimelineData = [...completedMatches]
    .sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
    .slice(-10)
    .map((m, idx) => ({
      match: `Fixt. ${idx + 1}`,
      goals: (m.team1Score ?? 0) + (m.team2Score ?? 0),
      team1: teams.find(t => t.id === m.team1Id)?.name.substring(0, 5) || 'T1',
      team2: teams.find(t => t.id === m.team2Id)?.name.substring(0, 5) || 'T2'
    }));

  const sportsList = ['All', ...Array.from(new Set(players.map(p => p.sport)))];

  // Golden Boot Player Card
  const topScoringPlayer = players.length > 0
    ? [...players].sort((a, b) => {
        const goalsA = a.stats?.goalsScored ?? 0;
        const goalsB = b.stats?.goalsScored ?? 0;
        return goalsB - goalsA;
      })[0]
    : null;

  // Fairest Team Card (most disciplinary)
  const fairestTeam = teamPowerData.length > 0
    ? [...teamPowerData].sort((a, b) => (a.yellowCards + a.redCards) - (b.yellowCards + b.redCards))[0]
    : null;

  // Thriller Match of the Season (highest aggregate goals)
  const thrillerMatch = completedMatches.length > 0
    ? [...completedMatches].sort((a, b) => {
        const totalA = (a.team1Score ?? 0) + (a.team2Score ?? 0);
        const totalB = (b.team1Score ?? 0) + (b.team2Score ?? 0);
        return totalB - totalA;
      })[0]
    : null;

  const t1Thriller = thrillerMatch ? teams.find(t => t.id === thrillerMatch.team1Id) : null;
  const t2Thriller = thrillerMatch ? teams.find(t => t.id === thrillerMatch.team2Id) : null;

  // Helper for relative timestamps
  const formatTimeRelative = (dateString: string) => {
    try {
      const past = new Date(dateString).getTime();
      const now = new Date().getTime();
      const diffMs = now - past;
      if (diffMs < 0) return 'Just now';
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Some time ago';
    }
  };

  // Filtered and searched system/platform activity logs list
  const activityLogsList = db.activityLogs || [];

  const filteredLogs = activityLogsList.filter(log => {
    const textMatch = 
      (log.userName || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(activitySearch.toLowerCase());

    if (!log.action) return textMatch;
    const actionLower = log.action.toLowerCase();
    
    if (activityFilter === 'Logins') {
      return textMatch && (actionLower.includes('sign') || actionLower.includes('register'));
    }
    if (activityFilter === 'Matches') {
      return textMatch && (actionLower.includes('match') || actionLower.includes('schedule') || actionLower.includes('friendly') || actionLower.includes('fixture'));
    }
    if (activityFilter === 'Teams') {
      return textMatch && (actionLower.includes('team') || actionLower.includes('player') || actionLower.includes('roster'));
    }
    if (activityFilter === 'Tournaments') {
      return textMatch && (actionLower.includes('tourney') || actionLower.includes('tournament') || actionLower.includes('league') || actionLower.includes('season') || actionLower.includes('swiss'));
    }
    return textMatch;
  });

  const getLogBadgeAndIcon = (action: string) => {
    const actionLower = (action || '').toLowerCase();
    if (actionLower.includes('sign') || actionLower.includes('register')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        label: 'Auth & Profile',
        color: 'text-emerald-400',
      };
    }
    if (actionLower.includes('match') || actionLower.includes('schedule') || actionLower.includes('friendly') || actionLower.includes('fixture')) {
      return {
        bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
        label: 'Match Engine',
        color: 'text-sky-400',
      };
    }
    if (actionLower.includes('team') || actionLower.includes('player') || actionLower.includes('roster')) {
      return {
        bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        label: 'Rosters',
        color: 'text-indigo-400',
      };
    }
    if (actionLower.includes('tournament') || actionLower.includes('tourney') || actionLower.includes('league') || actionLower.includes('season') || actionLower.includes('swiss')) {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        label: 'Competitions',
        color: 'text-amber-400',
      };
    }
    return {
      bg: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/25',
      label: 'System Log',
      color: 'text-zinc-400',
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs header selector */}
      <div className="flex border-b border-[#27272a] gap-2 pb-px overflow-x-auto">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'overview'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📊 Platform Activity
        </button>
        <button
          onClick={() => setSubTab('tournaments')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'tournaments'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏆 Leagues & Sports
        </button>
        <button
          onClick={() => setSubTab('players')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'players'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏆 Tournament Analytics
        </button>
        <button
          onClick={() => setSubTab('teams')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'teams'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🛡️ Team Power Index
        </button>
      </div>

      {/* METRICS HEADERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsSummary.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="border border-[#27272a] bg-[#18181b]/60 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:scale-[1.01] shadow-xl"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight text-white">
                  {stat.value}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                  {stat.caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE SUB-TAB INTERFACE CONTAINER */}
      
      {/* 1. OVERVIEW GRAPH TAB */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline scoring trend */}
          <div className="lg:col-span-2 border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fixture Scoring Intensity</h3>
                <p className="text-xs text-zinc-400">Total match goals plotted sequentially across last 10 completed matches</p>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                Avg {avgGoalsPerMatch} Goals
              </span>
            </div>
            
            <div className="h-64 mt-4 w-full">
              {recentTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentTimelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="match" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Area type="monotone" dataKey="goals" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorGoals)" name="Total Goals" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <Calendar className="w-8 h-8 mb-1 opacity-50" />
                  <p className="text-xs text-[#71717a]">No timeline records logged.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tournament history & champions ledger highlights */}
          <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tournament History</h3>
              <p className="text-xs text-[#71717a]">Historical ladder analytics: Conducted brackets, participant counts, and medalist outcomes</p>
            </div>

            <div className="space-y-3 max-h-[224px] overflow-y-auto pr-1">
              {tournaments.length === 0 ? (
                <div className="text-center py-10">
                  <Trophy className="w-10 h-10 text-zinc-500 mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs text-[#71717a] italic">No active tournaments registered</p>
                </div>
              ) : (
                tournaments.map(t => {
                  const champ = teams.find(x => x.id === t.championId);
                  const runner = teams.find(x => x.id === t.runnerUpId);
                  return (
                    <div key={t.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-2 text-xs hover:border-indigo-500/20 transition-all">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="font-bold text-indigo-400 uppercase tracking-wider">{t.name}</span>
                        <span className="text-[#a1a1aa]">{t.teamIds?.length || 0} Teams Drafted</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="py-1 px-2 bg-amber-500/5 border border-amber-500/20 rounded flex items-center justify-between gap-1.5 min-w-0">
                          <span className="text-amber-400 font-extrabold shrink-0">🥇 1st:</span>
                          <span className="font-semibold text-white truncate text-right flex-1">{champ?.name || 'In Progress'}</span>
                        </div>
                        <div className="py-1 px-2 bg-zinc-900 border border-white/5 rounded flex items-center justify-between gap-1.5 min-w-0">
                          <span className="text-zinc-400 font-extrabold shrink-0">🥈 2nd:</span>
                          <span className="font-semibold text-zinc-200 truncate text-right flex-1">{runner?.name || 'In Progress'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[10px] font-mono text-zinc-400">
              <span>Conducted: {tournaments.filter(t=>t.status === 'Completed').length} Completed</span>
              <span className="text-indigo-400 font-bold">{tournaments.filter(t=>t.status === 'Ongoing').length} Live</span>
            </div>
          </div>

          {/* Live Arena Activity and Fun Trivia Ledger */}
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* Live Activity Stream feed */}
            <div className="lg:col-span-2 border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span>Live Platform Activity Stream</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Chronological list of registration, completion, and session signals</p>
                </div>
                
                {/* Search box inline */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-zinc-950/60 border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 rounded-lg focus:outline-none focus:border-indigo-500 max-w-[180px]"
                  />
                </div>
              </div>

              {/* Action filter micro pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 mr-1 text-zinc-500">
                  <Filter className="w-3 h-3" /> Filters:
                </span>
                {['All', 'Logins', 'Matches', 'Teams', 'Tournaments'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setActivityFilter(fmt)}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activityFilter === fmt 
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 font-bold' 
                        : 'bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 text-zinc-500 border border-transparent'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Logs scrolling area */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 flex-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800/40 rounded-xl">
                    <Clock className="w-8 h-8 opacity-30 mx-auto mb-2 text-indigo-400" />
                    <p className="text-xs">No activity logs meet current criteria.</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const meta = getLogBadgeAndIcon(log.action);
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 text-xs border-b border-zinc-900/40 pb-3 last:border-0 last:pb-0 hover:bg-zinc-950/20 p-2 rounded-lg transition-colors group"
                      >
                        {/* Status Icon Indicator */}
                        <div className="mt-0.5 relative shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-1.5 bg-zinc-600 ring-4 ring-zinc-950/60 group-hover:scale-125 transition-transform ${
                            log.action?.toLowerCase().includes('sign') || log.action?.toLowerCase().includes('register')
                              ? 'bg-emerald-400 ring-emerald-500/10'
                              : log.action?.toLowerCase().includes('match') || log.action?.toLowerCase().includes('friendly')
                                ? 'bg-sky-400 ring-sky-500/10'
                                : log.action?.toLowerCase().includes('tourney') || log.action?.toLowerCase().includes('league')
                                  ? 'bg-amber-400 ring-amber-500/10'
                                  : 'bg-zinc-400 ring-zinc-500/10'
                          }`} />
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-extrabold text-zinc-200 block truncate">
                              {log.userName}
                            </span>
                            <span className="text-[9px] uppercase font-mono text-zinc-500 shrink-0">
                              {formatTimeRelative(log.createdAt)}
                            </span>
                          </div>

                          <div className="text-zinc-400 font-normal leading-relaxed break-words">
                            {log.details}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${meta.bg}`}>
                              {meta.label}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600 uppercase">
                              {log.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Arena Fun Facts and Trivia Column */}
            <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Arena Historical Milestones</span>
                </h3>
                <p className="text-xs text-zinc-400">Calculated highlights and overall record milestones across play histories</p>
              </div>

              <div className="space-y-4">
                {/* 1. Golden Boot Top Scorer player card */}
                <div className="bg-zinc-950/40 border border-white/5 p-3.5 rounded-xl space-y-2 hover:border-amber-500/20 transition-all">
                  <span className="block text-[9px] uppercase font-mono text-amber-400 font-extrabold tracking-widest">
                    🔥 Leading Arena Sniper
                  </span>
                  {topScoringPlayer ? (
                    <div className="flex items-center gap-3">
                      {topScoringPlayer.photoUrl && (
                        <img 
                          src={topScoringPlayer.photoUrl} 
                          className="w-9 h-9 rounded-full object-cover border border-amber-500/20 shrink-0 bg-amber-500/5" 
                          referrerPolicy="no-referrer" 
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-white truncate">{topScoringPlayer.name}</p>
                        <p className="text-xs text-zinc-400 font-mono">
                          Sport: <span className="text-white font-bold">{topScoringPlayer.sport}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-400 font-mono">{topScoringPlayer.stats?.goalsScored || 0}⚽</p>
                        <p className="text-[9px] font-mono text-zinc-500">Goals Scored</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic font-mono">No active goal totals yet.</p>
                  )}
                </div>

                {/* 2. Most disciplined fairest team */}
                <div className="bg-zinc-950/40 border border-white/5 p-3.5 rounded-xl space-y-2 hover:border-emerald-500/20 transition-all">
                  <span className="block text-[9px] uppercase font-mono text-emerald-400 font-extrabold tracking-widest">
                    🛡️ Clean Play Fair Award
                  </span>
                  {fairestTeam ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{fairestTeam.name}</p>
                        <p className="text-xs text-zinc-400 font-mono">
                          Played: <span className="font-bold text-white">{fairestTeam.played} fixtures</span>
                        </p>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="flex items-center justify-end gap-1 text-xs">
                          <span className="bg-yellow-500/10 text-yellow-500 px-1 py-0.2 rounded border border-yellow-500/10 text-[10.5px]">
                            {fairestTeam.yellowCards} 🟨
                          </span>
                          <span className="bg-red-500/10 text-rose-500 px-1 py-0.2 rounded border border-rose-500/10 text-[10.5px]">
                            {fairestTeam.redCards} 🟥
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 uppercase">Cumulative Warnings</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic font-mono">No teams computed.</p>
                  )}
                </div>

                {/* 3. Thriller Match of the Season */}
                <div className="bg-zinc-950/40 border border-white/5 p-3.5 rounded-xl space-y-2 hover:border-indigo-500/20 transition-all">
                  <span className="block text-[9px] uppercase font-mono text-indigo-400 font-extrabold tracking-widest">
                    🍿 Match of the Season (Thriller)
                  </span>
                  {thrillerMatch ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
                        <span className="truncate max-w-[90px]">{t1Thriller?.name || 'Home Roster'}</span>
                        <span className="text-zinc-500 block shrink-0 px-2">vs</span>
                        <span className="truncate max-w-[90px] text-right">{t2Thriller?.name || 'Away Roster'}</span>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-lg py-1 px-3 flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-zinc-500 uppercase">{thrillerMatch.type} Fixture</span>
                        <span className="text-indigo-400 font-black text-sm">
                          {thrillerMatch.team1Score ?? 0} - {thrillerMatch.team2Score ?? 0}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic font-mono">No completed friendly matches recorded.</p>
                  )}
                </div>

                {/* 4. Active counters */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-zinc-300">
                  <div className="bg-zinc-950/20 border border-white/5 p-2 rounded-lg">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Registered Users</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5 block">{db.profiles?.length || 0} Profiles</span>
                  </div>
                  <div className="bg-zinc-950/20 border border-white/5 p-2 rounded-lg">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono block">Constructed Leagues</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5 block">{leagues.length} Leagues</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. TOURNAMENTS & LEAGUES VISUALIZATIONS */}
      {subTab === 'tournaments' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Specific match volumetric activity by sport */}
          <div className="lg:col-span-2 border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fixtures Volume by Competitive Sport</h3>
              <p className="text-xs text-zinc-400">Number of scheduled and completed matches in each competitive game index</p>
            </div>

            <div className="h-64 mt-4 w-full">
              {sportChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sportChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="sport" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    />
                    <Bar dataKey="fixtures" fill="#818cf8" radius={[4, 4, 0, 0]} name="Games Played/Scheduled" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <Gamepad2 className="w-8 h-8 mb-2 opacity-30 text-indigo-400" />
                  <p className="text-xs text-[#71717a]">Create your first League or Tournament to view sport distributions.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active leagues list and match types distribution */}
          <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tournament Types Breakdown</h3>
              <p className="text-xs text-zinc-400">Comparing Single-Elim vs Round-Robin formats</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-[#27272a] rounded-xl bg-zinc-950/40 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-widest font-mono">
                  <span>Single Elimination</span>
                  <span className="font-bold text-indigo-400">{tournaments.filter(t => t.type === 'Single Elimination').length}</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${tournaments.length ? (tournaments.filter(t => t.type === 'Single Elimination').length / tournaments.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div className="p-4 border border-[#27272a] rounded-xl bg-zinc-950/40 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-widest font-mono">
                  <span>Double Elimination</span>
                  <span className="font-bold text-amber-400">{tournaments.filter(t => t.type === 'Double Elimination').length}</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${tournaments.length ? (tournaments.filter(t => t.type === 'Double Elimination').length / tournaments.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              <div className="p-4 border border-[#27272a] rounded-xl bg-zinc-950/40 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-widest font-mono">
                  <span>Round Robin & Swiss</span>
                  <span className="font-bold text-emerald-400">
                    {leagues.length + tournaments.filter(t => t.type === 'Swiss System' || t.type === 'Round Robin').length}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection of League History Ledger */}
        <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-6 space-y-4 shadow-xl mt-6">
          <div className="pb-3 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🏆 Arena League History Ledger</span>
              </h3>
              <p className="text-xs text-zinc-400">Showing created active database league tables, playday goalscorers, and discipline card metrics</p>
            </div>
            <span className="text-[10px] font-mono text-[#a1a1aa] bg-white/5 py-1 px-3 border border-white/5 rounded-full">
              {leagues.length} Leagues Total
            </span>
          </div>

          {leagues.length === 0 ? (
            <div className="border border-dashed border-zinc-800 py-16 text-center rounded-xl space-y-2">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto opacity-35 animate-bounce" />
              <h4 className="text-sm font-semibold text-white">No Leagues Discovered</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">Create and play league matchdays under the Leagues section to generate metrics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leagues.map(l => {
                const finishedS = l.status === 'Completed';
                const scorer = getLeagueTopScorer(l.id);
                const cardsPl = getLeagueTopCardedPlayer(l.id);

                return (
                  <div 
                    key={l.id} 
                    className="border border-[#27272a] bg-zinc-950/40 rounded-xl p-4.5 space-y-3.5 hover:border-indigo-500/20 hover:bg-zinc-950/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">{l.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-mono">
                          <span>{l.sport || 'EA FC 26'}</span>
                          <span>•</span>
                          <span className="text-zinc-400">Round Robin Format</span>
                        </div>
                      </div>

                      {finishedS ? (
                        <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Concluded
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-widest text-[#fbbf24] bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                          Active League
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Golden Boot for League */}
                      <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-400 flex items-center gap-1">
                          ⚽ Top Scorer
                        </span>
                        <span className="font-bold text-white font-mono truncate max-w-[150px]">
                          {scorer.goals > 0 ? `${scorer.name} (${scorer.goals} G)` : 'No goals recorded yet'}
                        </span>
                      </div>

                      {/* Top Carded for League */}
                      <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 flex items-center gap-1">
                          🟨 Discipline MVP
                        </span>
                        <span className="font-bold text-zinc-300 font-mono truncate max-w-[150px] flex items-center gap-1">
                          {cardsPl.yellow > 0 || cardsPl.red > 0 ? (
                            <>
                              <span>{cardsPl.name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({cardsPl.yellow}🟨 {cardsPl.red}🟥)
                              </span>
                            </>
                          ) : (
                            'Clean Fairplay Record'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px] uppercase font-mono text-zinc-500">
                      <div>
                        <span className="block text-zinc-400 font-bold">{(l.seasons || []).length} Seasons</span>
                        Playdays Count
                      </div>
                      <div className="text-right">
                        <span className="block text-indigo-400 font-bold font-sans">
                          {new Date(l.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        Conducted Date
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      )}

      {/* 3. TOURNAMENT HISTORY AND DETAILED MEDALS */}
      {subTab === 'players' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Tournament Overview Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Conducted Brackets</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">{tournaments.length}</p>
              <p className="text-[9px] text-[#71717a] mt-0.5">{tournaments.filter(t=>t.status === 'Completed').length} Concluded/Crowned</p>
            </div>
            
            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Average Teams</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {(tournaments.reduce((acc, t) => acc + (t.teamIds?.length || 0), 0) / Math.max(1, tournaments.length)).toFixed(1)}
              </p>
              <p className="text-[9px] text-[#71717a] mt-0.5">Competitors in pool</p>
            </div>

            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono font-mono">Bracket Battles Played</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {matches.filter(m => m.type === 'Tournament' && m.status === 'Completed').length}
              </p>
              <p className="text-[9px] text-[#71717a] mt-0.5">Automated fixture conclusions</p>
            </div>
          </div>

          {/* Collection of Tournament History */}
          <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>🏆 Arena Tournament History Ledger</span>
                </h3>
                <p className="text-xs text-zinc-400">Showing all created EA Sports FC tournament nodes, bracket dimensions, and crown holders</p>
              </div>
              <span className="text-[10px] font-mono text-[#a1a1aa] bg-white/5 py-1 px-3 border border-white/5 rounded-full">
                {tournaments.length} Brackets Total
              </span>
            </div>

            {tournaments.length === 0 ? (
              <div className="border border-dashed border-zinc-800 py-16 text-center rounded-xl space-y-2">
                <Trophy className="w-12 h-12 text-zinc-600 mx-auto opacity-35 animate-bounce" />
                <h4 className="text-sm font-semibold text-white">No Tournaments Discovered</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">Create and conclude bracket maps in the Tournament center tab to generate metrics.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map(t => {
                  const champ = teams.find(x => x.id === t.championId);
                  const runner = teams.find(x => x.id === t.runnerUpId);
                  const tMatches = matches.filter(m => m.type === 'Tournament' && m.referenceId === t.id);
                  const finishedMatches = tMatches.filter(m=>m.status === 'Completed').length;
                  
                  return (
                    <div 
                      key={t.id} 
                      className="border border-[#27272a] bg-zinc-950/40 rounded-xl p-4.5 space-y-3.5 hover:border-indigo-500/20 hover:bg-zinc-950/70 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">{t.name}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-mono">
                            <span>{t.sport || 'EA FC 26'}</span>
                            <span>•</span>
                            <span className="text-zinc-400">{t.type === 'Double Elimination' ? 'Double Elimination' : 'Single Elimination'}</span>
                          </div>
                        </div>

                        {t.status === 'Completed' ? (
                          <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Concluded
                          </span>
                        ) : (
                          <span className="shrink-0 text-[9px] font-mono font-bold uppercase tracking-widest text-[#fbbf24] bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                            Live Arena
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-yellow-500 flex items-center gap-1">
                            🥇 Champion
                          </span>
                          {champ ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              {champ.logoUrl && (
                                <img src={champ.logoUrl} className="w-4.5 h-4.5 rounded object-cover" referrerPolicy="no-referrer" />
                              )}
                              <span className="font-bold text-white truncate text-xs">{champ.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic block mt-0.5">TBD (Active)</span>
                          )}
                        </div>

                        <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#94a3b8] flex items-center gap-1">
                            🥈 Runner-Up
                          </span>
                          {runner ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              {runner.logoUrl && (
                                <img src={runner.logoUrl} className="w-4.5 h-4.5 rounded object-cover" referrerPolicy="no-referrer" />
                              )}
                              <span className="font-bold text-zinc-300 truncate text-xs">{runner.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic block mt-0.5">TBD (Active)</span>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Scorer Highlight */}
                      {(() => {
                        const tScorer = getTournamentTopScorer(t.id);
                        return (
                          <div className="bg-zinc-900/40 border border-white/5 p-2.5 rounded-lg flex items-center justify-between text-xs">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                              ⚽ Golden Boot
                            </span>
                            <span className="font-bold text-white font-mono truncate max-w-[150px]">
                              {tScorer.goals > 0 ? `${tScorer.name} (${tScorer.goals} G)` : 'No goals recorded yet'}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 text-[10px] uppercase font-mono text-zinc-500">
                        <div>
                          <span className="block text-zinc-400 font-bold">{t.teamIds?.length || 0}</span>
                          Teams Pool
                        </div>
                        <div>
                          <span className="block text-zinc-400 font-bold">{finishedMatches} / {tMatches.length}</span>
                          Matches Played
                        </div>
                        <div className="text-right">
                          <span className="block text-indigo-400 font-bold font-sans">
                            {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          Conducted Date
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. TEAM FORCE INDEX AND WIN CHAINS */}
      {subTab === 'teams' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Analytical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 flex items-center gap-4 shadow-md">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                <Goal className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">Golden Boot Club</span>
                <p className="text-sm font-extrabold text-white truncate mt-0.5">
                  {mostGoalsTeam ? mostGoalsTeam.name : 'N/A'}
                </p>
                <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                  {mostGoalsTeam ? `${mostGoalsTeam.goalsFor} Goals Scored` : 'No goals logged'}
                </p>
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 flex items-center gap-4 shadow-md">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">Peak Arena WR</span>
                <p className="text-sm font-extrabold text-white truncate mt-0.5">
                  {teamPowerData[0] ? teamPowerData[0].name : 'N/A'}
                </p>
                <p className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                  {teamPowerData[0] ? `${teamPowerData[0].winRate}% Win Rate` : '0%'}
                </p>
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 flex items-center gap-4 shadow-md">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">Discipline Warnings</span>
                <p className="text-sm font-extrabold text-white truncate mt-0.5">
                  {mostCardsTeam ? mostCardsTeam.name : 'N/A'}
                </p>
                <p className="text-xs text-rose-400 font-mono font-bold mt-0.5">
                  {mostCardsTeam ? `${mostCardsTeam.yellowCards}🟨 ${mostCardsTeam.redCards}🟥 Booked` : 'Clean record'}
                </p>
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#18181b]/50 rounded-xl p-4 flex items-center gap-4 shadow-md">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">Strongest Guard</span>
                <p className="text-sm font-extrabold text-white truncate mt-0.5">
                  {bestDefenseTeam ? bestDefenseTeam.name : 'N/A'}
                </p>
                <p className="text-xs text-indigo-400 font-mono font-bold mt-0.5">
                  {bestDefenseTeam ? `${(bestDefenseTeam.goalsAgainst / bestDefenseTeam.played).toFixed(1)} Conceded/G` : 'Brand New'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team power ranking bar table */}
            <div className="lg:col-span-2 border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Power Rankings (Overall Win Rates)</h3>
                <p className="text-xs text-zinc-400">Calculated based on completed fixtures wins over matches played</p>
              </div>

              <div className="h-72 w-full">
                {teamPowerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPowerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      />
                      <Bar dataKey="winRate" fill="#fbbf24" name="Win Percentage" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    <p className="text-xs text-[#71717a]">No teams found in database.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Offensive goals contribution index */}
            <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Team Offensive Output</h3>
                <p className="text-xs text-zinc-400">Total cumulative goals scored by active clubs</p>
              </div>

              <div className="h-70 overflow-y-auto space-y-3.5 pr-2">
                {teamPowerData.map((team, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="font-semibold block">{team.name}</span>
                      <span className="font-mono text-zinc-400 font-bold">{team.goals} Goals ({team.played} matches)</span>
                    </div>
                    <div className="w-full bg-zinc-950/40 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-indigo-400' : 'bg-zinc-600'}`} 
                        style={{ width: `${Math.max(5, Math.min(100, team.goals * 5))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Club Performance Ledger */}
          <div className="border border-[#27272a] bg-[#18181b]/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🛡️ Club Standings & Competitive Records Ledger</span>
              </h3>
              <p className="text-xs text-zinc-400">Complete calculated performance index for all registered power rosters, including total wins, draws, losses, goals, card statistics, and rankings in tournaments/leagues</p>
            </div>

            <div className="space-y-4">
              {teamPowerData.length === 0 ? (
                <div className="border border-dashed border-zinc-800 py-12 text-center rounded-xl">
                  <p className="text-xs text-zinc-500">No teams enrolled in the database.</p>
                </div>
              ) : (
                teamPowerData.map((team, idx) => {
                  const leagueStands = getTeamStandingsAcrossLeagues(team.id);
                  const tournamentRecords = getTeamTournamentRecords(team.id);

                  return (
                    <div 
                      key={team.id} 
                      className="border border-[#27272a] bg-zinc-950/40 rounded-xl p-5 space-y-4 hover:border-indigo-500/30 hover:bg-zinc-950/70 transition-all duration-300"
                    >
                      {/* Team Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-zinc-500 bg-white/5 w-6 h-6 rounded-full flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          {team.logoUrl && (
                            <img src={team.logoUrl} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <h4 className="text-sm font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
                              <span>{team.name}</span>
                              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {team.winRate}% WR
                              </span>
                            </h4>
                            <p className="text-[10px] uppercase font-mono text-zinc-500">Arena Competitive Record</p>
                          </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                            {team.wins} W
                          </span>
                          <span className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/15 px-2 py-1 rounded">
                            {team.draws} D
                          </span>
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded">
                            {team.losses} L
                          </span>
                          <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded">
                            {team.played} PLAYED
                          </span>
                        </div>
                      </div>

                      {/* Main Math Stats Table Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 text-xs">
                        <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                          <span className="block text-[9px] uppercase text-zinc-500 font-mono">Goals For</span>
                          <span className="font-bold text-white font-mono text-sm">{team.goalsFor} ⚽ Scored</span>
                        </div>
                        <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                          <span className="block text-[9px] uppercase text-zinc-500 font-mono">Goals Against</span>
                          <span className="font-bold text-zinc-400 font-mono text-sm">{team.goalsAgainst} 🥅 Conceded</span>
                        </div>
                        <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                          <span className="block text-[9px] uppercase text-zinc-500 font-mono font-bold">Goal Diff</span>
                          <span className={`font-bold font-mono text-sm ${team.goalDifference > 0 ? 'text-emerald-400' : team.goalDifference < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                            {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                          </span>
                        </div>
                        <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5 col-span-1">
                          <span className="block text-[9px] uppercase text-zinc-500 font-mono font-bold">Discipline Cards</span>
                          <span className="font-bold text-zinc-300 font-mono text-xs flex items-center gap-1.5 mt-0.5">
                            <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">{team.yellowCards} 🟨</span>
                            <span className="bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">{team.redCards} 🟥</span>
                          </span>
                        </div>

                        {/* Standings in Leagues */}
                        <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5 col-span-2 sm:col-span-4 lg:col-span-1">
                          <span className="block text-[9px] uppercase text-indigo-400 font-extrabold tracking-wider font-mono">Leagues & Seasons Ranking</span>
                          <div className="mt-1 space-y-1">
                            {leagueStands.length === 0 ? (
                              <span className="text-[10px] text-zinc-500 italic block">No league standings</span>
                            ) : (
                              leagueStands.map((stand, sidx) => (
                                <div key={sidx} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                  <span className="text-zinc-400 truncate max-w-[100px]">{stand.leagueName}</span>
                                  <span className="font-extrabold text-[#f59e0b] bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 shrink-0">
                                    Pos #{stand.position} ({stand.points}p)
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tournament Cups & Brackets Stands */}
                      <div className="bg-zinc-900/20 p-3 rounded-lg border border-white/5">
                        <span className="block text-[9px] uppercase text-emerald-400 font-extrabold tracking-wider font-mono mb-2">Tournament Cup Runs</span>
                        {tournamentRecords.length === 0 ? (
                          <span className="text-[10px] text-zinc-500 italic block font-mono">No active or past tournament registrations</span>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {tournamentRecords.map((tRec, tIdx) => (
                              <div key={tIdx} className="bg-black/40 border border-white/5 rounded p-2 flex items-center justify-between text-[11px] font-mono">
                                <span className="text-zinc-300 truncate max-w-[140px] font-bold">{tRec.tournamentName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                                  tRec.result.includes('🏆') 
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                    : tRec.result.includes('🥈')
                                      ? 'bg-zinc-400/25 text-zinc-300 border border-zinc-400/30'
                                      : tRec.result.includes('Playing')
                                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/25 animate-pulse'
                                        : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {tRec.result}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
