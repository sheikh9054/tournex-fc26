/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database } from './server/db';
import { UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import PrivilegesTab from './components/PrivilegesTab';
import StatsDashboard from './components/StatsDashboard';
import BracketsTab from './components/BracketsTab';
import LeaguesTab from './components/LeaguesTab';
import MatchesTab from './components/MatchesTab';
import { supabase, alignSupabaseConfig } from './supabaseClient';
import { 
  Trophy, Sparkles, Gamepad2, Bell, RotateCcw, 
  ShieldAlert, Zap, Compass, SwatchBook, TrendingUp,
  RefreshCw, LayoutGrid, CheckCircle, ShieldCheck, Eye
} from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'brackets' | 'leagues' | 'matches' | 'privileges'>('analytics');
  
  // Real authenticated user state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: UserRole; avatarUrl?: string } | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic interactive mouse spotlight coordinates state
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Sync Database from Server
  const fetchDatabase = async () => {
    setIsSyncing(true);
    try {
      // 1) Verify the active Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // 2) Sync database info from the server
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data && data.db) {
        setDb(data.db);
        if (data.currentUser) {
          // If the logged-in user is a competitor (role !== 'Public Viewer' and id !== 'guest'),
          // they must have a valid Supabase Auth session. If not, protect pages and sign them out.
          if (data.currentUser.id !== 'guest' && !sessionData?.session) {
            await fetch('/api/auth/logout', { method: 'POST' });
            setCurrentUser(null);
          } else {
            setCurrentUser(data.currentUser);
          }
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error("Error fetching database:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      await alignSupabaseConfig();
      await fetchDatabase();
    };
    initApp();
    
    // Connect to genuine server-sent real-time channel
    const eventSource = new EventSource('/api/realtime');
    eventSource.onmessage = (event) => {
      if (event.data === 'refresh') {
         fetchDatabase();
      }
    };
    
    // Poll fallback every 30 seconds
    const interval = setInterval(fetchDatabase, 30000);
    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('tournex_user_email');
      localStorage.removeItem('tournex_user_id');
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setActiveTab('analytics');
      fetchDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Clear server notifications
  const handleClearNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamically compile tabs depending on whether they are a Super Admin
  const menuTabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'analytics', label: 'Dashboard Overview', icon: LayoutGrid },
    { id: 'brackets', label: 'Tournament Trees', icon: Trophy },
    { id: 'leagues', label: 'Leagues & Seasons', icon: SwatchBook },
    { id: 'matches', label: 'Match Control Room', icon: Gamepad2 }
  ];

  if (currentUser?.role === 'Super Admin') {
    menuTabs.push({ id: 'privileges' as const, label: 'Gamer Privileges', icon: ShieldCheck });
  }

  const unreadNotifsCount = db?.notifications ? db.notifications.filter(n => !n.read).length : 0;

  if (!loading && !currentUser) {
    return (
      <LoginScreen 
        profiles={db?.profiles || []}
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          fetchDatabase();
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-[#fafafa] font-sans overflow-hidden relative">
      
      {/* Option 1: Interactive Mouse spotlight glow following cursor */}
      <div 
        className="pointer-events-none fixed inset-0 z-10 opacity-70 transition-opacity duration-300"
        style={{
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 75%)`
        }}
      />
      
      {/* Sidebar Navigation - Visible on lg+ devices */}
      <aside className="w-68 h-full border-r border-[#27272a] hidden lg:flex flex-col bg-[#09090b] shrink-0">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#27272a]">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight uppercase text-white block">Tournex</span>
            <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase block -mt-1">FC 26 Arena</span>
          </div>
        </div>

        {/* Sync Status Badge in Sidebar */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between gap-1.5 text-[10px] text-zinc-400 font-mono bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a]">
            <span className="flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Database Live'}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-[#71717a] font-semibold mb-3 ml-2">Competitive Hub</div>
          {menuTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-[#27272a] text-white border border-[#3f3f46]/40 shadow-sm shadow-black/20'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-indigo-400 scale-110' : 'text-[#71717a] group-hover:text-zinc-300'}`} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout Action */}
        {currentUser && (
          <div className="p-4 border-t border-[#27272a] bg-[#0d0d0f] space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt="avatar"
                className="w-9 h-9 rounded-lg bg-zinc-950 border border-[#27272a]"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-400 font-mono tracking-wider capitalize truncate">{currentUser.role}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-1.5 border border-zinc-850 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900/60 text-[10px] uppercase font-bold tracking-widest rounded-lg text-zinc-400 hover:text-rose-400 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#18181b] via-[#09090b] to-[#09090b] overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-[#27272a] flex items-center justify-between px-4 sm:px-8 bg-[#09090b]/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile Branding */}
              <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-white tracking-widest uppercase">TOURNEX</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-[#71717a]">
              <span>Arena</span>
              <span>/</span>
              <span className="capitalize text-zinc-300 font-semibold">{activeTab === 'analytics' ? 'Dashboard Overview' : activeTab}</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-[#27272a]"></div>
            <div className="hidden md:block text-[10px] font-mono font-semibold text-indigo-400 uppercase tracking-widest">
              FC 26 Competitor Lounge
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Sync Refresh Trigger */}
            <button
              id="refresh-database-btn"
              onClick={fetchDatabase}
              className="bg-[#18181b] hover:bg-[#27272a] text-zinc-300 p-2 rounded-xl border border-[#27272a] transition cursor-pointer"
              title="Force Sync State"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                id="btn-bell-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-[#18181b] hover:bg-[#27272a] text-zinc-200 p-2 rounded-xl border border-[#27272a] transition relative cursor-pointer"
              >
                <span className="text-sm">🔔</span>
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown panel */}
              {showNotifications && (
                <div id="notifications-box" className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-[#27272a] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Activity Feed Alerts</span>
                    {unreadNotifsCount > 0 && (
                      <button 
                        onClick={handleClearNotifications}
                        className="text-[10px] text-rose-400 hover:underline font-mono"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {db?.notifications && db.notifications.length > 0 ? (
                      [...db.notifications].reverse().map(n => (
                        <div key={n.id} className="text-xs p-2.5 rounded-xl bg-zinc-950/40 border border-[#27272a] space-y-1">
                          <p className="font-semibold text-zinc-200">{n.title}</p>
                          <p className="text-zinc-400 leading-normal text-[11px]">{n.message}</p>
                          <span className="text-[9px] text-zinc-600 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic text-center py-4">No recent notification alerts.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Responsive User Dropdown Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  id="btn-user-toggle"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 bg-[#18181b] hover:bg-[#27272a] p-1.5 rounded-xl border border-[#27272a] transition cursor-pointer animate-fade-in"
                >
                  <img
                    src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.name)}`}
                    alt="avatar"
                    className="w-5 h-5 rounded bg-zinc-950 border border-[#27272a]"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-zinc-300 max-w-[90px] truncate">
                    {currentUser.name}
                  </span>
                </button>

                {showUserDropdown && (
                  <div id="user-dropdown-box" className="absolute right-0 mt-3 w-56 bg-[#121214] border border-[#27272a] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                    <div className="border-b border-white/5 pb-2">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider mt-0.5">{currentUser.role}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleSignOut();
                      }}
                      className="w-full py-1.5 border border-zinc-850 hover:border-[#f43f5e]/30 bg-zinc-950 hover:bg-[#rose-500]/5 text-[10px] uppercase font-bold tracking-widest rounded-lg text-zinc-400 hover:text-rose-400 transition cursor-pointer text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </header>

        {/* Scrollable Main Content Space */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          
          {/* Mobile Tab Selectors (Horizontal list shown only on smaller screens) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto border-b border-[#27272a] pb-2 text-xs">
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-650 text-white font-bold bg-indigo-600'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Role Difference & Privilege Information Banner */}
          {currentUser && (
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all relative overflow-hidden backdrop-blur-md ${
              currentUser.role === 'Public Viewer' 
                ? 'bg-zinc-950/40 border-zinc-500/10 hover:border-zinc-500/25 shadow-sm' 
                : currentUser.role === 'Super Admin'
                ? 'bg-rose-950/10 border-rose-500/10 hover:border-rose-500/25 shadow-sm'
                : 'bg-indigo-950/10 border-indigo-500/10 hover:border-indigo-500/25 shadow-sm'
            }`}>
              {/* Decorative radial gradient behind banner */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-transparent to-[#1f1f23]/5 pointer-events-none" />
              
              <div className="flex items-start gap-3 relative z-10">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  currentUser.role === 'Public Viewer' 
                    ? 'bg-zinc-800 text-zinc-400' 
                    : currentUser.role === 'Super Admin'
                    ? 'bg-rose-500/10 text-rose-450'
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  {currentUser.role === 'Public Viewer' ? (
                    <Eye className="w-5 h-5 text-zinc-400" />
                  ) : currentUser.role === 'Super Admin' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#71717a] uppercase">
                      Session Scope:
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase tracking-wide ${
                      currentUser.role === 'Public Viewer' 
                        ? 'bg-zinc-850 text-zinc-400 border border-zinc-700/30' 
                        : currentUser.role === 'Super Admin'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {currentUser.role === 'Public Viewer' ? 'Public Guest Viewer (Read-Only)' : `${currentUser.role} Account`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-normal">
                    {currentUser.role === 'Public Viewer' ? (
                      <span>
                        <strong>Read-Only Experience:</strong> As a Guest, you can inspect full standings, brackets, and statistics. However, scheduling friendly matches or modifying result forms is locked. <strong>Want to write?</strong> Click <em>Sign Out</em> and select a <strong>Competitor Profile</strong> or sign-up!
                      </span>
                    ) : currentUser.role === 'Super Admin' ? (
                      <span>
                        <strong>Master Overlord Account:</strong> You possess master override privileges. You can instantly overwrite any tournament bracket results, re-evaluate league metrics, change other gamers' administrative roles, and utilize AI prediction features.
                      </span>
                    ) : (
                      <span>
                        <strong>Gamer Competitor Lounge enabled:</strong> You can schedule friendlies and submit live timeline scores on matches. Feel free to cooperate, or request a <strong>Super Admin</strong> to grant you full administrative access to locking tournament brackets!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10 shrink-0 w-full md:w-auto">
                {currentUser.role === 'Public Viewer' ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    🔑 Upgrade Session
                  </button>
                ) : currentUser.role !== 'Super Admin' ? (
                  <div className="p-2 py-1.5 bg-indigo-550/[0.02] border border-indigo-500/10 text-[9px] text-[#818cf8] font-mono tracking-wide w-full md:w-auto text-center rounded-xl">
                    💡 Request Super-Admin permission to edit tournaments
                  </div>
                ) : (
                  <div className="p-2 py-1.5 bg-rose-500/[0.02] border border-rose-500/10 text-[9px] text-rose-400 font-mono tracking-wide w-full md:w-auto text-center rounded-xl">
                    ✨ Administrative Access Granted
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETAILED ACTIVE WORKSPACES */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-24 bg-[#18181b] border border-[#27272a] rounded-xl" />
                <div className="h-24 bg-[#18181b] border border-[#27272a] rounded-xl" />
                <div className="h-24 bg-[#18181b] border border-[#27272a] rounded-xl" />
                <div className="h-24 bg-indigo-600/10 border border-indigo-500/20 rounded-xl" />
              </div>
              <div className="h-80 bg-[#18181b]/50 border border-[#27272a] rounded-xl" />
            </div>
          ) : db && currentUser ? (
            <div className="space-y-6">
              {activeTab === 'analytics' && <StatsDashboard db={db} />}
              {activeTab === 'brackets' && (
                <BracketsTab 
                  db={db} 
                  currentUserRole={currentUser.role} 
                  currentUserId={currentUser.id} 
                  onRefresh={fetchDatabase} 
                />
              )}
              {activeTab === 'leagues' && (
                <LeaguesTab 
                  db={db} 
                  currentUserRole={currentUser.role} 
                  onRefresh={fetchDatabase} 
                />
              )}
              {activeTab === 'matches' && (
                <MatchesTab 
                  db={db} 
                  currentUserRole={currentUser.role} 
                  currentUserId={currentUser.id} 
                  onRefresh={fetchDatabase} 
                />
              )}
              {activeTab === 'privileges' && (
                <PrivilegesTab 
                  db={db} 
                  currentUserRole={currentUser.role} 
                  onRefresh={fetchDatabase} 
                />
              )}
            </div>
          ) : (
            <div className="border border-red-500/10 bg-red-500/[0.02] rounded-2xl p-6 text-center space-y-2 max-w-md mx-auto">
              <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="font-bold text-white">Database Offline</h3>
              <p className="text-xs text-zinc-400">Failed to establish connection with local JSON store. Re-boot dev server to retrieve seeds.</p>
            </div>
          )}

          {/* FOOTER */}
          <footer className="border-t border-[#27272a] pt-6 pb-2 text-center text-xs text-zinc-650 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
            <p>© 2026 TOURNEX FC 26 Match Arena. Verified Full-Stack Prototype.</p>
            <div className="flex gap-4 text-[10px] text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Live Session Secured</span>
            </div>
          </footer>

        </div>

      </div>

    </div>
  );
}

