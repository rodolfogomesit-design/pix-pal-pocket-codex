
-- Track when parent last read each kid's chat
CREATE TABLE public.chat_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kid_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, kid_id)
);

ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own read status" ON public.chat_read_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own read status" ON public.chat_read_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status" ON public.chat_read_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
