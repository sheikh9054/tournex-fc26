/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Gamepad2, UserPlus, LogIn, Mail, User, ShieldAlert, KeyRound, Award, Eye, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';

interface GamerProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  password?: string;
}

interface LoginScreenProps {
  profiles: GamerProfile[];
  onLoginSuccess: (profile: GamerProfile) => void;
}

export default function LoginScreen({ profiles, onLoginSuccess }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'guest' | 'player'>('player');
  const [activeForm, setActiveForm] = useState<'signin' | 'signup'>('signin');
  
  // Dynamic mouse coordinates state
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

  // Registration state
  const [gamerTag, setGamerTag] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest Login Action
  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.profile);
      } else {
        setErrorMsg(data.error || 'Failed to authorize guest session.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection timeout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Action (Connected to Supabase Auth)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both Email and Password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1) Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // Safeguard: Verify we have an active session
      if (!data.session) {
        setErrorMsg('Authentication failed - email verification may be pending. Please check your inbox.');
        return;
      }

      // 2) Sync and register/set active session in local/server DB
      let res;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() }),
        });
      } catch (fetchErr: any) {
        throw new Error(`Failed to contact local backend auth service (${fetchErr.message || fetchErr}). Please ensure the server is fully started.`);
      }
      
      let resData;
      try {
        resData = await res.json();
      } catch (jsonErr) {
        throw new Error(`Server returned a non-JSON response (Status ${res.status}). This can occur if the backend database initialization is corrupt or crashed.`);
      }

      if (res.ok && resData.success) {
        onLoginSuccess(resData.profile);
        // 3) Redirect user to Home page ("/")
        window.history.pushState(null, '', '/');
      } else if (res.status === 404) {
        // Auto-provision profile on server side if authenticated via Supabase but missing in JSON database
        const emailPrefix = loginEmail.split('@')[0];
        const autoName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        const autoTeam = `${autoName} FC`;
        
        let registerRes;
        try {
          registerRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: autoName, 
              email: loginEmail.trim(),
              teamName: autoTeam,
              password: loginPassword.trim()
            }),
          });
        } catch (regFetchErr: any) {
          throw new Error(`Failed to auto-register backend profile: ${regFetchErr.message || regFetchErr}`);
        }

        let registerData;
        try {
          registerData = await registerRes.json();
        } catch (regJsonErr) {
          throw new Error(`Local backend registration endpoint crashed with Status ${registerRes.status}.`);
        }

        if (registerRes.ok && registerData.success) {
          onLoginSuccess(registerData.profile);
          window.history.pushState(null, '', '/');
        } else {
          setErrorMsg(registerData.error || 'Failed to sync authenticated competitor profile.');
        }
      } else {
        setErrorMsg(resData.error || 'Invalid credentials or competitor profile.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Database verification error: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Developer / Demonstration Bypass Login
  const handleQuickLogin = async (userId: string) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.profile);
      } else {
        setErrorMsg(data.error || 'Failed to authenticate quick selector.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server timeout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up / Register Action (Connected to Supabase Auth)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamerTag.trim() || !emailAddress.trim() || !teamName.trim() || !password.trim()) {
      setErrorMsg('Please specify Gamer Tag, Team Name, Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1) Sign Up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: emailAddress.trim(),
        password: password.trim(),
        options: {
          data: {
            display_name: gamerTag.trim(),
            team_name: teamName.trim()
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // Save email to pre-fill on the sign-in form
      const savedEmail = emailAddress.trim();
      setLoginEmail(savedEmail);

      // Set explicit success message for confirmation and check active session
      setSuccessMsg("Your account has been created. Please check your email and verify your address before logging in.");

      // Clear registration inputs
      setGamerTag('');
      setEmailAddress('');
      setTeamName('');
      setPassword('');

      // Redirect user to the Sign In form
      setActiveForm('signin');

    } catch (err) {
      console.error(err);
      setErrorMsg('Network error registering custom profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-[#fafafa] p-4 font-sans relative overflow-hidden">
      
      {/* Option 1: Interactive Mouse spotlight glow following cursor */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-80 transition-opacity duration-305"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 75%)`
        }}
      />
      
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Core Form Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-[#0e0e11] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Esports Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-mono tracking-widest text-[#818cf8] uppercase">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>EA Sports FC 26 Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase flex items-center justify-center gap-2">
            🏆 TOURNEX <span className="text-indigo-400 font-bold font-sans text-[10px] lowercase px-2 py-0.5 bg-zinc-900 rounded-md tracking-normal border border-white/5">fc26</span>
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Dynamic tournament ladders, automated standing calculations, and live statistics exclusively optimized for FC 26 gamers.
          </p>
        </div>

        {/* First Gate Selection: Player vs Guest */}
        <div className="grid grid-cols-2 bg-[#18181b] p-1 rounded-xl border border-[#27272a] gap-1">
          <button
            onClick={() => { setLoginMode('player'); setErrorMsg(''); }}
            className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
              loginMode === 'player'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Competitor Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('guest'); setErrorMsg(''); }}
            className={`py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
              loginMode === 'guest'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Guest Viewer</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="space-y-3">
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium text-center">
              ⚠️ {errorMsg}
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl text-[11px] text-zinc-300 space-y-2">
              <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10px] font-mono">🔧 Supabase Environment & Setup Guide</span>
              <p className="leading-relaxed">
                If you are running your own Supabase database or encounter auth failures, verify these three critical setup points in your Supabase project:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-[10px] pl-1">
                <li>
                  <strong className="text-zinc-200">Disable Email Confirmation:</strong> Go to your <span className="text-white">Supabase Dashboard &gt; Authentication &gt; Providers &gt; Email</span> and <strong>toggle off</strong> <span className="text-indigo-300">Confirm email</span>. This allows new signups to log in instantly without waiting for a confirmation email.
                </li>
                <li>
                  <strong className="text-zinc-200">Set Environment Variables:</strong> Ensure you have provided your Supabase credentials in your server environment:
                  <div className="bg-black/40 p-2 rounded border border-white/5 font-mono text-[9px] text-[#818cf8] mt-1 space-y-0.5">
                    <div>VITE_SUPABASE_URL=your_project_url</div>
                    <div>VITE_SUPABASE_ANON_KEY=your_anon_public_key</div>
                  </div>
                </li>
                <li>
                  <strong className="text-zinc-200">Load Database Tables:</strong> Open your <span className="text-white">Supabase SQL Editor</span>, paste the contents of the <code>supabase_schema.sql</code> file, and run it to create the required <code>profiles</code>, <code>teams</code>, and <code>players</code> tables.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Global Success / Verify Notice */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold text-center">
            📬 {successMsg}
          </div>
        )}

        {loginMode === 'guest' ? (
          /* GUEST MODE INTERFACE */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 text-center p-4 bg-zinc-950/40 rounded-2xl border border-white/5"
          >
            <ShieldAlert className="w-10 h-10 text-zinc-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Explore as a Public Guest</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                You will log in with read-only access. You can view real-time brackets, standings, and match tables, but cannot submit scorings, change privileges, or modify tournaments.
              </p>
            </div>
            
            {/* Core Capability Comparison Grid */}
            <div className="text-left bg-zinc-950 p-3.5 rounded-xl border border-white/5 space-y-3 mt-4 text-xs">
              <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block border-b border-white/5 pb-1.5">Authorization Level Matrix</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-bold text-rose-400 flex items-center gap-1">❌ Guest Viewer</p>
                  <ul className="text-[10px] text-zinc-400 space-y-1 ml-1 list-disc list-inside">
                    <li>Read-Only Viewport</li>
                    <li>No Score Reporting</li>
                    <li>No Team Registration</li>
                    <li>No Achievements</li>
                  </ul>
                </div>
                <div className="space-y-2 border-l border-white/5 pl-4">
                  <p className="font-bold text-emerald-400 flex items-center gap-1">⚡ Registered Gamer</p>
                  <ul className="text-[10px] text-zinc-400 space-y-1 ml-1 list-disc list-inside">
                    <li>Full Action Control</li>
                    <li>Report Match Scores</li>
                    <li>Register New Teams</li>
                    <li>Unlock Badges & MVP</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider text-white py-3 rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Entering Arena...' : 'Authenticate as Guest'}</span>
              <Award className="w-4 h-4 text-zinc-400" />
            </button>
          </motion.div>
        ) : (
          /* PLAYER MODE INTERFACE (SIGN IN OR SIGN UP) */
          <div className="space-y-5">
            {/* Form Toggle Selection */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {activeForm === 'signin' ? 'Registered Gamer Access' : 'Create Competitor ID'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveForm(activeForm === 'signin' ? 'signup' : 'signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {activeForm === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>

            {activeForm === 'signin' ? (
              /* PLAYER DISCRETE SIGN IN */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-450 text-zinc-400 uppercase tracking-widest mb-1.5">Competitor Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="gamer@fc26.gg"
                        className="w-full bg-zinc-950 border border-[#27272a] hover:border-zinc-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-650 outline-none transition-all placeholder-zinc-650"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-455 text-zinc-400 uppercase tracking-widest mb-1.5">Compete Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-[#27272a] hover:border-zinc-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider text-white py-3 rounded-xl transition shadow-lg shadow-indigo-600/10 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In To League'}</span>
                  <Trophy className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* PLAYER DISCRETE SIGN UP */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gamer Tag Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        maxLength={20}
                        value={gamerTag}
                        onChange={(e) => setGamerTag(e.target.value)}
                        placeholder="e.g. TekkzPrime"
                        className="w-full bg-zinc-950 border border-[#27272a] focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Your Representing Team</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        maxLength={25}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Fnatic FC"
                        className="w-full bg-zinc-950 border border-[#27272a] focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="e.g. comp@fc26.gg"
                      className="w-full bg-zinc-950 border border-[#27272a] focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-650 outline-none transition-all placeholder-zinc-650"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Compete password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full bg-zinc-950 border border-[#27272a] focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider text-white py-2.5 rounded-xl transition shadow shadow-indigo-600/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>{isSubmitting ? 'Registering Player...' : 'Create Competitor Profile'}</span>
                  <UserPlus className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Demonstration Portlets */}
            <div className="border-t border-[#27272a] pt-4 mt-2">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 block mb-2">Simulated Testing Profiles</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {profiles.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickLogin(p.id)}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-[#27272a] rounded-lg shrink-0 text-left text-[11px] group transition-all"
                  >
                    <div className="font-bold text-white group-hover:text-indigo-400 truncate w-24">{p.name}</div>
                    <div className="text-[9px] text-[#71717a] lowercase">{p.role === 'Super Admin' ? 'SuperAdmin' : 'Competitor'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
