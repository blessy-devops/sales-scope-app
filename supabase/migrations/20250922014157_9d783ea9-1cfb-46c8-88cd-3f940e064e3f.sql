-- Create GA4 daily sessions table
CREATE TABLE public.ga4_daily_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date date NOT NULL,
  sessions integer NOT NULL,
  users integer,
  new_users integer,
  page_views integer,
  bounce_rate numeric(5,2),
  avg_session_duration numeric(10,2),
  organic_sessions integer,
  paid_sessions integer,
  direct_sessions integer,
  referral_sessions integer,
  social_sessions integer,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX idx_ga4_daily_sessions_date ON public.ga4_daily_sessions(session_date);
CREATE INDEX idx_ga4_daily_sessions_processed ON public.ga4_daily_sessions(processed_at);
CREATE INDEX idx_ga4_daily_sessions_date_sessions ON public.ga4_daily_sessions(session_date, sessions);

-- Trigger for updated_at
CREATE TRIGGER update_ga4_daily_sessions_updated_at
  BEFORE UPDATE ON public.ga4_daily_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ga4_daily_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view GA4 sessions"
  ON public.ga4_daily_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert GA4 sessions"
  ON public.ga4_daily_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update GA4 sessions"
  ON public.ga4_daily_sessions FOR UPDATE
  TO authenticated
  WITH CHECK (true);