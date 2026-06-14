/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Database } from '../server/db';
import { Tournament, Match, UserRole } from '../types';
import { 
  Trophy, Sparkles, ChevronRight, Play, Edit2, 
  HelpCircle, Trash2, Plus, Calendar, AlertTriangle, Lightbulb,
  Download, FileSpreadsheet, FileJson
} from 'lucide-react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  Handle, 
  Position 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface BracketsTabProps {
  db: Database;
  currentUserRole: UserRole;
  currentUserId: string;
  onRefresh: () => void;
}

// React Flow Custom Match Node component
function MatchNode({ data }: { data: any }) {
  const m = data.match;
  const teams = data.teams;
  const t1 = teams.find((t: any) => t.id === m.team1Id);
  const t2 = teams.find((t: any) => t.id === m.team2Id);
  const isCompleted = m.status === 'Completed';
  
  const t1IsWinner = isCompleted && (m.team1Score ?? 0) > (m.team2Score ?? 0);
  const t2IsWinner = isCompleted && (m.team2Score ?? 0) > (m.team1Score ?? 0);

  // Grey background styling & clear BYE indicator for automated BYE matches
  if (m.isByeMatch) {
    return (
      <div className="border border-white/5 bg-[#27272a]/20 text-zinc-400 rounded-xl p-3 w-[260px] space-y-2 relative shadow-xl hover:border-zinc-800 transition opacity-85">
        <Handle type="target" position={Position.Left} style={{ background: '#71717a', width: '6px', height: '6px' }} />
        <Handle type="source" position={Position.Right} style={{ background: '#71717a', width: '6px', height: '6px' }} />
        
        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
          <span className="uppercase tracking-wider font-bold">{m.stage || `Round ${m.round}`}</span>
          <span className="text-zinc-500 font-bold bg-[#18181b] px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px]">BYE</span>
        </div>

        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-950/50 border border-white/5 text-zinc-300">
          <div className="flex items-center gap-2 truncate">
            {t1 ? (
              <>
                <img src={t1.logoUrl} className="w-4 h-4 rounded object-cover border border-white/5" referrerPolicy="no-referrer" />
                <span className="truncate font-semibold text-white">{t1.name}</span>
              </>
            ) : (
              <span className="text-zinc-500 italic font-mono">{m.team1Id || 'TBD'}</span>
            )}
          </div>
          <span className="text-[9px] font-bold text-zinc-500">Advanced</span>
        </div>

        <div className="flex items-center justify-center p-1 border-t border-white/5 text-[9px] font-mono text-zinc-500 gap-1.5 mt-1 bg-zinc-950/20 rounded">
          <span>↓ BYE - Advanced Automatically</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#18181b] text-white rounded-xl p-3 w-[260px] space-y-2.5 relative shadow-2xl hover:border-indigo-500/50 transition">
      {/* Target/Source Anchors for Node progression links */}
      <Handle type="target" position={Position.Left} style={{ background: '#6366f1', width: '6px', height: '6px' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#a5b4fc', width: '6px', height: '6px' }} />

      <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
        <span className="uppercase tracking-wider font-bold">{m.stage || `Round ${m.round}`}</span>
        {isCompleted ? (
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px]">Completed</span>
        ) : m.status === 'Live' ? (
          <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse text-[8px]">LIVE</span>
        ) : (
          <span className="text-zinc-400 font-semibold bg-white/5 px-1.5 py-0.5 rounded text-[8px]">SCHEDULED</span>
        )}
      </div>

      {/* Team A Row */}
      <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded transition-all ${t1IsWinner ? 'bg-emerald-500/5 text-emerald-400 font-bold border border-emerald-500/10' : isCompleted ? 'opacity-40' : 'bg-zinc-950/45'}`}>
        <div className="flex items-center gap-2 truncate">
          {t1 ? (
            <>
              <img src={t1.logoUrl} className="w-4 h-4 rounded object-cover border border-white/5" referrerPolicy="no-referrer" />
              <span className="truncate">{t1.name}</span>
            </>
          ) : (
            <span className="text-zinc-500 italic font-mono">{m.team1Id || 'TBD'}</span>
          )}
        </div>
        <span className="font-mono font-extrabold text-sm">{m.team1Score !== undefined ? m.team1Score : '-'}</span>
      </div>

      {/* Team B Row */}
      <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded transition-all ${t2IsWinner ? 'bg-emerald-500/5 text-emerald-400 font-bold border border-emerald-500/10' : isCompleted ? 'opacity-40' : 'bg-zinc-950/45'}`}>
        <div className="flex items-center gap-2 truncate">
          {t2 ? (
            <>
              <img src={t2.logoUrl} className="w-4 h-4 rounded object-cover border border-white/5" referrerPolicy="no-referrer" />
              <span className="truncate">{t2.name}</span>
            </>
          ) : (
            <span className="text-zinc-500 italic font-mono">{m.team2Id || 'TBD'}</span>
          )}
        </div>
        <span className="font-mono font-extrabold text-sm">{m.team2Score !== undefined ? m.team2Score : '-'}</span>
      </div>

      {/* Predictive & Admin actions panel */}
      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1.5 mt-1 text-[9px]">
        <button
          onClick={() => data.getAiPrediction(m)}
          disabled={m.team1Id === 'BYE' || m.team2Id === 'BYE' || m.isByeMatch}
          className="text-amber-400 hover:text-amber-300 font-mono font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          Predict Goals
        </button>

        {data.canManage && m.team1Id !== 'BYE' && m.team2Id !== 'BYE' && !m.isByeMatch && (
          <button
            onClick={() => {
              data.setEditingMatch(m);
              data.setEditScore1(m.team1Score || 0);
              data.setEditScore2(m.team2Score || 0);
              data.setEditNotes(m.notes || '');
            }}
            className="text-zinc-400 hover:text-white font-mono flex items-center gap-0.5 cursor-pointer hover:underline"
          >
            <Edit2 className="w-2.5 h-2.5" />
            Enter Result
          </button>
        )}
      </div>
    </div>
  );
}

export default function BracketsTab({ db, currentUserRole, currentUserId, onRefresh }: BracketsTabProps) {
  const tournaments = db.tournaments || [];
  const matches = db.matches || [];
  const teams = db.teams || [];

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments.length > 0 ? tournaments[0].id : ''
  );

  const [viewMode, setViewMode] = useState<'flow' | 'classic'>('flow');

  // New Tournament Modal triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newTourneySport, setNewTourneySport] = useState('Football');
  const [newTourneyType, setNewTourneyType] = useState('Single Elimination');
  const [selectedTeamsForNew, setSelectedTeamsForNew] = useState<string[]>([]);

  // Match score editor state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editScore1, setEditScore1] = useState<number>(0);
  const [editScore2, setEditScore2] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');

  // AI Prediction state
  const [predictingMatchId, setPredictingMatchId] = useState<string | null>(null);
  const [aiPrediction, setAiPrediction] = useState<{
    predictionText: string;
    team1WinProbability: number;
    team2WinProbability: number;
    expectedScore: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // AI Tournament Wrap-up summary states
  const [summaryTourneyId, setSummaryTourneyId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ headline: string; summary: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Export dropdown state and exporter utilities
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const exportTournamentJson = () => {
    if (!activeTournament) return;
    const data = {
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        sport: activeTournament.sport,
        type: activeTournament.type,
        champion: teams.find(t => t.id === activeTournament.championId)?.name || activeTournament.championId || 'None',
        teamsCount: activeTournament.teamIds.length,
        teamsList: activeTournament.teamIds.map(id => teams.find(t => t.id === id)?.name || id)
      },
      matches: activeTournamentMatches.map(m => {
        const t1Name = teams.find(t => t.id === m.team1Id)?.name || m.team1Id;
        const t2Name = teams.find(t => t.id === m.team2Id)?.name || m.team2Id;
        return {
          matchId: m.id,
          stage: m.stage || `Round ${m.round}`,
          round: m.round,
          team1: t1Name,
          team2: t2Name,
          team1Score: m.team1Score !== undefined ? m.team1Score : null,
          team2Score: m.team2Score !== undefined ? m.team2Score : null,
          status: m.status,
          notes: m.notes || ''
        };
      })
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTournament.name.replace(/\s+/g, '_')}_bracket.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const exportTournamentCsv = () => {
    if (!activeTournament) return;
    
    // Headers with UTF-8 BOM
    let csvContent = "\ufeffMatch ID,Stage,Round,Team 1,Team 2,Team 1 Score,Team 2 Score,Status,Notes\n";
    
    // Rows
    activeTournamentMatches.forEach(m => {
      const t1Name = teams.find(t => t.id === m.team1Id)?.name || m.team1Id || '';
      const t2Name = teams.find(t => t.id === m.team2Id)?.name || m.team2Id || '';
      const score1 = m.team1Score !== undefined ? m.team1Score : '';
      const score2 = m.team2Score !== undefined ? m.team2Score : '';
      const stage = m.stage || `Round ${m.round}`;
      const notes = (m.notes || '').replace(/"/g, '""');
      
      csvContent += `"${m.id}","${stage}",${m.round || 1},"${t1Name}","${t2Name}",${score1},${score2},"${m.status}","${notes}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTournament.name.replace(/\s+/g, '_')}_bracket.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const activeTournament = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  const activeTournamentMatches = activeTournament 
    ? matches.filter(m => m.referenceId === activeTournament.id) 
    : [];

  const canManage = currentUserRole === 'Super Admin' || currentUserRole === 'Tournament Admin';

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyName || selectedTeamsForNew.length < 2) {
      alert("Please provide a name and select at least 2 teams!");
      return;
    }

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTourneyName,
          sport: newTourneySport,
          type: newTourneyType,
          teamIds: selectedTeamsForNew
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewTourneyName('');
        setSelectedTeamsForNew([]);
        onRefresh();
        if (data.tournament) {
          setSelectedTournamentId(data.tournament.id);
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMatchScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    try {
      const res = await fetch(`/api/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Score: editScore1,
          team2Score: editScore2,
          status: 'Completed',
          notes: editNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingMatch(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament and its brackets?")) return;
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSelectedTournamentId('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAiPrediction = async (match: Match) => {
    if (match.team1Id === 'BYE' || match.team2Id === 'BYE') return;
    setPredictingMatchId(match.id);
    setAiPrediction(null);
    setLoadingAi(true);

    try {
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1Id: match.team1Id, team2Id: match.team2Id })
      });
      const data = await res.json();
      setAiPrediction(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAi(false);
    }
  };

  const getTournamentWrapup = async (tId: string) => {
    setSummaryTourneyId(tId);
    setAiSummary(null);
    setLoadingSummary(true);

    try {
      const res = await fetch('/api/ai/summarize-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: tId })
      });
      const data = await res.json();
      setAiSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Group matches by round for bracket layouts
  const roundsMap: Record<number, Match[]> = {};
  activeTournamentMatches.forEach(m => {
    const r = m.round || 1;
    if (!roundsMap[r]) roundsMap[r] = [];
    roundsMap[r].push(m);
  });
  
  const roundKeys = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  // React Flow Elements Generator
  const flowNodeTypes = useMemo(() => ({
    matchNode: MatchNode
  }), []);

  const flowElements = useMemo(() => {
    if (!activeTournament) return { nodes: [], edges: [] };
    
    const nodes: any[] = [];
    const edges: any[] = [];

    if (activeTournament.type === 'Single Elimination') {
      roundKeys.forEach((rk) => {
        const roundMatches = roundsMap[rk] || [];
        const count = roundMatches.length;
        const x = (rk - 1) * 340 + 50;

        // Custom vertical layout mapping
        const gap = Math.pow(2, rk - 1) * 160;
        const startY = (gap / 2) - 80;

        roundMatches.forEach((m, idx) => {
          const y = startY + idx * gap + 40;
          nodes.push({
            id: m.id,
            type: 'matchNode',
            position: { x, y },
            data: {
              match: m,
              teams,
              getAiPrediction,
              setEditingMatch,
              setEditScore1,
              setEditScore2,
              setEditNotes,
              canManage
            }
          });

          // Connect progression lines
          if (m.nextMatchId) {
            const isCompleted = m.status === 'Completed';
            edges.push({
              id: `edge-${m.id}-to-${m.nextMatchId}`,
              source: m.id,
              target: m.nextMatchId,
              type: 'smoothstep',
              animated: isCompleted,
              style: { 
                stroke: isCompleted ? '#818cf8' : '#27272a', 
                strokeWidth: isCompleted ? 2.5 : 1.5 
              }
            });
          }
        });
      });
    } else if (activeTournament.type === 'Double Elimination') {
      roundKeys.forEach((rk) => {
        const roundMatches = roundsMap[rk] || [];
        
        const wbMatches = roundMatches.filter(m => !m.stage?.includes('Losers') && m.stage !== 'Grand Final');
        const lbMatches = roundMatches.filter(m => m.stage?.includes('Losers'));
        const gfMatches = roundMatches.filter(m => m.stage === 'Grand Final');

        // Layout WB matches
        if (wbMatches.length > 0) {
          const x = (rk - 1) * 340 + 50;
          const gap = Math.pow(2, rk - 1) * 165;
          const startY = (gap / 2) - 80;
          wbMatches.forEach((m, idx) => {
            const y = startY + idx * gap + 40;
            nodes.push({
              id: m.id,
              type: 'matchNode',
              position: { x, y },
              data: {
                match: m,
                teams,
                getAiPrediction,
                setEditingMatch,
                setEditScore1,
                setEditScore2,
                setEditNotes,
                canManage
              }
            });
          });
        }

        // Layout LB matches
        if (lbMatches.length > 0) {
          const x = (rk - 1) * 340 + 50;
          lbMatches.forEach((m, idx) => {
            // Push downward to isolate from WB visually
            const y = 500 + idx * 165;
            nodes.push({
              id: m.id,
              type: 'matchNode',
              position: { x, y },
              data: {
                match: m,
                teams,
                getAiPrediction,
                setEditingMatch,
                setEditScore1,
                setEditScore2,
                setEditNotes,
                canManage
              }
            });
          });
        }

        // Layout GF matches
        gfMatches.forEach((m) => {
          const x = roundKeys.length * 340 + 50;
          const y = 280;
          nodes.push({
            id: m.id,
            type: 'matchNode',
            position: { x, y },
            data: {
              match: m,
              teams,
              getAiPrediction,
              setEditingMatch,
              setEditScore1,
              setEditScore2,
              setEditNotes,
              canManage
            }
          });
        });

        // Link node lines
        roundMatches.forEach((m) => {
          if (m.nextMatchId) {
            const isCompleted = m.status === 'Completed';
            edges.push({
              id: `edge-${m.id}-to-${m.nextMatchId}`,
              source: m.id,
              target: m.nextMatchId,
              type: 'smoothstep',
              animated: isCompleted,
              style: { 
                stroke: isCompleted ? '#818cf8' : '#27272a', 
                strokeWidth: isCompleted ? 2.5 : 1.5 
              }
            });
          }
          if (m.loserNextMatchId) {
            const isCompleted = m.status === 'Completed';
            edges.push({
              id: `edge-loser-${m.id}-to-${m.loserNextMatchId}`,
              source: m.id,
              target: m.loserNextMatchId,
              type: 'smoothstep',
              animated: isCompleted,
              style: { 
                stroke: isCompleted ? '#f87171' : '#3f3f46', 
                strokeDasharray: '4', 
                strokeWidth: 1.5 
              }
            });
          }
        });
      });
    }

    return { nodes, edges };
  }, [activeTournament, activeTournamentMatches, teams, roundKeys]);

  return (
    <div className="space-y-6">
      
      {/* Title & Selector actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Tournament Center
          </h2>
          <p className="text-xs text-zinc-450">Inspect brackets, complete matchups, or prompt Gemini AI predictive analyses.</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {tournaments.length > 0 && (
            <select
              id="tournament-select-dropdown"
              value={selectedTournamentId}
              onChange={(e) => {
                setSelectedTournamentId(e.target.value);
                setAiSummary(null);
                setSummaryTourneyId(null);
              }}
              className="bg-zinc-900 border border-white/10 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500/50"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
              ))}
            </select>
          )}

          {canManage && (
            <button
              id="btn-trigger-new-tournament"
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 text-zinc-950 font-semibold px-3 py-2 rounded-xl text-xs hover:bg-amber-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Bracket
            </button>
          )}

          {canManage && activeTournament && (
            <button
              id="btn-delete-active-tournament"
              onClick={() => handleDeleteTournament(activeTournament.id)}
              className="border border-red-500/20 bg-red-500/10 text-red-400 p-2 rounded-xl hover:bg-red-500/20 transition cursor-pointer"
              title="Delete Tournament"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeTournament ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Bracket Tree Area or Swiss Cards Column */}
          <div className="lg:col-span-3 border border-white/5 bg-[#18181b]/30 rounded-2xl p-6 relative overflow-x-auto shadow-xl">
            {/* Tournament badge card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 mb-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 flex-wrap">
                  {activeTournament.name}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/5">
                    {activeTournament.type}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">Sport: {activeTournament.sport} • {activeTournament.teamIds.length} rosters registered</p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* View toggles for Elimination brackets */}
                {(activeTournament.type === 'Single Elimination' || activeTournament.type === 'Double Elimination') && (
                  <div className="flex border border-white/5 bg-zinc-950 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('flow')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                        viewMode === 'flow' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🚀 Graph
                    </button>
                    <button
                      onClick={() => setViewMode('classic')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                        viewMode === 'classic' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🔲 Columns
                    </button>
                  </div>
                )}

                {activeTournament.championId ? (
                  <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 py-1 px-2.5 rounded-full font-medium">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Champion: {teams.find(t=>t.id === activeTournament.championId)?.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-zinc-500 bg-white/5 py-1 px-2.5 rounded-full font-mono">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                    <span>In Progress</span>
                  </div>
                )}

                <button
                  id="btn-ai-wrapup-tourney"
                  onClick={() => getTournamentWrapup(activeTournament.id)}
                  className="bg-zinc-800 border border-white/5 text-zinc-305 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-white/20 transition hover:bg-zinc-700 font-bold tracking-wide text-[10px] uppercase text-zinc-300 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Gemini Wrapup
                </button>

                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    id="btn-export-tournament"
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-zinc-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold tracking-wide text-[10px] uppercase cursor-pointer transition select-none"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Export
                  </button>
                  {showExportDropdown && (
                    <div id="bracket-export-dropdown" className="absolute right-0 mt-2 w-44 bg-[#121214] border border-[#27272a] rounded-xl p-1.5 shadow-2xl z-50 space-y-1 animate-fade-in">
                      <button
                        onClick={exportTournamentCsv}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg text-left transition cursor-pointer font-medium"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        Download CSV (.csv)
                      </button>
                      <button
                        onClick={exportTournamentJson}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg text-left transition cursor-pointer font-medium"
                      >
                        <FileJson className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        Download JSON (.json)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Wrapup Display segment */}
            {summaryTourneyId === activeTournament.id && (
              <div id="ai-summary-toast" className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Gemini AI Tournament report
                  </span>
                  <button onClick={() => setSummaryTourneyId(null)} className="text-zinc-500 hover:text-white text-xs">Close</button>
                </div>
                {loadingSummary ? (
                  <p className="text-xs text-zinc-400 animate-pulse">Consulting sports data models...</p>
                ) : aiSummary ? (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">{aiSummary.headline}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{aiSummary.summary}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* RENDER CHANNELS */}

            {/* RENDER INTERACTIVE REACT FLOW GRAPH */}
            {(viewMode === 'flow' && (activeTournament.type === 'Single Elimination' || activeTournament.type === 'Double Elimination')) ? (
              <div className="h-[600px] w-full border border-white/5 bg-zinc-950/40 rounded-xl relative overflow-hidden">
                <ReactFlow
                  nodes={flowElements.nodes}
                  edges={flowElements.edges}
                  nodeTypes={flowNodeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                >
                  <Controls className="bg-zinc-900 border border-white/10 text-white rounded-lg p-1 fill-white" />
                  <Background gap={14} size={1} color="#3f3f46" />
                </ReactFlow>
              </div>
            ) : (activeTournament.type === 'Single Elimination' || activeTournament.type === 'Double Elimination') ? (
              
              /* RENDER CLASSIC GRID COLUMNS */
              <div className="flex items-start gap-8 min-w-[700px] justify-between py-4">
                {roundKeys.map((roundKey) => {
                  const roundMatches = roundsMap[roundKey];
                  return (
                    <div key={roundKey} className="flex-1 flex flex-col justify-around gap-12 min-h-[400px]">
                      <div className="text-center border-b border-white/5 pb-2">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                          Round {roundKey}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-6">
                        {roundMatches.map((m) => {
                          const t1 = teams.find(t=>t.id === m.team1Id);
                          const t2 = teams.find(t=>t.id === m.team2Id);
                          const isCompleted = m.status === 'Completed';

                          const t1IsWinner = isCompleted && (m.team1Score ?? 0) > (m.team2Score ?? 0);
                          const t2IsWinner = isCompleted && (m.team2Score ?? 0) > (m.team1Score ?? 0);

                          return (
                            <div 
                              key={m.id}
                              id={`match-node-${m.id}`}
                              className="border border-white/5 bg-zinc-950/40 rounded-xl p-3 space-y-2 relative group hover:border-zinc-700/80 transition"
                            >
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                <span>{m.stage}</span>
                                {isCompleted && <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">COM</span>}
                              </div>

                              {/* Slot 1 */}
                              <div className={`flex items-center justify-between text-xs p-1 rounded ${t1IsWinner ? 'bg-emerald-500/5 text-emerald-400 font-semibold' : ''}`}>
                                <div className="flex items-center gap-1.5 truncate">
                                  {t1 ? (
                                    <>
                                      <img src={t1.logoUrl} className="w-3.5 h-3.5 rounded object-cover" referrerPolicy="no-referrer" />
                                      <span className="truncate">{t1.name}</span>
                                    </>
                                  ) : (
                                    <span className="text-zinc-500 italic">{m.team1Id || 'TBD'}</span>
                                  )}
                                </div>
                                <span className="font-mono">{m.team1Score !== undefined ? m.team1Score : '-'}</span>
                              </div>

                              {/* Slot 2 */}
                              <div className={`flex items-center justify-between text-xs p-1 rounded ${t2IsWinner ? 'bg-emerald-500/5 text-emerald-400 font-semibold' : ''}`}>
                                <div className="flex items-center gap-1.5 truncate">
                                  {t2 ? (
                                    <>
                                      <img src={t2.logoUrl} className="w-3.5 h-3.5 rounded object-cover" referrerPolicy="no-referrer" />
                                      <span className="truncate">{t2.name}</span>
                                    </>
                                  ) : (
                                    <span className="text-zinc-500 italic">{m.team2Id || 'TBD'}</span>
                                  )}
                                </div>
                                <span className="font-mono">{m.team2Score !== undefined ? m.team2Score : '-'}</span>
                              </div>

                              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1.5 mt-1">
                                <button
                                  id={`btn-ai-predict-${m.id}`}
                                  disabled={m.team1Id === 'BYE' || m.team2Id === 'BYE'}
                                  onClick={() => getAiPrediction(m)}
                                  className="text-[9px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-505" />
                                  Predict
                                </button>

                                {canManage && m.team1Id !== 'BYE' && m.team2Id !== 'BYE' && (
                                  <button
                                    id={`btn-edit-match-${m.id}`}
                                    onClick={() => {
                                      setEditingMatch(m);
                                      setEditScore1(m.team1Score || 0);
                                      setEditScore2(m.team2Score || 0);
                                      setEditNotes(m.notes || '');
                                    }}
                                    className="text-[9px] text-zinc-400 hover:text-white font-mono flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                    Enter Result
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
            ) : (
              
              /* SWISS OR ROUND ROBIN VERTICAL LISTS */
              <div className="space-y-6">
                {roundKeys.map((roundKey) => (
                  <div key={roundKey} className="space-y-2 border-b border-white/5 pb-4 last:border-0">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                      Playday / Round {roundKey}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roundsMap[roundKey].map((m) => {
                        const t1 = teams.find(t=>t.id === m.team1Id);
                        const t2 = teams.find(t=>t.id === m.team2Id);
                        const isCompleted = m.status === 'Completed';

                        return (
                          <div key={m.id} className="border border-white/5 bg-zinc-950/40 rounded-xl p-3 flex items-center justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="truncate">{t1?.name || m.team1Id}</span>
                                <span className="font-mono font-bold text-white">{m.team1Score !== undefined ? m.team1Score : '-'}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="truncate">{t2?.name || m.team2Id}</span>
                                <span className="font-mono font-bold text-white">{m.team2Score !== undefined ? m.team2Score : '-'}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1.5 border-l border-white/5 pl-3">
                              {canManage && (
                                <button
                                  id={`btn-manual-input-${m.id}`}
                                  onClick={() => {
                                    setEditingMatch(m);
                                    setEditScore1(m.team1Score || 0);
                                    setEditScore2(m.team2Score || 0);
                                    setEditNotes(m.notes || '');
                                  }}
                                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                                >
                                  Edit Result
                                </button>
                              )}
                              <button
                                onClick={() => getAiPrediction(m)}
                                className="text-[9px] text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                AI Forecast
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Match Prediction Sidebar Display */}
          <div className="space-y-4">
            <div className="border border-white/5 bg-[#18181b]/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">AI Predictions</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Task Gemini AI models to analyze strengths, historic scores, rosters, and power indexes.
              </p>

              {predictingMatchId ? (
                <div id="ai-prediction-panel" className="border-t border-white/5 pt-4 space-y-4">
                  {loadingAi ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded" />
                      <div className="h-3 bg-white/5 rounded w-5/6" />
                    </div>
                  ) : aiPrediction ? (
                    <div className="space-y-3">
                      <div className="p-3 border border-zinc-805 rounded-xl bg-zinc-950/60 text-center border border-amber-500/10">
                        <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Expected Score</span>
                        <p className="text-lg font-bold font-mono text-amber-400 tracking-widest mt-0.5">{aiPrediction.expectedScore}</p>
                      </div>

                      {/* Probabilities */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-450 flex justify-between font-mono">
                          <span>Home ({aiPrediction.team1WinProbability}%)</span>
                          <span>Away ({aiPrediction.team2WinProbability}%)</span>
                        </span>
                        <div className="h-2 rounded-full bg-zinc-850 overflow-hidden flex">
                          <div className="bg-amber-500 h-full" style={{ width: `${aiPrediction.team1WinProbability}%` }} />
                          <div className="bg-indigo-500 h-full" style={{ width: `${aiPrediction.team2WinProbability}%` }} />
                        </div>
                      </div>

                      <div className="text-xs text-zinc-400 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 leading-relaxed font-sans block">
                        <span>{aiPrediction.predictionText}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Error processing prediction.</p>
                  )}
                </div>
              ) : (
                <div className="border-t border-white/5 pt-4 flex flex-col items-center justify-center py-6 text-zinc-500 text-center gap-2">
                  <HelpCircle className="w-8 h-8 opacity-30" />
                  <span className="text-xs">Select "Predict" on any node card to trigger AI Analysis.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Trophy className="w-12 h-12 text-zinc-500 opacity-30 animate-bounce" />
          <h3 className="text-base font-semibold text-white">No tournaments drafted</h3>
          <p className="text-xs text-zinc-450 max-w-sm leading-relaxed">
            There are no drafted or running tournament brackets setup. Click "New Bracket" to seed rosters instantly!
          </p>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 text-zinc-950 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Draft First Tournament
            </button>
          )}
        </div>
      )}

      {/* NEW TOURNAMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Configure Tournament Bracket
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Tournament Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Esports Cup"
                  value={newTourneyName}
                  onChange={(e) => setNewTourneyName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Sport Discipline</label>
                  <select
                    value={newTourneySport}
                    onChange={(e) => setNewTourneySport(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-350 outline-none"
                  >
                    <option value="FC 26">FC 26</option>
                    <option value="FIFA">FIFA</option>
                    <option value="eFootball">eFootball</option>
                    <option value="BGMI">BGMI</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Chess">Chess</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Tournament Type</label>
                  <select
                    value={newTourneyType}
                    onChange={(e) => setNewTourneyType(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-350 outline-none"
                  >
                    <option value="Single Elimination">Single Elimination</option>
                    <option value="Double Elimination">Double Elimination</option>
                    <option value="Round Robin">Round Robin</option>
                    <option value="Swiss System">Swiss System</option>
                  </select>
                </div>
              </div>

              {/* Team selection checkboxes */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Select Rosters ({selectedTeamsForNew.length} chosen)</label>
                <div className="bg-zinc-950 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 hover:bg-zinc-900 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTeamsForNew.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeamsForNew([...selectedTeamsForNew, t.id]);
                          } else {
                            setSelectedTeamsForNew(selectedTeamsForNew.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span className="text-zinc-300">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl"
                >
                  Generate Fixtures
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATCH RESULT INPUT EDITOR */}
      {editingMatch && (
        <div id="match-score-modal" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 ">
              <Calendar className="w-5 h-5 text-amber-500" />
              Enter Match Results
            </h3>

            <form onSubmit={handleUpdateMatchScore} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-300 truncate font-semibold">
                    {teams.find(t=>t.id === editingMatch.team1Id)?.name || editingMatch.team1Id}
                  </span>
                  <input
                    type="number"
                    min="0"
                    id="team1-score-input"
                    value={editScore1}
                    onChange={(e) => setEditScore1(parseInt(e.target.value) || 0)}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 text-center text-white"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-300 truncate font-semibold">
                    {teams.find(t=>t.id === editingMatch.team2Id)?.name || editingMatch.team2Id}
                  </span>
                  <input
                    type="number"
                    min="0"
                    id="team2-score-input"
                    value={editScore2}
                    onChange={(e) => setEditScore2(parseInt(e.target.value) || 0)}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 text-center text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Match Notes / Details</label>
                <textarea
                  id="match-notes-textarea"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Scored by Benzema in overtime!"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-match-score"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl"
                >
                  Confirm Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
