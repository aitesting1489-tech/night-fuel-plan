
-- Leaderboard opt-in profiles
CREATE TABLE public.leaderboard_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  opted_in BOOLEAN NOT NULL DEFAULT true,
  friend_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view opted-in leaderboard profiles"
  ON public.leaderboard_profiles FOR SELECT TO authenticated
  USING (opted_in = true);

CREATE POLICY "Users can insert own leaderboard profile"
  ON public.leaderboard_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard profile"
  ON public.leaderboard_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile even if not opted in"
  ON public.leaderboard_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_leaderboard_profiles_updated_at
  BEFORE UPDATE ON public.leaderboard_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Friend connections
CREATE TABLE public.friend_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id),
  CHECK (user_id <> friend_user_id)
);

ALTER TABLE public.friend_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend connections"
  ON public.friend_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

CREATE POLICY "Users can insert own friend connections"
  ON public.friend_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own friend connections"
  ON public.friend_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

-- Function to get leaderboard stats (weekly volume + current streak)
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  friend_code TEXT,
  weekly_volume_ml BIGINT,
  current_streak INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE := date_trunc('week', now());
BEGIN
  RETURN QUERY
  SELECT
    lp.user_id,
    lp.display_name,
    lp.friend_code,
    COALESCE(wv.total_ml, 0)::BIGINT AS weekly_volume_ml,
    COALESCE(cs.streak, 0)::INT AS current_streak
  FROM public.leaderboard_profiles lp
  LEFT JOIN (
    SELECT hl.user_id AS uid, SUM(hl.amount_ml) AS total_ml
    FROM public.hydration_logs hl
    WHERE hl.logged_at >= week_start
    GROUP BY hl.user_id
  ) wv ON wv.uid = lp.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS streak
    FROM (
      SELECT d.day_date
      FROM generate_series(
        (now() - interval '365 days')::date,
        now()::date,
        '1 day'
      ) AS d(day_date)
      WHERE EXISTS (
        SELECT 1 FROM public.hydration_logs hl2
        WHERE hl2.user_id = lp.user_id
          AND hl2.logged_at::date = d.day_date
      )
      ORDER BY d.day_date DESC
    ) consecutive_days
    WHERE consecutive_days.day_date >= (now()::date - (
      SELECT COUNT(*)::INT FROM (
        SELECT d2.day_date
        FROM generate_series(now()::date - 365, now()::date, '1 day') AS d2(day_date)
        WHERE EXISTS (
          SELECT 1 FROM public.hydration_logs hl3
          WHERE hl3.user_id = lp.user_id AND hl3.logged_at::date = d2.day_date
        )
        ORDER BY d2.day_date DESC
      ) sub
      WHERE sub.day_date = now()::date - (row_number() OVER (ORDER BY sub.day_date DESC) - 1)::int
    ) + 1)
  ) cs ON true
  WHERE lp.opted_in = true;
END;
$$;
