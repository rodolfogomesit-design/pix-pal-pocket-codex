insert into public.user_roles (user_id, role)
select user_id, 'admin'::public.app_role
from public.profiles
where cpf = '742.239.503-63'
on conflict (user_id, role) do nothing;
