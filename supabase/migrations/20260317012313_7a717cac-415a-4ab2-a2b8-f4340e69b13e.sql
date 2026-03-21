
-- Table to store per-user custom fee overrides
CREATE TABLE public.user_custom_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fee_key text NOT NULL,
  fee_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, fee_key)
);

-- Enable RLS
ALTER TABLE public.user_custom_fees ENABLE ROW LEVEL SECURITY;

-- Only admins can manage custom fees
CREATE POLICY "Admins can select custom fees"
ON public.user_custom_fees
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert custom fees"
ON public.user_custom_fees
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom fees"
ON public.user_custom_fees
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom fees"
ON public.user_custom_fees
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
