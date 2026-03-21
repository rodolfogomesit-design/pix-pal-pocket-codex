
-- RPC: Rescue allowance (transfer from kid to parent)
CREATE OR REPLACE FUNCTION public.rescue_allowance(_kid_id UUID, _valor NUMERIC, _descricao TEXT DEFAULT 'Resgate de mesada')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  IF v_kid.is_frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conta congelada');
  END IF;

  IF _valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;

  IF v_kid.saldo < _valor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente do filho');
  END IF;

  UPDATE kids_profiles SET saldo = saldo - _valor WHERE id = _kid_id;
  UPDATE profiles SET saldo = saldo + _valor WHERE user_id = auth.uid();

  INSERT INTO transactions (tipo, from_kid, to_user, valor, descricao, status)
  VALUES ('mesada', _kid_id, auth.uid(), _valor, _descricao, 'aprovado');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Delete kid account
CREATE OR REPLACE FUNCTION public.delete_kid_account(_kid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kid kids_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_kid FROM kids_profiles WHERE id = _kid_id AND user_responsavel = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Filho não encontrado');
  END IF;

  DELETE FROM chat_messages WHERE kid_id = _kid_id;
  DELETE FROM chat_read_status WHERE kid_id = _kid_id;
  DELETE FROM savings_goals WHERE kid_id = _kid_id;
  DELETE FROM deposits WHERE kid_id = _kid_id;
  DELETE FROM transactions WHERE from_kid = _kid_id OR to_kid = _kid_id;
  DELETE FROM kids_profiles WHERE id = _kid_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
