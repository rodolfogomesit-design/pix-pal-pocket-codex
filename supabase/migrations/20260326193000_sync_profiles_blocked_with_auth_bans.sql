update public.profiles p
set is_blocked = true
from auth.users u
where p.user_id = u.id
  and u.banned_until is not null
  and u.banned_until > now()
  and coalesce(p.is_blocked, false) = false;
