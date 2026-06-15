-- =======================================================
-- TOURNEX PLATFORM - SUPABASE SCHEMA & RLS POLICIES
-- =======================================================

-- 1. PROFILES TABLE
-- Stores competitor profiles, usernames, emails, and roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  password TEXT,
  user_id UUID DEFAULT auth.uid()
);

-- 2. TEAMS TABLE
-- Stores competitive team rosters/clubs
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "logoUrl" TEXT,
  "managerId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid()
);

-- 3. PLAYERS TABLE
-- Stores individual gamer players, stats, and achievements
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "photoUrl" TEXT,
  "teamId" TEXT,
  sport TEXT NOT NULL,
  stats JSONB NOT NULL,
  achievements JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid()
);

-- 4. TOURNAMENTS TABLE
-- Stores tournament bracket states, statuses, seeding records, and brackets type
CREATE TABLE IF NOT EXISTS public.tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  "maxTeams" INTEGER NOT NULL,
  "teamIds" JSONB DEFAULT '[]'::jsonb,
  seeding JSONB DEFAULT '{}'::jsonb,
  "createdBy" TEXT,
  "championId" TEXT,
  "runnerUpId" TEXT,
  "thirdPlaceId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid()
);

-- 5. LEAGUES TABLE
-- Stores round-robin competitive league lists and season schedules
CREATE TABLE IF NOT EXISTS public.leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL,
  "createdBy" TEXT,
  "teamIds" JSONB DEFAULT '[]'::jsonb,
  seasons JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid()
);

-- 6. MATCHES TABLE
-- Stores individual tournament brackets matches, league playdays, and friendlies
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  "referenceId" TEXT,
  round INTEGER,
  stage TEXT,
  "team1Id" TEXT NOT NULL,
  "team2Id" TEXT NOT NULL,
  "team1Score" INTEGER,
  "team2Score" INTEGER,
  status TEXT NOT NULL,
  "scheduledTime" TEXT,
  "durationMinutes" INTEGER,
  timeline JSONB DEFAULT '[]'::jsonb,
  "mvpId" TEXT,
  notes TEXT,
  "bracketMatchIndex" INTEGER,
  "nextMatchId" TEXT,
  "nextMatchTeamSlot" INTEGER,
  "isByeMatch" BOOLEAN DEFAULT false,
  "loserNextMatchId" TEXT,
  "loserNextMatchTeamSlot" INTEGER,
  "team1YellowCards" INTEGER,
  "team1RedCards" INTEGER,
  "team2YellowCards" INTEGER,
  "team2RedCards" INTEGER,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID DEFAULT auth.uid()
);

-- 7. NOTIFICATIONS TABLE
-- Stores dynamic user & system notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  auth_user_id UUID DEFAULT auth.uid()
);

-- 8. ACTIVITY LOGS TABLE
-- Stores administrative audit log trails
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  auth_user_id UUID DEFAULT auth.uid()
);

-- Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies to grant read access to anyone (Public Selector/Guest) and write access to authenticated users and backend sync

-- Profiles
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Teams
CREATE POLICY "Allow public select on teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on teams" ON public.teams FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Players
CREATE POLICY "Allow public select on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on players" ON public.players FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Tournaments
CREATE POLICY "Allow public select on tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on tournaments" ON public.tournaments FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Leagues
CREATE POLICY "Allow public select on leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on leagues" ON public.leagues FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Matches
CREATE POLICY "Allow public select on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on matches" ON public.matches FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Notifications
CREATE POLICY "Allow public select on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on notifications" ON public.notifications FOR ALL USING (auth.uid() = auth_user_id OR auth_user_id IS NULL) WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);

-- Activity Logs
CREATE POLICY "Allow public select on activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow write access for authenticated users and backend on activity_logs" ON public.activity_logs FOR ALL USING (auth.uid() = auth_user_id OR auth_user_id IS NULL) WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);
