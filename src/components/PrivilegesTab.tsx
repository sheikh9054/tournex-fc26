/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database } from '../server/db';
import { UserRole } from '../types';
import { Shield, ShieldAlert, Check, ShieldCheck, Mail, Calendar, Search } from 'lucide-react';

interface PrivilegesTabProps {
  db: Database;
  currentUserRole: UserRole;
  onRefresh: () => void;
}

export default function PrivilegesTab({ db, currentUserRole, onRefresh }: PrivilegesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successUserId, setSuccessUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Temporary local state to track adjusted roles before clicking save
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});

  const profiles = db.profiles || [];

  // If someone tried to bypass frontend tabs (security check)
  if (currentUserRole !== 'Super Admin') {
    return (
      <div className="border border-red-500/10 bg-red-500/[0.02] rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Access Restrained</h3>
        <p className="text-xs text-zinc-400">
          The Gamer Privilege Simulator and role delegation engine require Super Admin authorization. Your current status is logged as <span className="text-indigo-400 font-bold font-mono">{currentUserRole}</span>.
        </p>
      </div>
    );
  }

  // Filter list
  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleSelectLocal = (userId: string, val: string) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: val as UserRole
    }));
  };

  const handleSavePrivilege = async (userId: string) => {
    const roleToSave = selectedRoles[userId];
    if (!roleToSave) return; // No change made locally

    setUpdatingUserId(userId);
    setErrorMsg(null);
    setSuccessUserId(null);

    try {
      const res = await fetch('/api/admin/privileges/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: roleToSave }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessUserId(userId);
        onRefresh(); // fully sync database
        setTimeout(() => setSuccessUserId(null), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update user roles.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network state connection error.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const roleBadgeColors: Record<UserRole, string> = {
    'Super Admin': 'bg-rose-500/10 text-rose-450 border border-rose-550/20 text-rose-400',
    'League Admin': 'bg-amber-500/10 text-amber-450 border border-amber-550/20 text-amber-400',
    'Tournament Admin': 'bg-indigo-500/10 text-indigo-450 border border-indigo-550/20 text-indigo-450 text-indigo-400',
    'Team Manager': 'bg-emerald-500/10 text-emerald-450 border border-emerald-550/20 text-emerald-400',
    'Player': 'bg-zinc-800 text-zinc-300 border border-zinc-700/50',
    'Public Viewer': 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Gamer Privilege delegate system</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Establish authorization keys and promote gamers to specific administrator statuses instantly.
          </p>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="p-2 px-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* SEARCH AND INFORMATION BADGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search competitor profiles by name or email ID..."
            className="w-full bg-zinc-950 border border-[#27272a] hover:border-zinc-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all"
          />
        </div>

        {/* Informative Indicator details */}
        <div className="p-3 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/10 text-[11px] text-indigo-300 leading-normal flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-450 shrink-0 mt-0.5 text-indigo-400" />
          <span>
            <strong>Super Admin Privilege:</strong> Any profiles promoted to administrative roles acquire access to seed match scores and configure dynamic tournament trees.
          </span>
        </div>
      </div>

      {/* GAMERS TABLE LIST */}
      <div className="bg-[#0e0e11] border border-[#27272a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-zinc-950/40 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Competitor / Gamer Tag</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Current Authority</th>
                <th className="py-3 px-4 text-right">Delegate New Rights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/50">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => {
                  const currentLocalRole = selectedRoles[profile.id] || profile.role;
                  const hasChanged = currentLocalRole !== profile.role;
                  const isSuccess = successUserId === profile.id;
                  const isUpdating = updatingUserId === profile.id;

                  return (
                    <tr key={profile.id} className="hover:bg-zinc-900/30 text-xs transition duration-150">
                      
                      {/* Gamer Avatar & Name */}
                      <td className="py-4 px-4 sm:px-6 flex items-center gap-3">
                        <img
                          src={profile.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(profile.name)}`}
                          alt="avatar"
                          className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            {profile.name}
                            {profile.id === 'u1' && (
                              <span className="text-[9px] bg-red-500/10 text-red-400 px-1 rounded uppercase tracking-wide">Owner</span>
                            )}
                          </p>
                          <span className="text-[9px] text-zinc-500 font-mono tracking-wider">ID: {profile.id}</span>
                        </div>
                      </td>

                      {/* Contact / Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Mail className="w-3.5 h-3.5 text-zinc-650 text-zinc-500" />
                          <span className="underline">{profile.email}</span>
                        </div>
                        {profile.createdAt && (
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-mono mt-0.5">
                            <Calendar className="w-3 h-3 text-zinc-705 text-zinc-600" />
                            <span>Registered: {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </td>

                      {/* Role Privilege Badge */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${roleBadgeColors[profile.role]}`}>
                          {profile.role}
                        </span>
                      </td>

                      {/* Delegate Role Choice drop and Save */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={currentLocalRole}
                            disabled={profile.id === 'u1'} // Prevent self-demotion
                            onChange={(e) => handleRoleSelectLocal(profile.id, e.target.value)}
                            className="bg-zinc-950 border border-[#27272a] hover:border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
                          >
                            <option value="Player">Player (Gamer)</option>
                            <option value="Team Manager">Team Manager</option>
                            <option value="Tournament Admin">Tournament Admin</option>
                            <option value="League Admin">League Admin</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>

                          {profile.id !== 'u1' && (
                            <button
                              onClick={() => handleSavePrivilege(profile.id)}
                              disabled={!hasChanged || isUpdating}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                isSuccess
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : hasChanged
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-lg'
                                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                              }`}
                            >
                              {isUpdating ? (
                                <span className="animate-spin text-zinc-400">🌀</span>
                              ) : isSuccess ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <span>Apply</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-zinc-500 italic">
                    No competitor profile matched "{searchQuery}" query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
