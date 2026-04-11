
CREATE TABLE public.movement_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tip_id TEXT NOT NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One completion per tip per shift per user
CREATE UNIQUE INDEX idx_movement_logs_unique ON public.movement_logs (user_id, tip_id, shift_date);

-- Index for streak queries
CREATE INDEX idx_movement_logs_user_date ON public.movement_logs (user_id, shift_date);

ALTER TABLE public.movement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movement logs"
ON public.movement_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movement logs"
ON public.movement_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own movement logs"
ON public.movement_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
