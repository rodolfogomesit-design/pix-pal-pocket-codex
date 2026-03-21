
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule cron job for chat cleanup every hour
SELECT cron.schedule(
  'cleanup-old-chat-messages',
  '0 * * * *',
  $$SELECT public.cleanup_old_chat_messages()$$
);
