
-- Chat messages between parents and kids
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('parent', 'kid')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Parents can see/send messages for their kids
CREATE POLICY "Parents can view chat messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM kids_profiles WHERE kids_profiles.id = chat_messages.kid_id AND kids_profiles.user_responsavel = auth.uid()
  ));

CREATE POLICY "Parents can send chat messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'parent' AND
    EXISTS (
      SELECT 1 FROM kids_profiles WHERE kids_profiles.id = chat_messages.kid_id AND kids_profiles.user_responsavel = auth.uid()
    )
  );

-- Allow anon for kid inserts via RPC
CREATE OR REPLACE FUNCTION public.kid_send_message(_kid_id uuid, _message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kids_profiles WHERE id = _kid_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Criança não encontrada');
  END IF;

  INSERT INTO chat_messages (kid_id, sender_type, message)
  VALUES (_kid_id, 'kid', _message);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
