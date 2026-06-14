/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database } from '../server/db';
import { Match, MatchTimelineEvent, Player, Team, UserRole } from '../types';
import { 
  Gamepad2, Calendar, Plus, Goal, UserPlus, SwatchBook, 
  Trash2, Award, ShieldAlert, BadgeMinus, Shield, Sparkles
} from 'lucide-react';

interface MatchesTabProps {
  db: Database;
  currentUserRole: UserRole;
  currentUserId: string;
  onRefresh: () => void;
}

export default function MatchesTab({ db, currentUserRole, currentUserId, onRefresh }: MatchesTabProps) {
  const matches = db.matches || [];
  const teams = db.teams || [];
  const players = db.players || [];

  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches.length > 0 ? matches[0].id : ''
  );

  const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Friendly match scheduler state
  const [showFriendlyModal, setShowFriendlyModal] = useState(false);
  const [friendlyTeam1, setFriendlyTeam1] = useState('');
  const [friendlyTeam2, setFriendlyTeam2] = useState('');
  const [scheduledTime, setScheduledTime] = useState(new Date().toISOString().substring(0, 16));

  // Timeline Event state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState<'Goal' | 'Yellow Card' | 'Red Card' | 'MVP'>('Goal');
  const [eventMinute, setEventMinute] = useState<number>(45);
  const [eventTeam, setEventTeam] = useState<string>('');
  const [eventPlayer1, setEventPlayer1] = useState<string>('');
  const [eventPlayer2, setEventPlayer2] = useState<string>(''); // assist provider

  // Score editor in side
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [notes, setNotes] = useState('');
  const [mvpIdStr, setMvpIdStr] = useState('');

  // AI Prediction state in Matches Tab
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<{
    predictionText: string;
    team1WinProbability: number;
    team2WinProbability: number;
    expectedScore: string;
  } | null>(null);
  const [predictingId, setPredictingId] = useState<string | null>(null);

  const getAiPrediction = async (matchId: string, t1Id: string, t2Id: string) => {
    if (t1Id === 'BYE' || t2Id === 'BYE') return;
    setPredictingId(matchId);
    setAiPrediction(null);
    setLoadingAi(true);

    try {
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1Id: t1Id, team2Id: t2Id })
      });
      const data = await res.json();
      setAiPrediction(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAi(false);
    }
  };

  const canManage = currentUserRole !== 'Public Viewer';

  const handleCreateFriendly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendlyTeam1 || !friendlyTeam2 || friendlyTeam1 === friendlyTeam2) {
      alert("Please select two distinct teams for the friendly match.");
      return;
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Id: friendlyTeam1,
          team2Id: friendlyTeam2,
          scheduledTime: new Date(scheduledTime).toISOString(),
          status: 'Scheduled'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowFriendlyModal(false);
        onRefresh();
        if (data.match) {
          setSelectedMatchId(data.match.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateScoresDirect = async () => {
    if (!activeMatch) return;
    try {
      const res = await fetch(`/api/matches/${activeMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1Score: score1,
          team2Score: score2,
          notes,
          mvpId: mvpIdStr || null,
          status: 'Completed'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Match results updated, standings and leaderbords refreshed!");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !eventPlayer1) {
      alert("Specify the primary athlete actor.");
      return;
    }

    try {
      const res = await fetch(`/api/matches/${activeMatch.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          minute: eventMinute,
          player1Id: eventPlayer1,
          player2Id: eventPlayer2 || null,
          teamId: eventTeam || activeMatch.team1Id // fallback
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEventModal(false);
        setEventPlayer1('');
        setEventPlayer2('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (!activeMatch) return;
    try {
      const res = await fetch(`/api/matches/${activeMatch.id}/timeline/${eventId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync state with active match selection
  React.useEffect(() => {
    if (activeMatch) {
      setScore1(activeMatch.team1Score !== undefined ? activeMatch.team1Score : 0);
      setScore2(activeMatch.team2Score !== undefined ? activeMatch.team2Score : 0);
      setNotes(activeMatch.notes || '');
      setMvpIdStr(activeMatch.mvpId || '');
      // set event team default to Team 1
      setEventTeam(activeMatch.team1Id);
    }
  }, [selectedMatchId, activeMatch]);

  const team1Obj = activeMatch ? teams.find(t=>t.id === activeMatch.team1Id) : null;
  const team2Obj = activeMatch ? teams.find(t=>t.id === activeMatch.team2Id) : null;

  // Active match roster players
  const t1Players = activeMatch ? players.filter(p=>p.teamId === activeMatch.team1Id) : [];
  const t2Players = activeMatch ? players.filter(p=>p.teamId === activeMatch.team2Id) : [];
  const activeEventRoster = eventTeam === activeMatch?.team1Id ? t1Players : t2Players;
  const matchRosterCombined = [...t1Players, ...t2Players];

  return (
    <div className="space-y-6">
      
      {/* Header and New Friendly button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-sky-400" />
            Match Manager
          </h2>
          <p className="text-xs text-zinc-400 font-normal">Schedule matches, execute manual timelines, or configure friendly events.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {matches.length > 0 && (
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-zinc-300 rounded-xl px-3 py-2 outline-none"
            >
              {matches.map(m => {
                const t1 = teams.find(t=>t.id === m.team1Id)?.name || m.team1Id;
                const t2 = teams.find(t=>t.id === m.team2Id)?.name || m.team2Id;
                return (
                  <option key={m.id} value={m.id}>[{m.type}] {t1} vs {t2} {m.status === 'Completed' ? `(${m.team1Score}-${m.team2Score})` : ''}</option>
                );
              })}
            </select>
          )}

          {canManage && (
            <button
              id="btn-friendly-schedule-trigger"
              onClick={() => setShowFriendlyModal(true)}
              className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Casual Friendly
            </button>
          )}
        </div>
      </div>

      {activeMatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main score panel (Left, Colspans 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Massive Scoreboard card */}
            <div id="active-scoreboard-banner" className="border border-white/5 bg-gradient-to-b from-sky-500/[0.03] to-transparent rounded-2xl p-6 space-y-6">
              
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-500 tracking-wider">MATCH ID: {activeMatch.id}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                  activeMatch.type === 'Tournament' ? 'bg-amber-500/10 text-amber-400' :
                  activeMatch.type === 'League' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-sky-500/10 text-sky-400'
                }`}>
                  {activeMatch.type} MATCH
                </span>
              </div>

              {/* Roster badges */}
              <div className="flex items-center justify-around gap-4 text-center">
                
                {/* Team 1 info */}
                <div className="space-y-2 max-w-[150px]">
                  <img 
                    src={team1Obj?.logoUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120'} 
                    className="w-16 h-16 rounded-xl object-cover mx-auto border border-white/5 bg-zinc-900" 
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="text-sm font-bold text-white truncate">{team1Obj?.name || activeMatch.team1Id}</h4>
                </div>

                {/* Big Scores display */}
                <div className="space-y-1">
                  <div className="flex items-center gap-6">
                    <span className="text-5xl font-extrabold text-white tracking-tighter font-mono">
                      {activeMatch.team1Score !== undefined ? activeMatch.team1Score : '-'}
                    </span>
                    <span className="text-zinc-600 font-mono text-xl">VS</span>
                    <span className="text-5xl font-extrabold text-white tracking-tighter font-mono">
                      {activeMatch.team2Score !== undefined ? activeMatch.team2Score : '-'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                    {activeMatch.status === 'Completed' ? 'FULL TIME' : 'SCHEDULED'}
                  </p>
                </div>

                {/* Team 2 info */}
                <div className="space-y-2 max-w-[150px]">
                  <img 
                    src={team2Obj?.logoUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120'} 
                    className="w-16 h-16 rounded-xl object-cover mx-auto border border-white/5 bg-zinc-900" 
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="text-sm font-bold text-white truncate">{team2Obj?.name || activeMatch.team2Id}</h4>
                </div>
              </div>

              {/* Match Calendar captions */}
              <div className="pt-2 border-t border-white/5 text-center text-xs text-zinc-500 flex justify-center items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>Scheduled: {new Date(activeMatch.scheduledTime).toLocaleString()}</span>
                {activeMatch.stage && <span className="text-zinc-400 font-mono">({activeMatch.stage})</span>}
              </div>
            </div>

            {/* Gemini AI Match Prediction Interface */}
            {activeMatch && activeMatch.team1Id !== 'BYE' && activeMatch.team2Id !== 'BYE' && (
              <div id="gemini-match-forecast-hud" className="border border-amber-500/15 bg-amber-500/[0.01] rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Gemini AI Match Predictor</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Analyses atomic rosters, past seasonal fixtures, and head-to-head records.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => getAiPrediction(activeMatch.id, activeMatch.team1Id, activeMatch.team2Id)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer self-start sm:self-center"
                    disabled={loadingAi}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingAi ? 'Model Calculating...' : predictingId === activeMatch.id && aiPrediction ? 'Recalculate Odds' : 'Predict Outcome'}
                  </button>
                </div>

                {predictingId === activeMatch.id && (
                  <div className="border-t border-white/5 pt-3.5 space-y-4">
                    {loadingAi ? (
                      <div className="space-y-2.5 animate-pulse py-2">
                        <div className="h-4 bg-white/5 rounded w-1/4" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-4/5" />
                      </div>
                    ) : aiPrediction ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        {/* Box 1: Expected Score */}
                        <div className="p-3.5 border border-amber-500/10 rounded-xl bg-zinc-950/60 text-center flex flex-col justify-center">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Expected Score</span>
                          <span className="text-2xl font-extrabold font-mono text-amber-400 tracking-wider mt-1">{aiPrediction.expectedScore}</span>
                        </div>

                        {/* Box 2: Win chances bar */}
                        <div className="md:col-span-2 space-y-2.5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                            <span className="truncate max-w-[140px] font-semibold">{team1Obj?.name || 'Home'}: {aiPrediction.team1WinProbability}%</span>
                            <span className="truncate max-w-[140px] font-semibold">{team2Obj?.name || 'Away'}: {aiPrediction.team2WinProbability}%</span>
                          </div>
                          
                          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden flex">
                            <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${aiPrediction.team1WinProbability}%` }} />
                            <div className="bg-indigo-505 h-full transition-all duration-500" style={{ width: `${aiPrediction.team2WinProbability}%` || '50%' }} />
                          </div>

                          <p className="text-xs text-zinc-300 italic leading-relaxed pt-1 select-none">
                            💬 "{aiPrediction.predictionText}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">Error calculating prediction values.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Score Modifier Panel (only editable of course) */}
            {canManage && (
              <div id="match-score-modifier" className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Scoreboard Controller</h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">{team1Obj?.name || 'Home'} Score</label>
                    <input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">{team2Obj?.name || 'Away'} Score</label>
                    <input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Select MVP */}
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Award MVP</label>
                    <select
                      value={mvpIdStr}
                      onChange={(e) => setMvpIdStr(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                    >
                      <option value="">-- No MVP Selected --</option>
                      {matchRosterCombined.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({teams.find(t=>t.id===p.teamId)?.name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium">Match Summary Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Friendly test matches"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdateScoresDirect}
                    className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Save Match Outcome
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Match Events log sidebar (Right) */}
          <div className="space-y-4">
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Match Timeline</h3>
                {canManage && (
                  <button
                    id="btn-add-timeline-event"
                    onClick={() => {
                      if (matchRosterCombined.length === 0) {
                        alert("Please select a match where team rosters have registered athletes first!");
                        return;
                      }
                      setShowEventModal(true);
                    }}
                    className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Event
                  </button>
                )}
              </div>

              {/* Event logs stack */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {activeMatch.timeline && activeMatch.timeline.length > 0 ? (
                  activeMatch.timeline.map((event) => {
                    const actor = players.find(p=>p.id === event.player1Id);
                    const secondary = players.find(p=>p.id === event.player2Id);
                    const isT1 = event.teamId === activeMatch.team1Id;

                    return (
                      <div 
                        key={event.id} 
                        id={`timeline-event-${event.id}`}
                        className={`text-xs p-3 rounded-xl border border-white/5 bg-zinc-950/40 relative group flex items-start justify-between gap-3 ${
                          isT1 ? 'border-l-sky-500/40' : 'border-l-indigo-500/40'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded text-[10px]">
                              {event.minute}'
                            </span>
                            <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold tracking-wide">{event.type}</span>
                          </div>
                          
                          <p className="text-white font-medium">
                            {actor?.name || 'Unknown Athlete'}
                            {event.type === 'Goal' && secondary && (
                              <span className="text-[10px] text-zinc-400 block mt-0.5">
                                🎯 Assist: {secondary.name}
                              </span>
                            )}
                          </p>
                        </div>

                        {canManage && (
                          <button
                            id={`btn-del-event-${event.id}`}
                            onClick={() => handleDeleteTimelineEvent(event.id)}
                            className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center gap-2">
                    <Goal className="w-8 h-8 opacity-30 animate-pulse" />
                    <span className="text-xs">No match developments logged.</span>
                    <p className="text-[10px] px-4 max-w-xs text-zinc-600">Track fine-grained scorer metrics or cards visually right in the dashboard panel.</p>
                  </div>
                )}

                {/* MVP Highlight badge display */}
                {activeMatch.mvpId && (
                  <div className="mt-4 p-3 border border-yellow-500/10 bg-yellow-400/[0.02] rounded-xl flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-yellow-400 shrink-0" />
                    <div className="text-xs select-none">
                      <span className="text-[10px] text-yellow-500 font-bold uppercase block tracking-wider">OFFICIAL MVP AWARD</span>
                      <span className="font-semibold text-zinc-200">
                        {players.find(p=>p.id === activeMatch.mvpId)?.name || 'Award nominee'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-12 text-center text-zinc-500 text-xs">
          Select or schedule an active match first to display.
        </div>
      )}

      {/* CASUAL FRIENDLY MATCH MODAL */}
      {showFriendlyModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Gamepad2 className="w-5 h-5 text-sky-400" />
              Schedule Casual Friendly
            </h3>

            <form onSubmit={handleCreateFriendly} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">First Roster (Home)</label>
                <select
                  value={friendlyTeam1}
                  onChange={(e) => {
                    setFriendlyTeam1(e.target.value);
                    if (eventType === 'Goal') {
                      setEventTeam(e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                >
                  <option value="">-- Choose Team A --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Second Roster (Away)</label>
                <select
                  value={friendlyTeam2}
                  onChange={(e) => setFriendlyTeam2(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                >
                  <option value="">-- Choose Team B --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Match Schedule Clock</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFriendlyModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold px-4 py-2 rounded-xl"
                >
                  Add Friendly Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED TIMELINE RECORDER MODAL */}
      {showEventModal && activeMatch && (
        <div id="add-timeline-event-modal" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Goal className="w-5 h-5 text-sky-400" />
              Add Timeline Event
            </h3>

            <form onSubmit={handleAddTimelineEvent} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300"
                  >
                    <option value="Goal">Goal (Score)</option>
                    <option value="Yellow Card">Yellow Card</option>
                    <option value="Red Card">Red Card</option>
                    <option value="MVP">MVP award nomination</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium">Minute (0-90)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    id="timeline-minute-input"
                    value={eventMinute}
                    onChange={(e) => setEventMinute(parseInt(e.target.value) || 45)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 outline-none"
                  />
                </div>
              </div>

              {/* Choose Team */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Responsible Team Roster</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 bg-zinc-950 border border-white/5 hover:border-sky-500/50 p-2.5 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="radio-event-team"
                      checked={eventTeam === activeMatch.team1Id}
                      onChange={() => {
                        setEventTeam(activeMatch.team1Id);
                        setEventPlayer1('');
                        setEventPlayer2('');
                      }}
                      className="accent-sky-400"
                    />
                    <span className="text-zinc-300 leading-none truncate text-[11px] font-medium">{team1Obj?.name}</span>
                  </label>

                  <label className="flex-1 flex items-center justify-center gap-1 bg-zinc-950 border border-white/5 hover:border-sky-500/50 p-2.5 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="radio-event-team"
                      checked={eventTeam === activeMatch.team2Id}
                      onChange={() => {
                        setEventTeam(activeMatch.team2Id);
                        setEventPlayer1('');
                        setEventPlayer2('');
                      }}
                      className="accent-sky-400"
                    />
                    <span className="text-zinc-300 leading-none truncate text-[11px] font-medium">{team2Obj?.name}</span>
                  </label>
                </div>
              </div>

              {/* Choose Actor (Player 1) */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Core Athlete (Scorer or Carded player)</label>
                <select
                  id="select-event-actor"
                  value={eventPlayer1}
                  onChange={(e) => setEventPlayer1(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Roster Athlete --</option>
                  {activeEventRoster.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Optional Assist (Player 2) - only for Goals */}
              {eventType === 'Goal' && (
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium font-normal">Assist Provider (Optional)</label>
                  <select
                    value={eventPlayer2}
                    onChange={(e) => setEventPlayer2(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-300 outline-none"
                  >
                    <option value="">-- No play assist --</option>
                    {activeEventRoster.filter(p => p.id !== eventPlayer1).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-event"
                  className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold px-4 py-2 rounded-xl"
                >
                  Confirm Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
