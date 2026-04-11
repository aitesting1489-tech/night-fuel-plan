
-- Turn-based challenges
CREATE TABLE public.game_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'catch',
  challenger_score INTEGER,
  opponent_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours')
);

ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.game_challenges
  FOR SELECT TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges" ON public.game_challenges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update challenges they're in" ON public.game_challenges
  FOR UPDATE TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Live head-to-head sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL,
  player2_id UUID,
  game_type TEXT NOT NULL DEFAULT 'catch',
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sessions" ON public.game_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create sessions" ON public.game_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Players can update their session" ON public.game_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Creator can delete waiting sessions" ON public.game_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = player1_id AND status = 'waiting');

-- Enable realtime for live matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Weekly tournaments
CREATE TABLE public.game_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'catch',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start, game_type)
);

ALTER TABLE public.game_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view tournaments" ON public.game_tournaments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can create tournaments" ON public.game_tournaments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Tournament entries
CREATE TABLE public.tournament_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.game_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view entries" ON public.tournament_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own entries" ON public.tournament_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON public.tournament_entries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at on game_sessions
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on tournament_entries
CREATE TRIGGER update_tournament_entries_updated_at
  BEFORE UPDATE ON public.tournament_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
