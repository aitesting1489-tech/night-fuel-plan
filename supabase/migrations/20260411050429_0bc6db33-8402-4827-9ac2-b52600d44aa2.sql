
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  friend_code TEXT,
  weekly_volume_ml BIGINT,
  current_streak INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_vol AS (
    SELECT hl.user_id AS uid, SUM(hl.amount_ml)::BIGINT AS total_ml
    FROM public.hydration_logs hl
    WHERE hl.logged_at >= date_trunc('week', now())
    GROUP BY hl.user_id
  ),
  user_days AS (
    SELECT hl.user_id AS uid, hl.logged_at::date AS log_date
    FROM public.hydration_logs hl
    GROUP BY hl.user_id, hl.logged_at::date
  ),
  streaks AS (
    SELECT uid, COUNT(*)::INT AS streak
    FROM (
      SELECT uid, log_date, (now()::date - log_date) - ROW_NUMBER() OVER (PARTITION BY uid ORDER BY log_date DESC)::INT AS grp
      FROM user_days
    ) g
    WHERE grp = -1
    GROUP BY uid, grp
  )
  SELECT
    lp.user_id,
    lp.display_name,
    lp.friend_code,
    COALESCE(wv.total_ml, 0) AS weekly_volume_ml,
    COALESCE(s.streak, 0) AS current_streak
  FROM public.leaderboard_profiles lp
  LEFT JOIN week_vol wv ON wv.uid = lp.user_id
  LEFT JOIN streaks s ON s.uid = lp.user_id
  WHERE lp.opted_in = true;
$$;
