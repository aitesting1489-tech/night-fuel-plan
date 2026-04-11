
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.water_intake_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2500,
  reminder_interval_minutes INTEGER NOT NULL DEFAULT 45,
  cup_size_ml INTEGER NOT NULL DEFAULT 300,
  body_weight_kg NUMERIC(5,1),
  use_weight_calculation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.water_intake_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_intake_settings' AND policyname = 'Users can view own water settings') THEN
    CREATE POLICY "Users can view own water settings"
    ON public.water_intake_settings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_intake_settings' AND policyname = 'Users can insert own water settings') THEN
    CREATE POLICY "Users can insert own water settings"
    ON public.water_intake_settings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_intake_settings' AND policyname = 'Users can update own water settings') THEN
    CREATE POLICY "Users can update own water settings"
    ON public.water_intake_settings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_water_intake_settings_updated_at') THEN
    CREATE TRIGGER update_water_intake_settings_updated_at
    BEFORE UPDATE ON public.water_intake_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
