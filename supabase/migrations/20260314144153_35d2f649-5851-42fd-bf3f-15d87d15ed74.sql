
-- Platform settings table for configurable fees
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  label text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert settings"
  ON public.platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default fee values
INSERT INTO public.platform_settings (key, value, label) VALUES
  ('taxa_fixa_api', '0.99', 'Taxa fixa da API (R$)'),
  ('taxa_servico_percent', '1.99', 'Taxa de serviço (%)');
