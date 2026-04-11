
-- Fix overly permissive tournament creation - restrict to prevent abuse
DROP POLICY "Anyone authenticated can create tournaments" ON public.game_tournaments;
CREATE POLICY "Authenticated users can create tournaments" ON public.game_tournaments
  FOR INSERT TO authenticated
  WITH CHECK (status = 'active');

-- The tournament_entries INSERT policy is already restricted to auth.uid() = user_id, which is fine.
-- No change needed there.
